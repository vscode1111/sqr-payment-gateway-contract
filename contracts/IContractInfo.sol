// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

/**
 * @dev Interface of the contract information.
 */
interface IContractInfo {
  /**
   * @dev Returns the contract name
   */
  function getContractName() external view returns (string memory);

  /**
   * @dev Returns the contract version
   */
  function getContractVersion() external view returns (string memory);
}
