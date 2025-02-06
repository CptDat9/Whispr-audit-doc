const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("RefundWallet", function () {
    let RefundWallet, refundWallet;
    let owner, entrypoint, user, token;

    before(async function () {
        [entrypoint, owner, user] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("ERC20Mintable");
        token = await Token.deploy("MockToken", "MTK", 18);
        await token.waitForDeployment();

        RefundWallet = await ethers.getContractFactory("RefundWallet");
        refundWallet = await upgrades.deployProxy(RefundWallet, [entrypoint.address, owner.address, 1], {
            initializer: "initialize",
        });
        await refundWallet.waitForDeployment();

        await owner.sendTransaction({
            to: await refundWallet.getAddress(),
            value: ethers.parseEther("100"),
        });
    });

    it("should initialize correctly", async function () {
        expect(await refundWallet.entrypoint()).to.equal(entrypoint.address);
        expect(await refundWallet.depositId()).to.equal(1);
    });

    it(" allow entrypoint to withdraw", async function () {
        await token.mint(await refundWallet.getAddress(), ethers.parseEther("10"));

        await expect(refundWallet.connect(entrypoint).withdraw(await token.getAddress(), user.address, ethers.parseEther("5")))
            .to.emit(token, "Transfer")
            .withArgs(await refundWallet.getAddress(), user.address, ethers.parseEther("5"));
    });

    it(" not allow others to withdraw", async function () {
        await expect(refundWallet.connect(owner).withdraw(await token.getAddress(), user.address, ethers.parseEther("5")))
            .to.be.revertedWith("Wallet: caller is not an entrypoint");
    });
});
