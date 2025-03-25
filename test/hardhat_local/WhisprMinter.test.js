const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("WhisprMinter", function () {
    let whisprMinter, whisprERC20, thornUSD;
    let deployer, alice, bob;

    before(async function () {
        [deployer, alice, bob] = await ethers.getSigners();

        const WhisprERC20Factory = await ethers.getContractFactory("WhisprERC20");
        whisprERC20 = await WhisprERC20Factory.deploy("WhisprUSD", "WUSD", 18, deployer.address);
        await whisprERC20.waitForDeployment();

        const ERC20MintableFactory = await ethers.getContractFactory("ERC20Mintable");
        thornUSD = await ERC20MintableFactory.deploy("ThornUSD", "TUSD", 18);
        await thornUSD.waitForDeployment();

        const WhisprMinterFactory = await ethers.getContractFactory("WhisprMinter");
        whisprMinter = await upgrades.deployProxy(
            WhisprMinterFactory,
            [whisprERC20.target, thornUSD.target],
            { initializer: "initialize" }
        );
        await whisprMinter.waitForDeployment();

        const MINTER_ROLE = await whisprERC20.MINTER_ROLE();
        await whisprERC20.grantRole(MINTER_ROLE, whisprMinter.target);
        
        expect(await whisprERC20.hasRole(MINTER_ROLE, whisprMinter.target)).to.be.true;

        await thornUSD.mint(deployer.address, ethers.parseEther("10000"));
    });

    it("Should allow the minter to mint WhisprUSD tokens", async function () {
        const amountToMint = ethers.parseEther("1000");

        await thornUSD.connect(deployer).approve(whisprMinter.target, amountToMint);
        await whisprMinter.connect(deployer).mintWhisprUSD(amountToMint, bob.address);

        const bobBalance = await whisprERC20.balanceOf(bob.address);
        expect(bobBalance).to.equal(amountToMint);
    });

    it("Should not allow minting without ThornUSD balance", async function () {
        const amountToMint = ethers.parseEther("5000");

        await expect(
            whisprMinter.connect(alice).mintWhisprUSD(amountToMint, bob.address)
        ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should allow token transfer after minting", async function () {
        const transferAmount = ethers.parseEther("500");
        const amountToMint = ethers.parseEther("1000");

        await thornUSD.connect(deployer).approve(whisprMinter.target, amountToMint);
        await whisprMinter.connect(deployer).mintWhisprUSD(amountToMint, bob.address);

        await whisprERC20.connect(bob).transfer(alice.address, transferAmount);

        const aliceBalance = await whisprERC20.balanceOf(alice.address);
        const bobBalance = await whisprERC20.balanceOf(bob.address);

        expect(aliceBalance).to.equal(transferAmount);
        expect(bobBalance).to.equal(ethers.parseEther("500"));
    });

    it("Should allow burning of WhisprUSD and receiving ThornUSD", async function () {
        const amountToBurn = ethers.parseEther("500");
        const amountToMint = ethers.parseEther("1000");

        await thornUSD.connect(deployer).approve(whisprMinter.target, amountToMint);
        await whisprMinter.connect(deployer).mintWhisprUSD(amountToMint, bob.address);

        await whisprERC20.connect(bob).approve(whisprMinter.target, amountToBurn);
        await whisprMinter.connect(bob).burnWhisprUSD(amountToBurn, bob.address);

        const bobWhisprBalance = await whisprERC20.balanceOf(bob.address);
        const bobThornBalance = await thornUSD.balanceOf(bob.address);

        expect(bobWhisprBalance).to.equal(ethers.parseEther("500"));
        expect(bobThornBalance).to.equal(amountToBurn);
    });

    it("Should enforce role-based access control for minting", async function () {
        const MINTER_ROLE = await whisprERC20.MINTER_ROLE();
        const hasRole = await whisprERC20.hasRole(MINTER_ROLE, whisprMinter.target);

        expect(hasRole).to.be.true;
    });

    it("Should not allow non-admins to pause the contract", async function () {
        await expect(whisprMinter.connect(alice).pause()).to.be.revertedWith("AccessControl: account");
    });

    it("Should allow admin to pause and unpause the contract", async function () {
        await whisprMinter.connect(deployer).pause();

        await expect(
            whisprMinter.connect(deployer).mintWhisprUSD(ethers.parseEther("100"), bob.address)
        ).to.be.revertedWith("Pausable: paused");

        await whisprMinter.connect(deployer).unpause();

        await expect(
            whisprMinter.connect(deployer).mintWhisprUSD(ethers.parseEther("100"), bob.address)
        ).to.not.be.reverted;
    });
});
