// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IRefundWallet.sol";
import "../interfaces/IStableSwapRouter.sol";
import "../interfaces/IWhisprMinter.sol";
import "./Proxy.sol";

struct SignatureRSV {
    bytes32 r;
    bytes32 s;
    uint256 v;
}

contract RefundWalletEntrypoint is AccessControlUpgradeable {
    string public constant ENTRYPOINT_VERSION = "0.0.1";
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    address public thornUSD;
    address public whisprMinter;
    address public stableSwapRouter;
    address public thornBridge;
    address public basicImplementation;

    mapping(address => uint256) internal countTransaction;
    mapping(address => mapping(uint256 => address)) internal ownerToWallet;

    // EIP 712 login storage start

    bytes32 public EIP712_DOMAIN_TYPEHASH;

    bytes32 public constant LOGIN_CODE = keccak256("Whispr.login");
    bytes32 public DOMAIN_LOGIN;

    // EIP 712 login storage end

    struct LoginData {
        address owner;
        uint256 validAfter;
        uint256 validUntil;
        SignatureRSV rsv;
    }

    event Withdraw(
        address indexed wallet,
        address indexed token,
        uint256 amount,
        uint256 amountOut
    );

    event CreateWallet(address indexed wallet, uint256 depositId);

    // constructor(
    //     address _thornUSD,
    //     address _whisprMinter,
    //     address _stableSwapRouter,
    //     address _basicImplementation
    // ) {
    //     thornUSD = _thornUSD;
    //     whisprMinter = _whisprMinter;
    //     stableSwapRouter = _stableSwapRouter;
    //     basicImplementation = _basicImplementation;
    //     _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    // }

    function initialize(
        address _thornUSD,
        address _whisprMinter,
        address _stableSwapRouter,
        address _basicImplementation
    ) external initializer {
        thornUSD = _thornUSD;
        whisprMinter = _whisprMinter;
        stableSwapRouter = _stableSwapRouter;
        basicImplementation = _basicImplementation;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        EIP712_DOMAIN_TYPEHASH = keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );
        DOMAIN_LOGIN = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256("Whispr.login"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }

    function createRefundWallet(
        address owner,
        uint256 depositId
    ) external returns (address wallet) {
        require(
            hasRole(BRIDGE_ROLE, msg.sender),
            "RefundWalletEntrypoint: only thornBridge can call"
        );
        wallet = _create(owner, depositId);
    }

    function _create(
        address owner,
        uint256 depositId
    ) internal returns (address proxy) {
        bytes memory deploymentData = abi.encodePacked(
            type(Proxy).creationCode,
            uint256(uint160(basicImplementation))
        );
        assembly {
            proxy := create(
                0x0,
                add(0x20, deploymentData),
                mload(deploymentData)
            )
        }
        require(address(proxy) != address(0), "Create call failed");
        IRefundWallet(proxy).initialize(address(this), owner, depositId);
        ownerToWallet[owner][countTransaction[owner]] = proxy;
        countTransaction[owner]++;
        emit CreateWallet(proxy, depositId);
    }

    function _withdraw(
        address owner,
        address wallet,
        address token,
        uint256 amount,
        address[] calldata path,
        uint256[] calldata flag,
        uint256 amountOutMin
    ) internal returns (uint256 amountOut) {
        IRefundWallet(wallet).withdraw(token, address(this), amount);
        require(path[0] == token, "WalletEntrypoint: invalid path");
        require(
            path[path.length - 1] == thornUSD,
            "WalletEntrypoint: invalid path"
        );
        // swap
        IERC20(token).approve(stableSwapRouter, amount);
        uint256 balanceBefore = IERC20(thornUSD).balanceOf(address(this));
        IStableSwapRouter(stableSwapRouter).exactInputStableSwap(
            path,
            flag,
            amount,
            amountOutMin,
            address(this)
        );
        uint256 balanceAfter = IERC20(thornUSD).balanceOf(address(this));
        amountOut = balanceAfter - balanceBefore;
        // change to Whispr
        IERC20(thornUSD).approve(whisprMinter, amountOut);
        IWhisprMinter(whisprMinter).mintWhisprUSD(amountOut, owner);
        emit Withdraw(wallet, token, amount, amountOut);
    }

    // EIP 712 function
    modifier authenticatedEIP712(LoginData calldata auth) {
        // require(
        //     block.timestamp >= auth.validAfter,
        //     "RefundWallet: signature not yet valid"
        // );
        // require(
        //     block.timestamp <= auth.validUntil,
        //     "RefundWallet: signature expired"
        // );

        bytes32 LOGIN_TYPEHASH = keccak256(
            "login(address owner,uint256 validAfter,uint256 validUntil)"
        );

        // Validate EIP-712 sign-in authentication.
        bytes32 authdataDigest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_LOGIN,
                keccak256(
                    abi.encode(
                        LOGIN_TYPEHASH,
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
            "RefundWallet: Invalid Authentication"
        );
        _;
    }

    function login(
        LoginData calldata data
    ) external view authenticatedEIP712(data) returns (uint256 total) {
        total = countTransaction[data.owner];
    }

    function getReceipt(
        LoginData calldata data,
        uint256 index
    ) external view authenticatedEIP712(data) returns (address wallet) {
        wallet = ownerToWallet[data.owner][index];
    }
}
