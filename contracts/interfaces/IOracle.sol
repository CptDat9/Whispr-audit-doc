// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPriceOracle {
    function getPrice(
        address token
    ) external view returns (uint256 price, uint256 lastUpdate);

    function setPrice(
        address[] calldata tokens,
        uint256[] calldata prices
    ) external;
}
