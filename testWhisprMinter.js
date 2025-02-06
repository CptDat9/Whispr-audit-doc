const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const console = require("console");
const { HardhatEthersSigner } = require("@nomicfoundation/hardhat-ethers/signers");
const { MinInt256 } = require("ethers");

describe("WhisprMinter", function() {
    async function deployContract() {
        const [addr1, addr2, addr3] = await ethers.getSigners();

        const WhisprERC20Fac = await ethers.getContractFactory("WhisprERC20");
        const WhisprUSD = await WhisprERC20Fac.deploy("DuongDepZai", "DDZ", 18, addr1.address);
        await WhisprUSD.waitForDeployment();

        //const ThornUSD = 0;
        //const WhisprMinterProxy = 0;
        const ThornERC20Fac = await ethers.getContractFactory("ERC20Mintable");
        const ThornUSD = await ThornERC20Fac.deploy("ThornUSD", "TUSD", 18);
        await ThornUSD.waitForDeployment();

        const WhisprUSDAddress = await WhisprUSD.getAddress();
        const ThornUSDAddress = await ThornUSD.getAddress();

        const WhisprMinterFac = await ethers.getContractFactory("WhisprMinter");
        const WhisprMinterProxy = await upgrades.deployProxy(WhisprMinterFac, [WhisprUSDAddress, ThornUSDAddress], {initializer: "initialize"});
        await WhisprMinterProxy.waitForDeployment();

        return {WhisprUSD, ThornUSD, WhisprMinterProxy, addr1, addr2, addr3};
    }

    it("Testing test =))))", async function() {
        const {WhisprUSD, ThornUSD, WhisprMinterProxy, addr1, addr2, addr3} = await loadFixture(deployContract);
        
        const WhisprUSD_address = await WhisprUSD.getAddress();

        const ThornUSD_address = await ThornUSD.getAddress();
        const WhisprMinterProxy_address = await WhisprMinterProxy.getAddress();
        
        console.log("WhisprUSH_address: " + WhisprUSD_address + "\n" + "ThornUSD_address: " + ThornUSD_address + "\n" + "WhisprMinterProxy_address: " + WhisprMinterProxy_address);
        
        const ADMIN_ROLE = await WhisprUSD.DEFAULT_ADMIN_ROLE();
        console.log("addr1 is DEFAULT_ADMIN of WhisprMinter: " + (await WhisprMinterProxy.hasRole(ADMIN_ROLE, addr1.address )));

        const MINTER_ROLE = await WhisprUSD.MINTER_ROLE();
        console.log("MINTER_ROLE: " + MINTER_ROLE.toString());

        
        
        let WhisprMinter_is_minter = await WhisprUSD.hasRole(MINTER_ROLE, WhisprMinterProxy_address);
        console.log("WhisprMinter is Minter: " + WhisprMinter_is_minter);

        console.log("Mint 10000 ThornUSD token");
        await ThornUSD.mint(addr1, 100000);
        console.log("addr1_balance of ThornUSD: " + (await ThornUSD.balanceOf(addr1.address)));

        await ThornUSD.connect(addr1).approve(WhisprMinterProxy_address, 100000);
        await WhisprUSD.connect(addr1).approve(WhisprMinterProxy, 100000);

        console.log("From now on, we grant WhisprMinter the Minter_role");
        await WhisprUSD.grantRole(MINTER_ROLE, WhisprMinterProxy_address);
        WhisprMinter_is_minter = await WhisprUSD.hasRole(MINTER_ROLE, WhisprMinterProxy_address);
        console.log("WhisprMinter is Minter: " + WhisprMinter_is_minter);

        console.log("Time to mint some WhisprUSD!");
        await WhisprMinterProxy.connect(addr1).mintWhisprUSD(100, addr1.address);
      
        console.log("ThornUSD_balance of WhisprMinter: " + (await ThornUSD.balanceOf(WhisprMinterProxy_address)));
        console.log("ThornUSD_balance of addr1: " + (await ThornUSD.balanceOf(addr1.address)));
        console.log("addr1_balance of WhisprUSD: " + (await WhisprUSD.balanceOf(addr1.address)));
        console.log("globalSupply: " + (await WhisprUSD._globalTotalSupply()));

        console.log("Test burn token");

        console.log("Burn 30 WhisprUSD token");
        await WhisprMinterProxy.connect(addr1).burnWhisprUSD(30, addr1.address);

        console.log("WhisprUSD balance of addr1: " + (await WhisprUSD.balanceOf(addr1.address)));
        console.log("ThornUSD balance of addr1: " + (await ThornUSD.balanceOf(addr1.address)));
        console.log("ThornUSD balance of WhisprMinter: " + (await ThornUSD.balanceOf(WhisprMinterProxy_address)));

        expect(1).to.equal(1);
    })
})
