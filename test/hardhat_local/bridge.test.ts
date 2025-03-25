import { StableSwapRouter } from "../../typechain-types/contracts/test/thorn-protocol-folk/StableSwapRouter";
import { encodeBytes32String, keccak256, parseUnits } from "ethers";
import hre, { ethers } from "hardhat";
import * as ethersV6 from "ethers";
import {
    AssetForwarder,
    AssetForwarder__factory,
    ERC20Mintable,
    ERC20Mintable__factory,
    PrivacyERC20,
    PrivacyERC20__factory,
    RefundWalletEntrypoint,
    RefundWalletEntrypoint__factory,
    StableSwapRouter__factory,
    WhisprBridge,
    WhisprBridge__factory,
    WhisprMinter,
    WhisprMinter__factory,
} from "../../typechain-types";
import { takeSnapshot } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Bridge", () => {
    const { deployments, getChainId } = hre;
    const { get, read } = deployments;
    let deployer: HardhatEthersSigner;
    let bob: HardhatEthersSigner;
    let alice: any;
    let whisprUSD: PrivacyERC20;
    let thornUSD: ERC20Mintable;
    let minter: WhisprMinter;
    let asset: AssetForwarder;
    let bridge: WhisprBridge;
    let router: StableSwapRouter;
    let refund: RefundWalletEntrypoint;
    let usdt: ERC20Mintable;
    let snapshot: any;

    let amountMint: bigint;
    before(async () => {
        await deployments.fixture();
        snapshot = await takeSnapshot();
    });

    beforeEach(async () => {
        await snapshot.restore();
        deployer = await hre.ethers.provider.getSigner(0);
        alice = await hre.ethers.provider.getSigner(2);
        [deployer, bob, alice] = await ethers.getSigners();
        const whisprUSDDeployment = await get("WhisprUSD");
        whisprUSD = PrivacyERC20__factory.connect(whisprUSDDeployment.address, ethers.provider);
        const thornUSDDeployment = await get("ThornUSD");
        thornUSD = ERC20Mintable__factory.connect(thornUSDDeployment.address, ethers.provider);
        const minterDeployments = await get("WhisprMinter");
        minter = WhisprMinter__factory.connect(minterDeployments.address, ethers.provider);
        const assetDeployment = await get("AssetForwarder");
        asset = AssetForwarder__factory.connect(assetDeployment.address, ethers.provider);
        const bridgeDeployment = await get("WhisprBridge");
        bridge = WhisprBridge__factory.connect(bridgeDeployment.address, ethers.provider);
        const routerDeployment = await get("StableSwapRouter");
        router = StableSwapRouter__factory.connect(routerDeployment.address, ethers.provider);
        const usdtDeployment = await get("USDT");
        usdt = ERC20Mintable__factory.connect(usdtDeployment.address, ethers.provider);

        const refundDeployment = await get("RefundWalletEntrypoint");
        refund = RefundWalletEntrypoint__factory.connect(refundDeployment.address, ethers.provider);

        amountMint = ethersV6.parseUnits("1000", 6);
        let amountThornMint = ethersV6.parseUnits("1000", 18);
        await thornUSD.connect(deployer).mint(bob.address, amountMint);
        await thornUSD.connect(deployer).mint(deployer.address, amountThornMint);
        await thornUSD.connect(deployer).approve(await minter.getAddress(), amountThornMint);
        await minter.connect(deployer).mintWhisprUSD(amountThornMint, bob.address);
        await thornUSD.connect(deployer).mint(await router.getAddress(), amountThornMint);
        await usdt.connect(deployer).mint(await router.getAddress(), amountMint);
    });

    describe("Test bridge", () => {
        it("test RefundWallet", async () => {
            await expect(refund.connect(deployer).createRefundWallet(deployer.address, 1)).to.be.revertedWith(
                "RefundWalletEntrypoint: only thornBridge can call"
            );
        });

        it("bob bridge for alice  without encryption", async () => {
            const nonce_x = await whisprUSD.connect(bob).getNonceEIP712(deployer.address);
            console.log(`Nonce: ${nonce_x}`);
            const validAfter = Math.floor(Date.now() / 1000) - 100 * 60;
            const validUntil = Math.floor(Date.now() / 1000) + 100 * 60;
            const bridgeDeployment = await get("WhisprBridge");
            const bridge = WhisprBridge__factory.connect(bridgeDeployment.address, ethers.provider);
            const amount = parseUnits("10", 18);
            const amountOutMint = parseUnits("5", 6);
            const destAmount = parseUnits("5", 6);

            const signature = await bob.signTypedData(
                {
                    name: "Whispr.approve",
                    version: "1",
                    chainId: 31337,
                    verifyingContract: await whisprUSD.getAddress(),
                },
                {
                    approve: [
                        { name: "owner", type: "address" },
                        { name: "spender", type: "address" },
                        { name: "amount", type: "uint256" },
                        { name: "nonce", type: "uint256" },
                        { name: "validAfter", type: "uint256" },
                        { name: "validUntil", type: "uint256" },
                    ],
                },
                {
                    owner: bob.address,
                    spender: await bridge.getAddress(),
                    amount: amount,
                    nonce: nonce_x,
                    validAfter: validAfter,
                    validUntil: validUntil,
                }
            );

            const rsv = ethers.Signature.from(signature);
            const approveData = {
                owner: bob.address,
                spender: await bridge.getAddress(),
                amount: amount,
                nonce: nonce_x,
                validAfter: validAfter,
                validUntil: validUntil,
                rsv,
            };

            const path = [await thornUSD.getAddress(), await usdt.getAddress()];

            const flag = [2];

            await expect(
                bridge
                    .connect(bob)
                    .bridge(
                        approveData,
                        parseUnits("10", 18),
                        await usdt.getAddress(),
                        parseUnits("9", 6),
                        path,
                        flag,
                        {
                            partnerId: 1,
                            destAmount: parseUnits("9", 6),
                            refunder: bob.address,
                            destChainId: encodeBytes32String("56"),
                            tokenDestChain: await usdt.getAddress(),
                            receiver: alice.address,
                        }
                    )
            )
                .to.be.emit(asset, "FundsDeposited")
                .to.be.emit(bridge, "BridgeSuccess");
        });
    });
});
