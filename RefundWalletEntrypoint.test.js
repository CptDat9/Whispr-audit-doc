const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("RefundWalletEntrypoint", function () {
    let RefundWalletEntrypoint, refundWalletEntrypoint;
    let owner, bridge, user, wallet, stableSwapRouter, whisprMinter, thornUSD, proxyImpl;

    before(async function () {
        [owner, bridge, user, stableSwapRouter, whisprMinter, thornUSD] = await ethers.getSigners();

        const ProxyImpl = await ethers.getContractFactory("RefundWallet");
        proxyImpl = await ProxyImpl.deploy();

        RefundWalletEntrypoint = await ethers.getContractFactory("RefundWalletEntrypoint");
        refundWalletEntrypoint = await upgrades.deployProxy(
            RefundWalletEntrypoint,
            [thornUSD.address, whisprMinter.address, stableSwapRouter.address, proxyImpl.target]
        );

        await refundWalletEntrypoint.waitForDeployment();
    });

    it(" initialize ", async function () {
        expect(await refundWalletEntrypoint.thornUSD()).to.equal(thornUSD.address);
        expect(await refundWalletEntrypoint.whisprMinter()).to.equal(whisprMinter.address);
        expect(await refundWalletEntrypoint.stableSwapRouter()).to.equal(stableSwapRouter.address);
    });

    it("tao refund wallet", async function () {
        await refundWalletEntrypoint.grantRole(await refundWalletEntrypoint.BRIDGE_ROLE(), bridge.address);
        await expect(refundWalletEntrypoint.connect(bridge).createRefundWallet(user.address, 1))
            .to.emit(refundWalletEntrypoint, "CreateWallet");
    });

    it("ngăn non-bridge cho không tạo dc wallet", async function () {
        await expect(refundWalletEntrypoint.connect(user).createRefundWallet(user.address, 1))
            .to.be.revertedWith("RefundWalletEntrypoint: only thornBridge can call");
    });
});
