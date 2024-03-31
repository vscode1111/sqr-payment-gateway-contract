// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SQRPaymentGateway is OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
  using SafeERC20 for IERC20;
  using MessageHashUtils for bytes32;
  using ECDSA for bytes32;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(
    address _newOwner,
    address _erc20Token,
    address _coldWallet,
    uint256 _balanceLimit
  ) public initializer {
    require(_newOwner != address(0), "New owner address can't be zero");
    require(_erc20Token != address(0), "ERC20 token address can't be zero");
    require(_coldWallet != address(0), "Cold wallet address can't be zero");

    __Ownable_init(_newOwner);
    __UUPSUpgradeable_init();
    erc20Token = IERC20(_erc20Token);
    coldWallet = _coldWallet;
    balanceLimit = _balanceLimit;
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

  //Variables, structs, modifiers, events------------------------

  IERC20 public erc20Token;
  address public coldWallet;
  uint256 public balanceLimit;
  uint256 public totalDeposited;
  uint256 public totalWithdrew;

  mapping(bytes32 => FundItem) private _balances;
  mapping(bytes32 => TransactionItem) private _transactionIds;
  mapping(bytes32 => uint32) private _depositNonces;
  mapping(bytes32 => uint32) private _withdrawNonces;

  struct FundItem {
    uint256 depositedAmount;
    uint256 withdrewAmount;
  }

  struct TransactionItem {
    uint256 amount;
  }

  modifier timeoutBlocker(uint32 timestampLimit) {
    require(block.timestamp <= timestampLimit, "Timeout blocker");
    _;
  }

  event ChangeBalanceLimit(address indexed sender, uint256 balanceLimit);
  event Deposit(address indexed account, uint256 amount);
  event Withdraw(address indexed account, address indexed to, uint256 amount);
  event ForceWithdraw(address indexed token, address indexed to, uint256 amount);

  //Read methods-------------------------------------------

  function changeBalanceLimit(uint256 _balanceLimit) external onlyOwner {
    balanceLimit = _balanceLimit;
    emit ChangeBalanceLimit(_msgSender(), _balanceLimit);
  }

  function fetchFundItem(string memory userId) external view returns (FundItem memory) {
    return _balances[getHash(userId)];
  }

  function getBalance() public view returns (uint256) {
    return erc20Token.balanceOf(address(this));
  }

  function balanceOf(string memory userId) external view returns (uint256) {
    FundItem storage fund = _balances[getHash(userId)];
    return fund.depositedAmount;
  }

  function getHash(string memory value) private pure returns (bytes32) {
    return keccak256(abi.encodePacked(value));
  }

  function getDepositNonce(string memory userId) public view returns (uint32) {
    return _depositNonces[getHash(userId)];
  }

  function getWithdrawNonce(string memory userId) public view returns (uint32) {
    return _withdrawNonces[getHash(userId)];
  }

  function fetchTransactionItem(
    string memory transactionId
  ) external view returns (TransactionItem memory) {
    return _transactionIds[getHash(transactionId)];
  }

  function getTransactionItem(
    string memory transactionId
  ) private view returns (bytes32, TransactionItem memory) {
    bytes32 transactionIdHash = getHash(transactionId);
    return (transactionIdHash, _transactionIds[transactionIdHash]);
  }

  function _setTransactionId(uint256 amount, string memory transactionId) private {
    (bytes32 transactionIdHash, TransactionItem memory transactionItem) = getTransactionItem(
      transactionId
    );
    require(transactionItem.amount == 0, "This transactionId was used before");
    _transactionIds[transactionIdHash] = TransactionItem(amount);
  }

  //Write methods-------------------------------------------

  function _deposit(
    string memory userId,
    string memory transactionId,
    address account,
    uint256 amount,
    uint32 nonce,
    uint32 timestampLimit
  ) private nonReentrant timeoutBlocker(timestampLimit) {
    require(amount > 0, "Amount must be greater than zero");

    require(
      erc20Token.allowance(account, address(this)) >= amount,
      "User must allow to use of funds"
    );

    require(erc20Token.balanceOf(account) >= amount, "User must have funds");

    _setTransactionId(amount, transactionId);

    bytes32 userHash = getHash(userId);

    require(_depositNonces[userHash] == nonce, "Nonce isn't correct");
    _depositNonces[userHash] += 1;

    FundItem storage fund = _balances[userHash];
    fund.depositedAmount += amount;
    totalDeposited += amount;

    uint256 contractBalance = getBalance();
    uint256 supposedBalance = contractBalance + amount;

    if (supposedBalance > balanceLimit) {
      uint256 userToContractAmount = 0;
      uint256 userToColdWalletAmount = supposedBalance - balanceLimit;
      uint256 contractToColdWalletAmount = 0;

      if (amount > userToColdWalletAmount) {
        userToContractAmount = amount - userToColdWalletAmount;
      } else {
        userToColdWalletAmount = amount;
        contractToColdWalletAmount = contractBalance - balanceLimit;
      }

      if (userToContractAmount > 0) {
        erc20Token.safeTransferFrom(account, address(this), userToContractAmount);
      }
      if (userToColdWalletAmount > 0) {
        erc20Token.safeTransferFrom(account, coldWallet, userToColdWalletAmount);
      }
      if (contractToColdWalletAmount > 0) {
        erc20Token.safeTransfer(coldWallet, contractToColdWalletAmount);
      }
    } else {
      erc20Token.safeTransferFrom(account, address(this), amount);
    }

    emit Deposit(account, amount);
  }

  function deposit(
    string memory userId,
    string memory transactionId,
    address account,
    uint256 amount,
    uint32 nonce,
    uint32 timestampLimit
  ) external onlyOwner {
    _deposit(userId, transactionId, account, amount, nonce, timestampLimit);
  }

  function verifyDepositSignature(
    string memory userId,
    string memory transactionId,
    address account,
    uint256 amount,
    uint32 nonce,
    uint32 timestampLimit,
    bytes memory signature
  ) private view returns (bool) {
    bytes32 messageHash = keccak256(
      abi.encode(userId, transactionId, account, amount, nonce, timestampLimit)
    );
    address recover = messageHash.toEthSignedMessageHash().recover(signature);
    return recover == owner();
  }

  function depositSig(
    string memory userId,
    string memory transactionId,
    address account,
    uint256 amount,
    uint32 timestampLimit,
    bytes memory signature
  ) external {
    uint32 nonce = getDepositNonce(userId);
    require(
      verifyDepositSignature(
        userId,
        transactionId,
        account,
        amount,
        nonce,
        timestampLimit,
        signature
      ),
      "Invalid signature"
    );
    _deposit(userId, transactionId, account, amount, nonce, timestampLimit);
  }

  function _withdraw(
    string memory userId,
    string memory transactionId,
    address to,
    uint256 amount,
    uint32 nonce,
    uint32 timestampLimit
  ) private nonReentrant timeoutBlocker(timestampLimit) {
    require(amount > 0, "Amount must be greater than zero");
    require(erc20Token.balanceOf(address(this)) >= amount, "Contract must have sufficient funds");

    _setTransactionId(amount, transactionId);

    bytes32 userHash = getHash(userId);

    require(_withdrawNonces[userHash] == nonce, "Nonce isn't correct");
    _withdrawNonces[userHash] += 1;

    FundItem storage fund = _balances[userHash];
    fund.withdrewAmount += amount;
    totalWithdrew += amount;

    erc20Token.safeTransfer(to, amount);

    emit Withdraw(_msgSender(), to, amount);
  }

  function withdraw(
    string memory userId,
    string memory transactionId,
    address to,
    uint256 amount,
    uint32 nonce,
    uint32 timestampLimit
  ) external onlyOwner {
    _withdraw(userId, transactionId, to, amount, nonce, timestampLimit);
  }

  function verifyWithdrawSignature(
    string memory userId,
    string memory transactionId,
    address to,
    uint256 amount,
    uint32 nonce,
    uint32 timestampLimit,
    bytes memory signature
  ) private view returns (bool) {
    bytes32 messageHash = keccak256(
      abi.encode(userId, transactionId, to, amount, nonce, timestampLimit)
    );
    address recover = messageHash.toEthSignedMessageHash().recover(signature);
    return recover == owner();
  }

  function withdrawSig(
    string memory userId,
    string memory transactionId,
    address to,
    uint256 amount,
    uint32 timestampLimit,
    bytes memory signature
  ) external {
    uint32 nonce = getWithdrawNonce(userId);
    require(
      verifyWithdrawSignature(userId, transactionId, to, amount, nonce, timestampLimit, signature),
      "Invalid signature"
    );
    _withdraw(userId, transactionId, to, amount, nonce, timestampLimit);
  }

  function forceWithdraw(address token, address to, uint256 amount) external onlyOwner {
    IERC20 _token = IERC20(token);
    _token.safeTransfer(to, amount);
    emit ForceWithdraw(token, to, amount);
  }
}
