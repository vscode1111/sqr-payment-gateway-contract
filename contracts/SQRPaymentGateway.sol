// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IPermitToken} from "./interfaces/IPermitToken.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SQRPaymentGateway is OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
  using SafeERC20 for IPermitToken;
  using ECDSA for bytes32;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(
    address _newOwner,
    address _sqrToken,
    address _coldWallet,
    uint256 _balanceLimit
  ) public initializer {
    require(_newOwner != address(0), "New owner address can't be zero");
    require(_sqrToken != address(0), "SQR token address can't be zero");
    require(_coldWallet != address(0), "Cold wallet address can't be zero");

    __Ownable_init();
    __UUPSUpgradeable_init();
    _transferOwnership(_newOwner);
    sqrToken = IPermitToken(_sqrToken);
    coldWallet = _coldWallet;
    balanceLimit = _balanceLimit;
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

  //Variables, structs, modifiers, events------------------------
  IPermitToken public sqrToken;
  address public coldWallet;
  uint256 public balanceLimit;
  uint256 public depositTotal;
  uint256 public withdrawTotal;

  mapping(bytes32 => FundItem) private _balances;
  mapping(bytes32 => TransactionItem) private _transactionIds;

  struct FundItem {
    uint256 depositTotal;
    uint256 withdrawTotal;
  }

  struct TransactionItem {
    uint256 amount;
  }

  event ChangeBalanceLimit(address indexed sender, uint256 balanceLimit);

  event Deposit(address indexed account, uint256 amount);

  event Withdraw(address indexed account, address indexed to, uint256 amount);

  event ForceWithdraw(address indexed token, address indexed to, uint256 amount);

  //Functions-------------------------------------------

  function changeBalanceLimit(uint256 _balanceLimit) external onlyOwner {
    balanceLimit = _balanceLimit;
    emit ChangeBalanceLimit(_msgSender(), _balanceLimit);
  }

  function fetchFundItem(string memory userId) external view returns (FundItem memory) {
    return _balances[getHash(userId)];
  }

  function getBalance() public view returns (uint256) {
    return sqrToken.balanceOf(address(this));
  }

  function balanceOf(string memory userId) external view returns (uint256) {
    FundItem storage fund = _balances[getHash(userId)];
    return fund.depositTotal;
  }

  function getHash(string memory value) private pure returns (bytes32) {
    return keccak256(abi.encodePacked(value));
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

  function _deposit(
    string memory userId,
    string memory transactionId,
    address from,
    uint256 amount,
    uint32 timestampLimit
  ) private nonReentrant {
    require(amount > 0, "Amount must be greater than zero");
    require(block.timestamp <= timestampLimit, "Timeout blocker");

    require(sqrToken.allowance(from, address(this)) >= amount, "User must allow to use of funds");

    require(sqrToken.balanceOf(from) >= amount, "User must have funds");

    _setTransactionId(amount, transactionId);

    FundItem storage fund = _balances[getHash(userId)];
    fund.depositTotal += amount;
    depositTotal += amount;

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
        sqrToken.safeTransferFrom(from, address(this), userToContractAmount);
      }
      if (userToColdWalletAmount > 0) {
        sqrToken.safeTransferFrom(from, coldWallet, userToColdWalletAmount);
      }
      if (contractToColdWalletAmount > 0) {
        sqrToken.safeTransfer(coldWallet, contractToColdWalletAmount);
      }
    } else {
      sqrToken.safeTransferFrom(from, address(this), amount);
    }

    emit Deposit(from, amount);
  }

  function deposit(
    string memory userId,
    string memory transactionId,
    address from,
    uint256 amount,
    uint32 timestampLimit
  ) external onlyOwner {
    _deposit(userId, transactionId, from, amount, timestampLimit);
  }

  function verifyDepositSignature(
    string memory userId,
    string memory transactionId,
    address from,
    uint256 amount,
    uint32 timestampLimit,
    bytes memory signature
  ) private view returns (bool) {
    bytes32 messageHash = keccak256(
      abi.encode(userId, transactionId, from, amount, timestampLimit)
    );
    address recover = messageHash.toEthSignedMessageHash().recover(signature);
    return recover == owner();
  }

  function depositSig(
    string memory userId,
    string memory transactionId,
    address from,
    uint256 amount,
    uint32 timestampLimit,
    bytes memory signature
  ) external {
    require(
      verifyDepositSignature(userId, transactionId, from, amount, timestampLimit, signature),
      "Invalid signature"
    );
    _deposit(userId, transactionId, from, amount, timestampLimit);
  }

  function _withdraw(
    string memory userId,
    string memory transactionId,
    address to,
    uint256 amount,
    uint32 timestampLimit
  ) private nonReentrant {
    require(amount > 0, "Amount must be greater than zero");
    require(block.timestamp <= timestampLimit, "Timeout blocker");
    require(sqrToken.balanceOf(address(this)) >= amount, "Contract must have sufficient funds");

    _setTransactionId(amount, transactionId);

    address sender = _msgSender();

    FundItem storage fund = _balances[getHash(userId)];
    fund.withdrawTotal += amount;
    withdrawTotal += amount;

    sqrToken.safeTransfer(to, amount);

    emit Withdraw(sender, to, amount);
  }

  function withdraw(
    string memory userId,
    string memory transactionId,
    address to,
    uint256 amount,
    uint32 timestampLimit
  ) external onlyOwner {
    _withdraw(userId, transactionId, to, amount, timestampLimit);
  }

  function verifyWithdrawSignature(
    string memory userId,
    string memory transactionId,
    address to,
    uint256 amount,
    uint32 timestampLimit,
    bytes memory signature
  ) private view returns (bool) {
    bytes32 messageHash = keccak256(abi.encode(userId, transactionId, to, amount, timestampLimit));
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
    require(
      verifyWithdrawSignature(userId, transactionId, to, amount, timestampLimit, signature),
      "Invalid signature"
    );
    _withdraw(userId, transactionId, to, amount, timestampLimit);
  }

  function forceWithdraw(address token, address to, uint256 amount) external onlyOwner {
    IPermitToken permitToken = IPermitToken(token);
    permitToken.safeTransfer(to, amount);
    emit ForceWithdraw(token, to, amount);
  }
}
