// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

struct SignatureRSV {
    bytes32 r;
    bytes32 s;
    uint256 v;
}

contract WhisprEIP712 {
    bytes32 public constant EIP712_DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );

    bytes32 public constant BALANCEOF_CODE = keccak256("Whispr.balanceOf");
    bytes32 public constant APPROVE_CODE = keccak256("Whispr.approve");
    bytes32 public constant TRANSFER_CODE = keccak256("Whispr.transfer");

    bytes32 public DOMAIN_BALANCEOF;
    bytes32 public DOMAIN_APPROVE;
    bytes32 public DOMAIN_TRANSFER;

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

    struct TransferData {
        address from;
        address to;
        uint256 amount;
        uint256 nonce;
        uint256 validAfter;
        uint256 validUntil;
        SignatureRSV rsv;
    }

    mapping(address => uint256) internal _nonce_eip712;

    constructor() {
        DOMAIN_BALANCEOF = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                BALANCEOF_CODE,
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );

        DOMAIN_APPROVE = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                APPROVE_CODE,
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );

        DOMAIN_TRANSFER = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                TRANSFER_CODE,
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }

    modifier authenticatedBalance(BalanceOfData calldata auth) {
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
                DOMAIN_BALANCEOF,
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
        require(
            block.timestamp >= auth.validAfter,
            "WhisprEIP712: signature not yet valid"
        );
        require(
            block.timestamp <= auth.validUntil,
            "WhisprEIP712: signature expired"
        );
        require(
            auth.nonce == _nonce_eip712[auth.owner],
            "WhisprEIP712: invalid nonce"
        );
        bytes32 APPROVE_TYPEHASH = keccak256(
            "approve(address owner,address spender,uint256 amount,uint256 nonce,uint256 validAfter,uint256 validUntil)"
        );
        // Validate EIP-712 sign-in authentication.
        bytes32 authdataDigest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_APPROVE,
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

    modifier authenticatedTransfer(TransferData calldata auth) {
        require(
            block.timestamp >= auth.validAfter,
            "WhisprEIP712: signature not yet valid"
        );
        require(
            block.timestamp <= auth.validUntil,
            "WhisprEIP712: signature expired"
        );
        require(
            auth.nonce == _nonce_eip712[auth.from],
            "WhisprEIP712: invalid nonce"
        );
        bytes32 TRANSFER_TYPEHASH = keccak256(
            "transfer(address from,address to,uint256 amount,uint256 nonce,uint256 validAfter,uint256 validUntil)"
        );
        // Validate EIP-712 sign-in authentication.
        bytes32 authdataDigest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_TRANSFER,
                keccak256(
                    abi.encode(
                        TRANSFER_TYPEHASH,
                        auth.from,
                        auth.to,
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
            auth.from == recovered_address,
            "WhisprEIP712: Invalid Transfer Authentication"
        );
        _;
    }

    function _getNonceEIP712(address owner) public view returns (uint256) {
        return _nonce_eip712[owner];
    }

    function _incrementNonceEIP712(address owner) public {
        _nonce_eip712[owner]++;
    }
}
