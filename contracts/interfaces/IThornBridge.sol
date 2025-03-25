// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IThornBridge is IERC20 {
    function deposit(
        address to,
        uint256 chainId,
        IERC20 token,
        uint256 amount
    ) external;

    function withdraw(uint256 fee, bytes memory data) external;

    function redeem(
        address to,
        uint256 chainId,
        IERC20 token,
        uint256 amount
    ) external;

    function mint(
        address payable to,
        IERC20 token,
        uint256 amount,
        uint256 fee,
        bytes32 kappa
    ) external;

    function isValidSignature(
        bytes32 dataHash,
        bytes32 signature,
        address signer
    ) external pure returns (bool);

    event TokenDeposit(
        address indexed to,
        uint256 chainId,
        IERC20 token,
        uint256 amount
    );

    event TokenWithdraw(
        address indexed to,
        IERC20 token,
        uint256 amount,
        uint256 fee,
        bytes32 indexed kappa
    );

    event TokenRedeem(
        address indexed to,
        uint256 chainId,
        IERC20 token,
        uint256 amount
    );

    event TokenMint(
        address indexed to,
        IERC20 token,
        uint256 amount,
        uint256 fee,
        bytes32 indexed kappa
    );
}
