// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IContractInfo} from "./IContractInfo.sol";
import {IDepositRefund} from "./IDepositRefund.sol";

contract SQRPaymentGateway is
  OwnableUpgradeable,
  UUPSUpgradeable,
  ReentrancyGuardUpgradeable,
  IContractInfo,
  IDepositRefund
{
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
    address _depositVerifier, //could be zero address
    uint256 _depositGoal, //0 - skip
    address _withdrawVerifier, //could be zero address
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

    if (_startDate > 0 && _closeDate > 0 && _startDate > _closeDate) {
      revert CloseDateMustBeGreaterThanStartDate();
    }

    if (_coldWallet == address(0)) {
      revert ColdWalletNotZeroAddress();
    }

    __Ownable_init(_newOwner);
    __UUPSUpgradeable_init();

    erc20Token = IERC20(_erc20Token);
    depositVerifier = _depositVerifier;
    depositGoal = _depositGoal;
    withdrawVerifier = _withdrawVerifier;
    withdrawGoal = _withdrawGoal;
    startDate = _startDate;
    closeDate = _closeDate;
    coldWallet = _coldWallet;
    balanceLimit = _balanceLimit;
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

  //Variables, structs, errors, modifiers, events------------------------
  uint256 public constant MAX_INT = type(uint256).max;

  IERC20 public erc20Token;
  address public coldWallet;
  address public depositVerifier;
  uint256 public depositGoal;
  address public withdrawVerifier;
  uint256 public withdrawGoal;
  uint32 public startDate;
  uint32 public closeDate;
  uint256 public balanceLimit;
  uint256 public totalDeposited;
  uint256 public totalWithdrew;

  mapping(bytes32 => FundItem) private _userFundItems;
  mapping(bytes32 => address[]) private _userToAddresses;

  mapping(address => FundItem) private _accountFundItems;
  address[] private _accountAddresses;

  mapping(bytes32 => TransactionItem) private _transactionIds;
  // mapping(bytes32 => uint32) private _depositNonces;
  // mapping(bytes32 => uint32) private _withdrawNonces;

  struct FundItem {
    uint256 depositedAmount;
    uint256 withdrewAmount;
    uint32 depositNonce;
    uint32 withdrawNonce;
  }

  struct TransactionItem {
    uint256 amount;
  }

  error NewOwnerNotZeroAddress();
  error ERC20TokenNotZeroAddress();
  error StartDateMustBeGreaterThanCurrentTime();
  error CloseDateMustBeGreaterThanCurrentTime();
  error CloseDateMustBeGreaterThanStartDate();
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
    if (isBeforeStartDate()) {
      revert TooEarly();
    }
    if (isAfterCloseDate()) {
      revert TooLate();
    }
    _;
  }

  event ChangeBalanceLimit(address indexed sender, uint256 balanceLimit);
  event Deposit(address indexed account, uint256 amount);
  event Withdraw(address indexed account, address indexed to, uint256 amount);
  event ForceWithdraw(address indexed token, address indexed to, uint256 amount);

  //Read methods-------------------------------------------
  //IContractInfo implementation
  function getContractName() external pure returns (string memory) {
    return "PaymentGateway";
  }

  function getContractVersion() external pure returns (string memory) {
    return "2.0.0";
  }

  //IDepositRefund implementation
  function getBaseGoal() external view returns (uint256) {
    return depositGoal;
  }

  function getStartDate() external view returns (uint32) {
    return startDate;
  }

  function getCloseDate() external view returns (uint32) {
    return closeDate;
  }

  function getDepositRefundFetchReady() external view returns (bool) {
    return isAfterCloseDate();
  }

  function getAccountCount() public view returns (uint32) {
    return (uint32)(_accountAddresses.length);
  }

  function getAccountByIndex(uint32 index) public view returns (address) {
    return _accountAddresses[index];
  }

  function getDepositRefundTokensInfo() external view returns (DepositRefundTokensInfo memory) {
    return DepositRefundTokensInfo(address(erc20Token), 0, address(erc20Token), 0); //ToDo: Fix decimals
  }

  function getDepositRefundAllocation(address account) external view returns (uint256) {
    return calculateAccountRefund(account);
  }

  function getDepositRefundAccountInfo(
    address account
  ) external view returns (DepositRefundAccountInfo memory) {
    FundItem memory accountFundItem = _accountFundItems[account];

    return
      DepositRefundAccountInfo(
        accountFundItem.depositedAmount,
        false,
        calculateAccountRefund(account),
        0,
        0,
        0
      );
  }

  function getDepositRefundContractInfo() external view returns (DepositRefundContractInfo memory) {
    return DepositRefundContractInfo(totalDeposited);
  }

  //Custom
  function isBeforeStartDate() public view returns (bool) {
    return startDate > 0 && block.timestamp < startDate;
  }

  function isAfterCloseDate() public view returns (bool) {
    return closeDate > 0 && block.timestamp > closeDate;
  }

  function isDepositReady() public view returns (bool) {
    return !isBeforeStartDate() && !isAfterCloseDate();
  }

  function isReachedGoal() public view returns (bool) {
    return totalDeposited == depositGoal;
  }

  function calculateAccountRefund(address account) public view returns (uint256) {
    FundItem memory accountFundItem = _accountFundItems[account];
    if (!isReachedGoal()) {
      return accountFundItem.depositedAmount;
    }
    return 0;
  }

  function fetchUserFundItem(string memory userId) external view returns (FundItem memory) {
    return _userFundItems[getHash(userId)];
  }

  function getBalance() public view returns (uint256) {
    return erc20Token.balanceOf(address(this));
  }

  function balanceOf(string memory userId) external view returns (uint256) {
    FundItem memory userFundItem = _userFundItems[getHash(userId)];
    if (userFundItem.depositedAmount > userFundItem.withdrewAmount) {
      return userFundItem.depositedAmount - userFundItem.withdrewAmount;
    }
    return 0;
  }

  function getHash(string memory value) private pure returns (bytes32) {
    return keccak256(abi.encodePacked(value));
  }

  function getDepositNonce(string memory userId) public view returns (uint32) {
    FundItem memory userFundItem = _userFundItems[getHash(userId)];
    return userFundItem.depositNonce;
  }

  function getWithdrawNonce(string memory userId) public view returns (uint32) {
    FundItem memory userFundItem = _userFundItems[getHash(userId)];
    return userFundItem.withdrawNonce;
  }

  function calculateRemainDeposit() external view returns (uint256) {
    if (!isDepositReady()) {
      return 0;
    }
    if (depositGoal > 0) {
      return depositGoal - totalDeposited;
    }
    return MAX_INT;
  }

  function calculateRemainWithdraw() external view returns (uint256) {
    if (!isDepositReady()) {
      return 0;
    }
    if (withdrawGoal > 0) {
      return withdrawGoal - totalWithdrew;
    }
    return MAX_INT;
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

  //Write methods-------------------------------------------
  function _setTransactionId(uint256 amount, string memory transactionId) private {
    (bytes32 transactionIdHash, TransactionItem memory transactionItem) = getTransactionItem(
      transactionId
    );
    if (transactionItem.amount != 0) {
      revert UsedTransactionId();
    }
    _transactionIds[transactionIdHash] = TransactionItem(amount);
  }

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

    FundItem storage userFundItem = _userFundItems[userHash];

    if (userFundItem.depositNonce != nonce) {
      revert InvalidNonce();
    }

    userFundItem.depositedAmount += amount;
    userFundItem.depositNonce += 1;

    FundItem storage accountFundItem = _accountFundItems[account];
    accountFundItem.depositedAmount += amount;
    accountFundItem.depositNonce += 1;

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
    return recover == owner() || recover == depositVerifier;
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
    address account,
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

    FundItem storage userFundItem = _userFundItems[userHash];

    if (userFundItem.withdrawNonce != nonce) {
      revert InvalidNonce();
    }

    userFundItem.withdrewAmount += amount;
    userFundItem.withdrawNonce += 1;

    FundItem storage accountFundItem = _accountFundItems[account];
    accountFundItem.depositedAmount += amount;
    accountFundItem.withdrawNonce += 1;

    totalWithdrew += amount;

    erc20Token.safeTransfer(account, amount);

    emit Withdraw(_msgSender(), account, amount);
  }

  function withdraw(
    string memory userId,
    string memory transactionId,
    address account,
    uint256 amount,
    uint32 nonce,
    uint32 timestampLimit
  ) external onlyOwner {
    _withdraw(userId, transactionId, account, amount, nonce, timestampLimit);
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
    return recover == owner() || recover == withdrawVerifier;
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

  function changeBalanceLimit(uint256 _balanceLimit) external onlyOwner {
    balanceLimit = _balanceLimit;
    emit ChangeBalanceLimit(_msgSender(), _balanceLimit);
  }
}
