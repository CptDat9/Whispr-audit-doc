// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

interface IWhisprMinter {
    function mintWhisprUSD(
        uint256 amount,
        address receiver
    ) external returns (uint256);

    function burnWhisprUSD(uint256 amount, address receiver) external;
}
