// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

interface IRefundWallet {
    function initialize(
        address entrypoint,
        address owner,
        uint256 depositId
    ) external;

    function withdraw(address token, address receiver, uint256 amount) external;
}
