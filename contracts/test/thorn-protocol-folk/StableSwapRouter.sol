// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

// https://github.com/router-protocol/router-contracts/blob/main/asset-forwarder/evm/contracts/AssetForwarder.sol
contract StableSwapRouter is AccessControlUpgradeable {
    using SafeERC20 for IERC20;

    function exactInputStableSwap(
        address[] calldata path,
        uint256[] calldata flag,
        uint256 amountIn,
        uint256 amountOutMin,
        address to
    ) external payable returns (uint256 amountOut) {
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(path[1]).transfer(to, amountOutMin);
        return amountOutMin;
    }
}
