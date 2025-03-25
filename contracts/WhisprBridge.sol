// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IWhisprERC20.sol";
import "./interfaces/IWhisprMinter.sol";
import "./interfaces/IRefundWalletEntrypoint.sol";
import "./interfaces/IAssetForwarder.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/IStableSwapRouter.sol";
import {Sapphire} from "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

contract WhisprBridge is AccessControlUpgradeable {
    string public constant VERSION = "0.0.1";

    address public whisprUSD;
    address public whisprUSDMinter;
    address public thornUSD;
    address public stableSwapRouter;
    address public assetForwarder;

    Sapphire.Curve25519PublicKey internal publicKey;
    Sapphire.Curve25519SecretKey internal privateKey;

    address public oracle;
    uint256 public clearingFee;

    address public refundWalletEntrypoint;

    event BridgeSuccess(
        address indexed token,
        uint256 amountOut,
        uint256 indexed depositId,
        bytes32 destChainId,
        bytes tokenDestChain,
        bytes receiver,
        address refundAddress
    );

    event TestnetEvent(address indexed sender, uint256 timestamp);
    struct BridgeData {
        uint256 partnerId;
        uint256 destAmount;
        address refunder;
        bytes32 destChainId;
        bytes tokenDestChain;
        bytes receiver;
    }

    function initialize(
        address _whisprUSD,
        address _whisprUSDMinter,
        address _thornUSD,
        address _stableSwapRouter,
        address _assetForwarder,
        address _refundWalletEntrypoint
    ) external initializer {
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        whisprUSD = _whisprUSD;
        whisprUSDMinter = _whisprUSDMinter;
        thornUSD = _thornUSD;
        stableSwapRouter = _stableSwapRouter;
        assetForwarder = _assetForwarder;
        refundWalletEntrypoint = _refundWalletEntrypoint;
    }

    function init2e2Proxy() public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "WhisprBridge: not admin"
        );
        bytes memory extra_entropy = abi.encodePacked(
            block.timestamp,
            block.coinbase,
            block.number
        );
        (publicKey, privateKey) = Sapphire.generateCurve25519KeyPair(
            extra_entropy
        );
    }

    function getPublicKey() public view returns (bytes32) {
        return Sapphire.Curve25519PublicKey.unwrap(publicKey);
    }

    function bridge(
        IWhisprERC20.ApproveData memory approveData,
        uint256 amount,
        address tokenOut,
        uint256 amountOutMin,
        address[] calldata path,
        uint256[] calldata flags,
        BridgeData calldata bridgeData
    ) public {
        IWhisprERC20(whisprUSD).approveByEIP712(approveData);
        // transferFrom
        IWhisprERC20(whisprUSD).transferFrom(
            approveData.owner,
            address(this),
            amount
        );
        // mint ThornUSD
        IWhisprERC20(whisprUSD).approve(whisprUSDMinter, amount);
        IWhisprMinter(whisprUSDMinter).burnWhisprUSD(amount, address(this));
        IERC20(thornUSD).approve(stableSwapRouter, amount);
        IStableSwapRouter(stableSwapRouter).exactInputStableSwap(
            path,
            flags,
            amount,
            amountOutMin,
            address(this)
        );

        //Bridge

        uint256 depositId = IAssetForwarder(assetForwarder).depositNonce();

        IERC20(tokenOut).approve(assetForwarder, amountOutMin);

        // get refund address
        address refundWallet = IRefundWalletEntrypoint(refundWalletEntrypoint)
            .createRefundWallet(approveData.owner, depositId);

        IAssetForwarder.DepositData memory depositData = IAssetForwarder
            .DepositData({
                partnerId: bridgeData.partnerId,
                amount: amountOutMin,
                destAmount: bridgeData.destAmount,
                srcToken: tokenOut,
                refundRecipient: refundWallet,
                destChainIdBytes: bridgeData.destChainId
            });

        IAssetForwarder(assetForwarder).iDeposit(
            depositData,
            bridgeData.tokenDestChain,
            bridgeData.receiver
        );

        emit BridgeSuccess(
            tokenOut,
            amount,
            depositId,
            bridgeData.destChainId,
            bridgeData.tokenDestChain,
            bridgeData.receiver,
            refundWallet
        );
    }

    function bridgeEncrypt(
        bytes32 peerPublicKey,
        bytes32 nonce,
        bytes calldata data,
        uint256 amount,
        address tokenOut,
        uint256 amountOutMin,
        address[] calldata path,
        uint256[] calldata flags,
        BridgeData calldata bridgeData
    ) public {
        bytes32 symmetricKey = Sapphire.deriveSymmetricKey(
            Sapphire.Curve25519PublicKey.wrap(peerPublicKey),
            privateKey
        );
        bytes memory plaintext = Sapphire.decrypt(
            symmetricKey,
            nonce,
            data,
            ""
        );
        IWhisprERC20.ApproveData memory approveData = abi.decode(
            plaintext,
            (IWhisprERC20.ApproveData)
        );
        bridge(
            approveData,
            amount,
            tokenOut,
            amountOutMin,
            path,
            flags,
            bridgeData
        );
    }

    function update(address _refundWalletEntrypoint) external {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "WhisprBridge: not admin"
        );
        refundWalletEntrypoint = _refundWalletEntrypoint;
    }
}
