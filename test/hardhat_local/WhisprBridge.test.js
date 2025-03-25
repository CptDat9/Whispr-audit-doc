    const { ethers, upgrades } = require("hardhat");
    const { expect } = require("chai");

    describe("WhisprBridge", function () {
    let whisprBridge, whisprERC20, thornUSD;
    let deployer, alice, bob;

    before(async function () {
        [deployer, alice, bob] = await ethers.getSigners();

        const WhisprERC20Factory = await ethers.getContractFactory("WhisprERC20");
        whisprERC20 = await WhisprERC20Factory.deploy(
        "WhisprUSD",
        "WUSD",
        18,
        deployer.address
        );
        await whisprERC20.waitForDeployment();

        const ERC20MintableFactory = await ethers.getContractFactory("ERC20Mintable");
        thornUSD = await ERC20MintableFactory.deploy("ThornUSD", "TUSD", 18);
        await thornUSD.waitForDeployment();

        const WhisprBridgeFactory = await ethers.getContractFactory("WhisprBridge");
        whisprBridge = await upgrades.deployProxy(
        WhisprBridgeFactory,
        [
            whisprERC20.target,
            deployer.address,
            thornUSD.target,
            deployer.address,
            deployer.address,
            deployer.address,
        ],
        { initializer: "initialize" }
        );
        await whisprBridge.waitForDeployment();

        const MINTER_ROLE = await whisprERC20.MINTER_ROLE();
        await whisprERC20.grantRole(MINTER_ROLE, deployer.address);

        await thornUSD.mint(deployer.address, ethers.parseEther("10000"));
    });

    it(" initialize the bridge contract correctly", async function () {
        expect(await whisprBridge.whisprUSD()).to.equal(whisprERC20.target);
        expect(await whisprBridge.thornUSD()).to.equal(thornUSD.target);
    });

    it("  mint and transfer tokens", async function () {
        const amountToMint = ethers.parseEther("1000");

        await thornUSD.approve(whisprBridge.target, amountToMint);

        await whisprERC20.mint(deployer.address, amountToMint);
        const deployerBalance = await whisprERC20.balanceOf(deployer.address);

        expect(deployerBalance).to.equal(amountToMint);
    });

    it(" emit a BridgeSuccess event on valid bridging", async function () {
        const amount = ethers.parseEther("100");
        const depositId = 1;
        const destChainId = ethers.utils.formatBytes32String("TestNet");
        const tokenDestChain = "0x123456";
        const receiver = "0x456789";

        await whisprERC20.approve(whisprBridge.target, amount);

        await expect(
        whisprBridge.bridge(
            {
            owner: deployer.address,
            spender: whisprBridge.target,
            value: amount,
            },
            amount,
            thornUSD.target,
            ethers.parseEther("90"),
            [],
            [],
            {
            partnerId: 1,
            destAmount: ethers.parseEther("90"),
            refunder: deployer.address,
            destChainId: destChainId,
            tokenDestChain: tokenDestChain,
            receiver: receiver,
            }
        )
        )
        .to.emit(whisprBridge, "BridgeSuccess")
        .withArgs(
            thornUSD.target,
            amount,
            depositId,
            destChainId,
            tokenDestChain,
            receiver,
            deployer.address
        );
    });

    it(" revert if non-admin tries to initialize keys", async function () {
        await expect(
        whisprBridge.connect(alice).init2e2Proxy()
        ).to.be.revertedWith("WhisprBridge: not admin");
    });

    it(" allow admin to update refund wallet entrypoint", async function () {
        await whisprBridge.update(bob.address);
        expect(await whisprBridge.refundWalletEntrypoint()).to.equal(bob.address);
    });
    });
