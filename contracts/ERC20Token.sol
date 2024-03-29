// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract ERC20Token is ERC20, ERC20Burnable, ERC20Permit, Ownable, ReentrancyGuard {
  uint8 _decimals;

  constructor(
    string memory name_,
    string memory symbol_,
    address newOwner,
    uint256 initMint,
    uint8 decimals_
  ) ERC20(name_, symbol_) ERC20Permit(name_) Ownable(newOwner) {
    _mint(newOwner, initMint);
    _decimals = decimals_;
  }

  function decimals() public view override returns (uint8) {
    return _decimals;
  }
}
