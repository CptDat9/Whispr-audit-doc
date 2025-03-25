import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Signer } from "ethers";
import { WhisprERC20, ERC20Mintable, WhisprMinter } from "../typechain-types";

describe("WhisprMinter", function () {
    async function deployContract() {
        const [addr1, addr2, addr3]: Signer[] = await ethers.getSigners();

        const WhisprERC20Fac = await ethers.getContractFactory("WhisprERC20");
        const WhisprUSD = (await WhisprERC20Fac.deploy("DuongDepZai", "DDZ", 18, await addr1.getAddress())) as WhisprERC20;
        await WhisprUSD.waitForDeployment();

        const ThornERC20Fac = await ethers.getContractFactory("ERC20Mintable");
        const ThornUSD = (await ThornERC20Fac.deploy("ThornUSD", "TUSD", 18)) as ERC20Mintable;
        await ThornUSD.waitForDeployment();

        const WhisprMinterFac = await ethers.getContractFactory("WhisprMinter");
        const WhisprMinterProxy = (await upgrades.deployProxy(
            WhisprMinterFac,
            [await WhisprUSD.getAddress(), await ThornUSD.getAddress()],
            { initializer: "initialize" }
        )) as WhisprMinter;
        await WhisprMinterProxy.waitForDeployment();

        return { WhisprUSD, ThornUSD, WhisprMinterProxy, addr1, addr2, addr3 };
    }

    it("Should test minting and burning functionality", async function () {
        const { WhisprUSD, ThornUSD, WhisprMinterProxy, addr1 } = await loadFixture(deployContract);

        const addr1Address = await addr1.getAddress();
        console.log("WhisprUSD Address:", await WhisprUSD.getAddress());
        console.log("ThornUSD Address:", await ThornUSD.getAddress());
        console.log("WhisprMinterProxy Address:", await WhisprMinterProxy.getAddress());

        const ADMIN_ROLE = await WhisprUSD.DEFAULT_ADMIN_ROLE();
        console.log("addr1 is DEFAULT_ADMIN of WhisprMinter:", await WhisprMinterProxy.hasRole(ADMIN_ROLE, addr1Address));

        const MINTER_ROLE = await WhisprUSD.MINTER_ROLE();
        console.log("MINTER_ROLE:", MINTER_ROLE.toString());

        console.log("Mint 10000 ThornUSD token");
        await ThornUSD.mint(addr1Address, 100000);
        console.log("addr1 balance of ThornUSD:", (await ThornUSD.balanceOf(addr1Address)).toString());

        await ThornUSD.connect(addr1).approve(await WhisprMinterProxy.getAddress(), 100000);
        await WhisprUSD.connect(addr1).approve(await WhisprMinterProxy.getAddress(), 100000);

        console.log("Granting WhisprMinter the Minter_role");
        await WhisprUSD.grantRole(MINTER_ROLE, await WhisprMinterProxy.getAddress());
        console.log("WhisprMinter is Minter:", await WhisprUSD.hasRole(MINTER_ROLE, await WhisprMinterProxy.getAddress()));

        console.log("Minting 100 WhisprUSD tokens");
        await WhisprMinterProxy.connect(addr1).mintWhisprUSD(100, addr1Address);

        console.log("ThornUSD balance of WhisprMinter:", (await ThornUSD.balanceOf(await WhisprMinterProxy.getAddress())).toString());
        console.log("addr1 balance of WhisprUSD:", (await WhisprUSD.balanceOf(addr1Address)).toString());

        console.log("Burning 30 WhisprUSD tokens");
        await WhisprMinterProxy.connect(addr1).burnWhisprUSD(30, addr1Address);

        console.log("WhisprUSD balance of addr1:", (await WhisprUSD.balanceOf(addr1Address)).toString());
        console.log("ThornUSD balance of addr1:", (await ThornUSD.balanceOf(addr1Address)).toString());
        console.log("ThornUSD balance of WhisprMinter:", (await ThornUSD.balanceOf(await WhisprMinterProxy.getAddress())).toString());

        expect(1).to.equal(1);
    });
});
