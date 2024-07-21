// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

/**
 * @dev Interface of the Deposit contract.
 */
interface IDepositRefund {
  struct DepositRefundAccountInfo {
    uint256 baseDeposited;
    bool boosted;
    uint256 baseAllocation;
    uint256 baseRefund;
    uint256 boostRefund;
    uint32 nonce;
  }

  struct DepositRefundTokensInfo {
    address baseToken;
    address boostToken;
  }

  struct DepositRefundContractInfo {
    uint256 totalBaseDeposited;
  }

  /**
   * @dev Returns the goal amount.
   */
  function getBaseGoal() external view returns (uint256);

  /**
   * @dev Returns the start date.
   */
  function getStartDate() external view returns (uint32);

  /**
   * @dev Returns the closet date.
   */
  function getCloseDate() external view returns (uint32);

  /**
   * @dev Returns if contract is ready to fetch data.
   */
  function getDepositRefundFetchReady() external view returns (bool);

  /**
   * @dev Returns the value of account count.
   */
  function getAccountCount() external view returns (uint32);

  /**
   * @dev Returns the account by index.
   */
  function getAccountByIndex(uint32 index) external view returns (address);

  /**
   * @dev Returns the tokens info.
   */
  function getDepositRefundTokensInfo() external view returns (DepositRefundTokensInfo memory);

  /**
   * @dev Returns the account's allocation amount.
   */
  function getDepositRefundAllocation(address account) external view returns (uint256);

  /**
   * @dev Returns the account's deposit/refund info.
   */
  function getDepositRefundAccountInfo(
    address account
  ) external view returns (DepositRefundAccountInfo memory);

  /**
   * @dev Returns the contract information.
   */
  function getDepositRefundContractInfo() external view returns (DepositRefundContractInfo memory);
}
