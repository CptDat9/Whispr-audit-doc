// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract WhisprECDSAUpgradeable {
    struct WhisprECDSAStorage {
        bytes32 APPROVE_ACTION;
        bytes32 TRANSFER_ACTION;
        mapping(address => uint256) _nonce;
    }

    //  keccak256(abi.encode(uint256(keccak256("Whispr.storage.ECDSA")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant WhisprECDSAStorageLocation =
        0xc97e90a89b8359dd142109ef1b694d6f9c94d31fef1a3ae3bbc6ac1980e94600;

    function _getWhisprECDSAStorage()
        private
        pure
        returns (WhisprECDSAStorage storage $)
    {
        assembly {
            $.slot := WhisprECDSAStorageLocation
        }
    }

    function _getNonce(address owner) internal view returns (uint256) {
        WhisprECDSAStorage storage $ = _getWhisprECDSAStorage();
        return $._nonce[owner];
    }

    function _verifyApprove(
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

        WhisprECDSAStorage storage $ = _getWhisprECDSAStorage();

        require(owner == _owner, "WhisprECDSA: owner mismatch");
        require(spender == _spender, "WhisprECDSA: spender mismatch");
        require(amount == _amount, "WhisprECDSA: amount mismatch");
        require(_action == $.APPROVE_ACTION, "WhisprECDSA: action mismatch");
        require(_nonceNumber == $._nonce[owner], "WhisprECDSA: invalid nonce");
        require(
            block.timestamp >= _validAfter,
            "WhisprECDSA: signature not yet valid"
        );
        require(
            block.timestamp <= _validUntil,
            "WhisprECDSA: signature expired"
        );
        require(
            verifyEthMessage(owner, data, signature),
            "WhisprECDSA: invalid signature"
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
        WhisprECDSAStorage storage $ = _getWhisprECDSAStorage();
        require(owner == _owner, "WhisprECDSA: owner mismatch");
        require(spender == _spender, "WhisprECDSA: spender mismatch");
        require(amount == _amount, "WhisprECDSA: amount mismatch");
        require(_action == $.TRANSFER_ACTION, "WhisprECDSA: action mismatch");
        require(_nonceNumber == $._nonce[owner], "WhisprECDSA: invalid nonce");
        require(
            block.timestamp >= _validAfter,
            "WhisprECDSA: signature not yet valid"
        );
        require(
            block.timestamp <= _validUntil,
            "WhisprECDSA: signature expired"
        );

        require(
            verifyEthMessage(owner, data, signature),
            "WhisprECDSA: invalid signature"
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

    function _incrementNonce(address owner) internal {
        WhisprECDSAStorage storage $ = _getWhisprECDSAStorage();
        $._nonce[owner]++;
    }
}
