import hre, { ethers } from "hardhat";

import { formatUnits, getBytes, parseUnits, zeroPadBytes } from "ethers";
import * as ethersV6 from "ethers";
import * as sapphire from "@oasisprotocol/sapphire-paratime";
import { PrivacyERC20__factory, RefundWalletEntrypoint__factory, WhisprBridge__factory } from "../typechain-types";

async function mintWhispr() {
    const { getChainId } = hre;
    const { deployments, getNamedAccounts } = hre;
    const { deploy, save, execute, get, read } = deployments;

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    const whisprDeployment = await get("WhisprUSD");
    const whispr = PrivacyERC20__factory.connect(whisprDeployment.address, ethers.provider);
    let real_balance = await whispr.connect(deployer).balanceOf(deployer.address);
    console.log(`Real balance: ${formatUnits(real_balance, 18)}`);

    const bridgeDeployment = await get("WhisprBridge");
    let bridge = WhisprBridge__factory.connect(bridgeDeployment.address, ethers.provider);

    let refundDeployment = await get("RefundWalletEntrypoint");

    const refund = RefundWalletEntrypoint__factory.connect(refundDeployment.address, ethers.provider);
}
mintWhispr();
