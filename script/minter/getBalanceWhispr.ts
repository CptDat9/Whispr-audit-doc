import hre, { ethers } from "hardhat";

import { formatUnits, parseUnits } from "ethers";
import { PrivacyERC20__factory } from "../../typechain-types";

async function mintWhispr() {
    const { getChainId } = hre;
    const { deployments, getNamedAccounts } = hre;
    const { deploy, save, execute, get, read } = deployments;

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    const whisprDeployment = await get("WhisprUSD");
    const whispr = PrivacyERC20__factory.connect(whisprDeployment.address, ethers.provider);
    const balance = await whispr.balanceOf(deployer.address);
    console.log(`Balance: ${formatUnits(balance, 6)}`);
    let real_balance = await whispr.connect(deployer).balanceOf(deployer.address);
    real_balance = await whispr.connect(deployer).balanceOf(deployer.address);
    console.log(`Real balance: ${formatUnits(real_balance, 6)}`);
}
mintWhispr();
