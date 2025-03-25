import { WhisprERC20 } from "./../../typechain-types/contracts/whispr/WhisprERC20";
import { keccak256 } from "ethers";
import hre, { ethers } from "hardhat";
import * as ethersV6 from "ethers";
import {
    ERC20Mintable,
    ERC20Mintable__factory,
    PrivacyERC20,
    PrivacyERC20__factory,
    WhisprERC20__factory,
    WhisprERC20Upgradeable__factory,
    WhisprMinter,
    WhisprMinter__factory,
} from "../../typechain-types";
import { takeSnapshot } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe(" Test Whispr ERC-20", () => {
    const { deployments, getChainId } = hre;
    const { get, read } = deployments;
    let deployer: HardhatEthersSigner;
    let bob: HardhatEthersSigner;
    let alice: any;
    let whisprUSD: WhisprERC20;
    let thornUSD: ERC20Mintable;
    let minter: WhisprMinter;
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
        whisprUSD = WhisprERC20__factory.connect(whisprUSDDeployment.address, ethers.provider);
        const thornUSDDeployment = await get("ThornUSD");
        thornUSD = ERC20Mintable__factory.connect(thornUSDDeployment.address, ethers.provider);
        const minterDeployments = await get("WhisprMinter");
        minter = WhisprMinter__factory.connect(minterDeployments.address, ethers.provider);
        amountMint = ethersV6.parseUnits("1000", 18);
        await thornUSD.connect(deployer).mint(bob.address, amountMint);
        await thornUSD.connect(bob).approve(minterDeployments.address, amountMint);
        await minter.connect(bob).mintWhisprUSD(amountMint, bob.address);
    });

    describe("setup success", () => {
        it("EIP 712", async () => {
            const BALANCEOF_CODE_ONCHAIN = await read("WhisprUSD", "BALANCEOF_CODE");
            const BALANCEOF_CODE_OFFCHAIN = keccak256(ethersV6.toUtf8Bytes("Whispr.balanceOf"));
            expect(BALANCEOF_CODE_ONCHAIN).to.be.equal(
                BALANCEOF_CODE_OFFCHAIN,
                " BALANCEOF_CODE_ONCHAIN != BALANCEOF_CODE_OFFCHAIN"
            );
            const DOMAIN_BALANCEOF_ONCHAIN = await read("WhisprUSD", "DOMAIN_BALANCEOF");
            const DOMAIN_BALANCEOF_OFFCHAIN = keccak256(
                ethersV6.AbiCoder.defaultAbiCoder().encode(
                    ["bytes32", "bytes32", "bytes32", "uint256", "address"],
                    [
                        await whisprUSD.connect(deployer).EIP712_DOMAIN_TYPEHASH(),
                        keccak256(ethersV6.toUtf8Bytes("Whispr.balanceOf")),
                        keccak256(ethersV6.toUtf8Bytes("1")),
                        await getChainId(),
                        await whisprUSD.getAddress(),
                    ]
                )
            );
            expect(DOMAIN_BALANCEOF_ONCHAIN).to.be.equal(
                DOMAIN_BALANCEOF_OFFCHAIN,
                "DOMAIN_BALANCEOF_ONCHAIN != DOMAIN_BALANCEOF_OFFCHAIN"
            );
        });
    });

    describe(" privacy balance ", () => {
        it(" get balance without sign should be 0", async () => {
            const balance = await read("WhisprUSD", "balanceOf", bob.address);
            expect(balance.toString()).to.be.equal("0");
        });

        it(" get balance with sign should be success", async () => {
            const balance = await whisprUSD.connect(bob).balanceOf(bob.address);
            expect(balance).to.be.equal(amountMint);
        });

        it(" get balance use EIP 712 should work ", async () => {
            const validAfter = Math.floor(Date.now() / 1000) - 1000;
            const validUntil = Math.floor(Date.now() / 1000) + 1000;
            const signature = await bob.signTypedData(
                {
                    name: "Whispr.balanceOf",
                    version: "1",
                    chainId: 31337,
                    verifyingContract: await whisprUSD.getAddress(),
                },
                {
                    balanceOf: [
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
            const auth = { owner: bob.address, validAfter: validAfter, validUntil: validUntil, rsv };
            const balance = await whisprUSD.balanceOfByEIP712(auth);
            expect(balance).to.be.equal(amountMint);
        });
    });

    describe("approve", () => {
        it(" approve with signature ", async () => {
            const nonce = await whisprUSD.connect(bob).getNonce(bob.address);
            const validAfter = Math.floor(Date.now() / 1000) - 1000;
            const validUntil = validAfter + 2000;
            const APPROVE_ACTION = await whisprUSD.connect(bob).APPROVE_ACTION();

            const data = ethersV6.AbiCoder.defaultAbiCoder().encode(
                ["address", "address", "uint256", "bytes32", "uint256", "uint256", "uint256"],
                [bob.address, alice.address, 1000, APPROVE_ACTION, nonce, validAfter, validUntil]
            );
            const dataHash = ethers.keccak256(data);
            const signature = await bob.signMessage(ethersV6.getBytes(dataHash));
            //@ts-ignore
            await whisprUSD.connect(bob).approveUseSignature(bob.address, alice.address, 1000, data, signature);
            const allowance = await whisprUSD.connect(bob).allowance(bob.address, alice.address);
            expect(allowance).to.be.equal(1000n);
        });

        it(" approve without signature EIP-712 ", async () => {
            let nonce = await whisprUSD.connect(bob).getNonceEIP712(bob.address);
            const validAfter = Math.floor(Date.now() / 1000) - 1000;
            const validUntil = validAfter + 2000;
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
                    spender: alice.address,
                    amount: 1000,
                    nonce: nonce,
                    validAfter: validAfter,
                    validUntil: validUntil,
                }
            );

            const rsv = ethers.Signature.from(signature);
            const auth = {
                owner: bob.address,
                spender: alice.address,
                amount: 1000,
                nonce: nonce,
                validAfter: validAfter,
                validUntil: validUntil,
                rsv,
            };
            await whisprUSD.connect(bob).approveByEIP712(auth);
            const allowance = await whisprUSD.connect(bob).allowance(bob.address, alice.address);
            expect(allowance).to.be.equal(1000n);
            nonce = await whisprUSD.connect(bob).getNonceEIP712(bob.address);
            expect(nonce).to.be.equal(1);
        });

        describe(" privacy allowance", () => {
            beforeEach(async () => {
                await whisprUSD.connect(bob).approve(alice.address, 1000);
            });

            it(" get allowance without sign ", async () => {
                const allowance = await read("WhisprUSD", "allowance", bob.address, alice.address);
                expect(allowance.toString()).to.be.equal(0n);
            });

            it(" get allowance with sign ", async () => {
                const allowance = await whisprUSD.connect(bob).allowance(bob.address, alice.address);
                expect(allowance).to.be.equal(1000n);
            });
        });
    });

    describe("transfer", () => {
        it("transfer use default ERC20 should be successful", async () => {
            await whisprUSD.connect(bob).transfer(alice.address, 500);
            const balanceBob = await whisprUSD.connect(bob).balanceOf(bob.address);
            const balanceAlice = await whisprUSD.connect(alice).balanceOf(alice.address);
            expect(balanceBob).to.be.equal(amountMint - 500n);
            expect(balanceAlice).to.be.equal(500n);
        });

        it("transfer with signature should be successful", async () => {
            const nonce = await whisprUSD.connect(bob).getNonce(bob.address);
            const validAfter = Math.floor(Date.now() / 1000) - 1000;
            const validUntil = validAfter + 2000;
            const TRANSFER_ACTION = await whisprUSD.connect(bob).TRANSFER_ACTION();

            const data = ethersV6.AbiCoder.defaultAbiCoder().encode(
                ["address", "address", "uint256", "bytes32", "uint256", "uint256", "uint256"],
                [bob.address, alice.address, 500, TRANSFER_ACTION, nonce, validAfter, validUntil]
            );
            const dataHash = ethers.keccak256(data);
            const signature = await bob.signMessage(ethersV6.getBytes(dataHash));
            //@ts-ignore
            await whisprUSD.connect(deployer).transferUseSignature(bob.address, alice.address, 500, data, signature);
            const balanceBob = await whisprUSD.connect(bob).balanceOf(bob.address);
            const balanceAlice = await whisprUSD.connect(alice).balanceOf(alice.address);
            expect(balanceBob).to.be.equal(amountMint - 500n);
            expect(balanceAlice).to.be.equal(500n);
        });

        it("transfer using EIP-712 should be successful", async () => {
            const nonce = await whisprUSD.connect(bob).getNonceEIP712(bob.address);
            const validAfter = Math.floor(Date.now() / 1000) - 1000;
            const validUntil = validAfter + 2000;
            const signature = await bob.signTypedData(
                {
                    name: "Whispr.transfer",
                    version: "1",
                    chainId: 31337,
                    verifyingContract: await whisprUSD.getAddress(),
                },
                {
                    transfer: [
                        { name: "from", type: "address" },
                        { name: "to", type: "address" },
                        { name: "amount", type: "uint256" },
                        { name: "nonce", type: "uint256" },
                        { name: "validAfter", type: "uint256" },
                        { name: "validUntil", type: "uint256" },
                    ],
                },
                {
                    from: bob.address,
                    to: alice.address,
                    amount: 500,
                    nonce: nonce,
                    validAfter: validAfter,
                    validUntil: validUntil,
                }
            );

            const rsv = ethers.Signature.from(signature);
            const auth = {
                from: bob.address,
                to: alice.address,
                amount: 500,
                nonce: nonce,
                validAfter: validAfter,
                validUntil: validUntil,
                rsv,
            };
            await whisprUSD.connect(deployer).transferByEIP712(auth);
            const balanceBob = await whisprUSD.connect(bob).balanceOf(bob.address);
            const balanceAlice = await whisprUSD.connect(alice).balanceOf(alice.address);
            expect(balanceBob).to.be.equal(amountMint - 500n);
            expect(balanceAlice).to.be.equal(500n);
        });
    });
});
