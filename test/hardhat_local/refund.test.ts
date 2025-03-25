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
    RefundWallet__factory,
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
    let txResponse, txReceipt;
    before(async () => {
        await deployments.fixture();
        snapshot = await takeSnapshot();
    });

    async function bridgeAction(amount, amountOutMin) {
        const nonce_x = await whisprUSD.connect(bob).getNonceEIP712(bob.address);
        const validAfter = Math.floor(Date.now() / 1000) - 100 * 60;
        const validUntil = Math.floor(Date.now() / 1000) + 100 * 60;
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
        return bridge.connect(bob).bridge(approveData, amount, await usdt.getAddress(), amountOutMin, path, flag, {
            partnerId: 1,
            destAmount: amountOutMin,
            refunder: bob.address,
            destChainId: encodeBytes32String("56"),
            tokenDestChain: await usdt.getAddress(),
            receiver: alice.address,
        });
    }

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

        it("create wallet when bridge ", async () => {
            await expect(await bridgeAction(ethersV6.parseUnits("10", 18), ethersV6.parseUnits("9", 6))).to.be.emit(
                refund,
                "CreateWallet"
            );
        });

        describe(" crawl receipt ", async () => {
            beforeEach(async () => {
                await bridgeAction(ethersV6.parseUnits("10", 18), ethersV6.parseUnits("9", 6));
                await bridgeAction(ethersV6.parseUnits("10", 18), ethersV6.parseUnits("9", 6));
                await bridgeAction(ethersV6.parseUnits("10", 18), ethersV6.parseUnits("9", 6));
            });

            it(" check parameter", async () => {
                const LOGIN_CODE_ONCHAIN = await read("RefundWalletEntrypoint", "LOGIN_CODE");

                const LOGIN_CODE_OFFCHAIN = keccak256(ethersV6.toUtf8Bytes("Whispr.login"));

                expect(LOGIN_CODE_ONCHAIN).to.be.equal(
                    LOGIN_CODE_OFFCHAIN,
                    " LOGIN_CODE_ONCHAIN != LOGIN_CODE_OFFCHAIN"
                );

                const DOMAIN_LOGIN_ONCHAIN = await read("RefundWalletEntrypoint", "DOMAIN_LOGIN");
                const DOMAIN_LOGIN_OFFCHAIN = keccak256(
                    ethersV6.AbiCoder.defaultAbiCoder().encode(
                        ["bytes32", "bytes32", "bytes32", "uint256", "address"],
                        [
                            await refund.EIP712_DOMAIN_TYPEHASH(),
                            keccak256(ethersV6.toUtf8Bytes("Whispr.login")),
                            keccak256(ethersV6.toUtf8Bytes("1")),
                            await getChainId(),
                            await refund.getAddress(),
                        ]
                    )
                );

                expect(DOMAIN_LOGIN_ONCHAIN).to.be.equal(
                    DOMAIN_LOGIN_OFFCHAIN,
                    "DOMAIN_LOGIN_ONCHAIN != DOMAIN_LOGIN_OFFCHAIN"
                );

                const EIP712_DOMAIN_TYPEHASH_ONCHAIN = await read("RefundWalletEntrypoint", "EIP712_DOMAIN_TYPEHASH");

                const EIP712_DOMAIN_TYPEHASH_OFFCHAIN = keccak256(
                    ethersV6.toUtf8Bytes(
                        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                    )
                );

                expect(EIP712_DOMAIN_TYPEHASH_ONCHAIN).to.be.equal(
                    EIP712_DOMAIN_TYPEHASH_OFFCHAIN,
                    "EIP712_DOMAIN_TYPEHASH_ONCHAIN != EIP712_DOMAIN_TYPEHASH_OFFCHAIN"
                );
            });

            it("crawl amount receipt by eip 712", async () => {
                const validAfter = Math.floor(Date.now() / 1000) - 1000;
                const validUntil = Math.floor(Date.now() / 1000) + 1000;
                const signature = await bob.signTypedData(
                    {
                        name: "Whispr.login",
                        version: "1",
                        chainId: 31337,
                        verifyingContract: await refund.getAddress(),
                    },
                    {
                        login: [
                            { name: "owner", type: "address" },
                            { name: "validAfter", type: "uint256" },
                            { name: "validUntil", type: "uint256" },
                        ],
                    },
                    {
                        owner: bob.address,
                        validAfter: validAfter,
                        validUntil: validUntil,
                    }
                );
                const rsv = ethers.Signature.from(signature);

                const auth = {
                    owner: bob.address,
                    validAfter: validAfter,
                    validUntil: validUntil,
                    rsv,
                };

                const amountReceipt = await refund.login(auth);

                expect(amountReceipt).to.be.equal(3);

                for (let i = 0; i < amountReceipt; i++) {
                    const receipt = await refund.getReceipt(auth, i);

                    const wallet = RefundWallet__factory.connect(receipt, ethers.provider);

                    const depositId = await wallet.depositId();
                    expect(depositId).to.be.equal(i);
                }
            });
        });
    });
});
