// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

struct SignatureRSV {
    bytes32 r;
    bytes32 s;
    uint256 v;
}

contract WhisprEIP712Upgradeable {
    struct ApproveData {
        address owner;
        address spender;
        uint256 amount;
        uint256 nonce;
        uint256 validAfter;
        uint256 validUntil;
        SignatureRSV rsv;
    }

    struct BalanceOfData {
        address owner;
        uint256 validAfter;
        uint256 validUntil;
        SignatureRSV rsv;
    }

    struct WhisprEIP712Storage {
        bytes32 EIP712_DOMAIN_TYPEHASH;
        bytes32 DOMAIN_BALANCEOF;
        bytes32 DOMAIN_APPROVE;
        mapping(address => uint256) _nonce_eip712;
    }
    //  keccak256(abi.encode(uint256(keccak256("Whispr.storage.EIP712")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant WhisprEIP712StorageLocation =
        0xc97e90a89b8359dd142109ef1b694d6f9c94d31fef1a3ae3bbc6ac1980e94600;

    function _getWhisprEIP712Storage()
        private
        pure
        returns (WhisprEIP712Storage storage $)
    {
        assembly {
            $.slot := WhisprEIP712StorageLocation
        }
    }

    function __WhisprEIP712() public {
        WhisprEIP712Storage storage $ = _getWhisprEIP712Storage();

        $.EIP712_DOMAIN_TYPEHASH = keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );

        $.DOMAIN_BALANCEOF = keccak256(
            abi.encode(
                $.EIP712_DOMAIN_TYPEHASH,
                keccak256("Whispr.balanceOf"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );

        $.DOMAIN_APPROVE = keccak256(
            abi.encode(
                $.EIP712_DOMAIN_TYPEHASH,
                keccak256("Whispr.approve"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }

    modifier authenticatedBalance(BalanceOfData calldata auth) {
        WhisprEIP712Storage storage $ = _getWhisprEIP712Storage();

        require(
            block.timestamp >= auth.validAfter,
            "WhisprEIP712: signature not yet valid"
        );
        require(
            block.timestamp <= auth.validUntil,
            "WhisprEIP712: signature expired"
        );
        bytes32 BALANCEOF_TYPEHASH = keccak256(
            bytes(
                "balanceOf(address owner,uint256 validAfter,uint256 validUntil)"
            )
        );
        // Validate EIP-712 sign-in authentication.
        bytes32 authdataDigest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                $.DOMAIN_BALANCEOF,
                keccak256(
                    abi.encode(
                        BALANCEOF_TYPEHASH,
                        auth.owner,
                        auth.validAfter,
                        auth.validUntil
                    )
                )
            )
        );

        address recovered_address = ecrecover(
            authdataDigest,
            uint8(auth.rsv.v),
            auth.rsv.r,
            auth.rsv.s
        );
        require(
            auth.owner == recovered_address,
            "WhisprEIP712: Invalid BalanceOf Authentication"
        );
        _;
    }

    modifier authenticatedApprove(ApproveData calldata auth) {
        WhisprEIP712Storage storage $ = _getWhisprEIP712Storage();

        require(
            block.timestamp >= auth.validAfter,
            "WhisprEIP712: signature not yet valid"
        );
        require(
            block.timestamp <= auth.validUntil,
            "WhisprEIP712: signature expired"
        );
        require(
            auth.nonce == $._nonce_eip712[auth.owner],
            "WhisprEIP712: invalid nonce"
        );
        bytes32 APPROVE_TYPEHASH = keccak256(
            "approve(address owner,address spender,uint256 amount,uint256 nonce,uint256 validAfter,uint256 validUntil)"
        );
        // Validate EIP-712 sign-in authentication.
        bytes32 authdataDigest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                $.DOMAIN_APPROVE,
                keccak256(
                    abi.encode(
                        APPROVE_TYPEHASH,
                        auth.owner,
                        auth.spender,
                        auth.amount,
                        auth.nonce,
                        auth.validAfter,
                        auth.validUntil
                    )
                )
            )
        );

        address recovered_address = ecrecover(
            authdataDigest,
            uint8(auth.rsv.v),
            auth.rsv.r,
            auth.rsv.s
        );

        require(
            auth.owner == recovered_address,
            "WhisprEIP712: Invalid Appvove Authentication"
        );
        _;
    }

    function _getNonceEIP712(address owner) internal view returns (uint256) {
        WhisprEIP712Storage storage $ = _getWhisprEIP712Storage();
        return $._nonce_eip712[owner];
    }

    function _incrementNonceEIP712(address owner) internal {
        WhisprEIP712Storage storage $ = _getWhisprEIP712Storage();
        $._nonce_eip712[owner]++;
    }
}
