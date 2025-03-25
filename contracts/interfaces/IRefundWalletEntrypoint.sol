// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

interface IRefundWalletEntrypoint {
    function createRefundWallet(
        address owner,
        uint256 depositId
    ) external returns (address);
}
