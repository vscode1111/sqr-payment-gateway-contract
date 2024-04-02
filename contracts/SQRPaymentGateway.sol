// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// import "hardhat/console.sol";

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
    uint256 _depositGoal, //0 - skip
    uint256 _withdrawGoal, //0 - skip
    uint32 _startDate, //0 - skip
    uint32 _closeDate, //0 - skip
    address _coldWallet,
    uint256 _balanceLimit
  ) public initializer {
    if (_newOwner == address(0)) {
      revert NewOwnerNotZeroAddress();
    }

    if (_erc20Token == address(0)) {
      revert ERC20TokenNotZeroAddress();
    }

    if (0 < _startDate && _startDate < uint32(block.timestamp)) {
      revert StartDateMustBeGreaterThanCurrentTime();
    }

    if (0 < _closeDate && _closeDate < uint32(block.timestamp)) {
      revert CloseDateMustBeGreaterThanCurrentTime();
    }

    if (_coldWallet == address(0)) {
      revert ColdWalletNotZeroAddress();
    }

    __Ownable_init(_newOwner);
    __UUPSUpgradeable_init();

    erc20Token = IERC20(_erc20Token);
    depositGoal = _depositGoal;
    withdrawGoal = _withdrawGoal;
    startDate = _startDate;
    closeDate = _closeDate;
    coldWallet = _coldWallet;
    balanceLimit = _balanceLimit;
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

  //Variables, structs, errors, modifiers, events------------------------

  IERC20 public erc20Token;
  address public coldWallet;
  uint256 public depositGoal;
  uint256 public withdrawGoal;
  uint32 public startDate;
  uint32 public closeDate;
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

  error NewOwnerNotZeroAddress();
  error ERC20TokenNotZeroAddress();
  error StartDateMustBeGreaterThanCurrentTime();
  error CloseDateMustBeGreaterThanCurrentTime();
  error ColdWalletNotZeroAddress();
  error TimeoutBlocker();
  error AmountNotZero();
  error InvalidSignature();
  error UsedTransactionId();
  error ContractMustHaveSufficientFunds();
  error UserMustAllowToUseFunds();
  error UserMustHaveFunds();
  error InvalidNonce();
  error AchievedDepositGoal();
  error AchievedWithdrawGoal();
  error TooEarly();
  error TooLate();

  modifier timeoutBlocker(uint32 timestampLimit) {
    if (block.timestamp > timestampLimit) {
      revert TimeoutBlocker();
    }
    _;
  }

  modifier amountChecker(uint256 amount) {
    if (amount == 0) {
      revert AmountNotZero();
    }
    _;
  }

  modifier periodBlocker() {
    if (startDate > 0 && block.timestamp < startDate) {
      revert TooEarly();
    }
    if (closeDate > 0 && block.timestamp > closeDate) {
      revert TooLate();
    }
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
    if (transactionItem.amount != 0) {
      revert UsedTransactionId();
    }
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
  ) private nonReentrant amountChecker(amount) timeoutBlocker(timestampLimit) periodBlocker {
    if (erc20Token.allowance(account, address(this)) < amount) {
      revert UserMustAllowToUseFunds();
    }

    if (erc20Token.balanceOf(account) < amount) {
      revert UserMustHaveFunds();
    }

    if (depositGoal > 0 && totalDeposited + amount > depositGoal) {
      revert AchievedDepositGoal();
    }

    _setTransactionId(amount, transactionId);

    bytes32 userHash = getHash(userId);

    if (_depositNonces[userHash] != nonce) {
      revert InvalidNonce();
    }

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
    if (
      !verifyDepositSignature(
        userId,
        transactionId,
        account,
        amount,
        nonce,
        timestampLimit,
        signature
      )
    ) {
      revert InvalidSignature();
    }
    _deposit(userId, transactionId, account, amount, nonce, timestampLimit);
  }

  function _withdraw(
    string memory userId,
    string memory transactionId,
    address to,
    uint256 amount,
    uint32 nonce,
    uint32 timestampLimit
  ) private nonReentrant amountChecker(amount) timeoutBlocker(timestampLimit) {
    if (erc20Token.balanceOf(address(this)) < amount) {
      revert ContractMustHaveSufficientFunds();
    }

    if (withdrawGoal > 0 && totalWithdrew + amount > withdrawGoal) {
      revert AchievedWithdrawGoal();
    }

    _setTransactionId(amount, transactionId);

    bytes32 userHash = getHash(userId);

    if (_withdrawNonces[userHash] != nonce) {
      revert InvalidNonce();
    }

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
    if (
      !verifyWithdrawSignature(userId, transactionId, to, amount, nonce, timestampLimit, signature)
    ) {
      revert InvalidSignature();
    }
    _withdraw(userId, transactionId, to, amount, nonce, timestampLimit);
  }

  function forceWithdraw(address token, address to, uint256 amount) external onlyOwner {
    IERC20 _token = IERC20(token);
    _token.safeTransfer(to, amount);
    emit ForceWithdraw(token, to, amount);
  }
}
