// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract WhisprECDSA {
    mapping(address => uint256) private _nonce;

    bytes32 public APPROVE_ACTION = keccak256("APPROVE");

    bytes32 public TRANSFER_ACTION = keccak256("TRANSFER");

    function _getNonce(address owner) public view returns (uint256) {
        return _nonce[owner];
    }

    function _verifyApprove(
        address owner,
        address spender,
        uint256 amount,
        bytes calldata data,
        bytes calldata signature
    ) public view {
        (
            address _owner,
            address _spender,
            uint256 _amount,
            bytes32 _action,
            uint256 _nonceNumber,
            uint256 _validAfter,
            uint256 _validUntil
        ) = abi.decode(
                data,
                (address, address, uint256, bytes32, uint256, uint256, uint256)
            );
        require(owner == _owner, "PrivacyERC20Verify: owner mismatch");
        require(spender == _spender, "PrivacyERC20Verify: spender mismatch");
        require(amount == _amount, "PrivacyERC20Verify: amount mismatch");
        require(
            _action == APPROVE_ACTION,
            "PrivacyERC20Verify: action mismatch"
        );
        require(
            _nonceNumber == _nonce[owner],
            "PrivacyERC20Verify: invalid nonce"
        );
        require(
            block.timestamp >= _validAfter,
            "PrivacyERC20Verify: signature not yet valid"
        );
        require(
            block.timestamp <= _validUntil,
            "PrivacyERC20Verify: signature expired"
        );
        require(
            verifyEthMessage(owner, data, signature),
            "PrivacyERC20Verify: invalid signature"
        );
    }

    function _verifyTransfer(
        address owner,
        address spender,
        uint256 amount,
        bytes calldata data,
        bytes calldata signature
    ) internal view {
        (
            address _owner,
            address _spender,
            uint256 _amount,
            bytes32 _action,
            uint256 _nonceNumber,
            uint256 _validAfter,
            uint256 _validUntil
        ) = abi.decode(
                data,
                (address, address, uint256, bytes32, uint256, uint256, uint256)
            );
        require(owner == _owner, "PrivacyERC20Verify: owner mismatch");
        require(spender == _spender, "PrivacyERC20Verify: spender mismatch");
        require(amount == _amount, "PrivacyERC20Verify: amount mismatch");
        require(
            _action == TRANSFER_ACTION,
            "PrivacyERC20Verify: action mismatch"
        );
        require(
            _nonceNumber == _nonce[owner],
            "PrivacyERC20Verify: invalid nonce"
        );
        require(
            block.timestamp >= _validAfter,
            "PrivacyERC20Verify: signature not yet valid"
        );
        require(
            block.timestamp <= _validUntil,
            "PrivacyERC20Verify: signature expired"
        );

        require(
            verifyEthMessage(owner, data, signature),
            "PrivacyERC20Verify: invalid signature"
        );
    }

    function verifyEthMessage(
        address signer,
        bytes calldata data,
        bytes calldata signature
    ) public pure returns (bool) {
        bytes32 messageHash = keccak256(data);
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            messageHash
        );

        address recoveredSigner = ECDSA.recover(
            ethSignedMessageHash,
            signature
        );

        return recoveredSigner == signer;
    }

    function _incrementNonce(address owner) public {
        _nonce[owner]++;
    }
}
