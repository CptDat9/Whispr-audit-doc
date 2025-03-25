// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IWhisprERC20 {
    struct SignatureRSV {
        bytes32 r;
        bytes32 s;
        uint256 v;
    }
    struct ApproveData {
        address owner;
        address spender;
        uint256 amount;
        uint256 nonce;
        uint256 validAfter;
        uint256 validUntil;
        SignatureRSV rsv;
    }

    function mint(address to, uint256 amount) external;

    function burn(uint256 amount) external;

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transfer(address to, uint256 amount) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function approveUseSignature(
        address owner,
        address spender,
        uint256 amount,
        bytes calldata data,
        bytes calldata signature
    ) external returns (bool);

    function transferUseSignature(
        address from,
        address to,
        uint256 amount,
        bytes calldata data,
        bytes calldata signature
    ) external returns (bool);

    function setToTalSupplyVisible(bool visible) external;

    function approveByEIP712(ApproveData calldata data) external;
}
