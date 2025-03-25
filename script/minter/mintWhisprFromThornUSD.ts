import hre, { ethers } from "hardhat";

import { formatUnits, parseUnits } from "ethers";
import * as ethersV6 from "ethers";
import { ERC20__factory, PrivacyERC20__factory, WhisprMinter__factory } from "../../typechain-types";
import { TOKEN_TESTNET } from "../../utils/address";

async function mintWhispr() {
    const { getChainId } = hre;
    const { deployments, getNamedAccounts } = hre;
    const { deploy, save, execute, get, read } = deployments;

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    const whisprDeployment = await get("WhisprUSD");
    const whispr = PrivacyERC20__factory.connect(whisprDeployment.address, ethers.provider);
    let balance = await whispr.balanceOf(deployer.address);
    console.log(`Balance: ${formatUnits(balance, 18)}`);
    let real_balance = await whispr.connect(deployer).balanceOf(deployer.address);
    real_balance = await whispr.connect(deployer).balanceOf(deployer.address);
    console.log(`Real balance: ${formatUnits(real_balance, 18)}`);

    const thornUSD = ERC20__factory.connect(TOKEN_TESTNET.ThornUSD, ethers.provider);

    balance = await thornUSD.balanceOf(deployer.address);

    console.log(`USDT Balance: ${formatUnits(balance, 18)}`);
    const minterDeployment = await get("WhisprMinter");
    const minter = WhisprMinter__factory.connect(minterDeployment.address, ethers.provider);
    let txResponse, txReceipt;
    const whisprInMinter = await minter.whisprUSD();
    console.log(`Whispr in minter: ${whisprInMinter}`);

    console.log(" approving ... ");
    txResponse = await thornUSD.connect(deployer).approve(minterDeployment.address, parseUnits("100", 18));
    txReceipt = await txResponse.wait();
    console.log(" minting ... ");
    txResponse = await minter.connect(deployer).mintWhisprUSD(parseUnits("100", 18), deployer.address);
    txReceipt = await txResponse.wait();
    balance = await whispr.connect(deployer).balanceOf(deployer.address);
    console.log(`Balance: ${formatUnits(balance, 18)}`);
}
mintWhispr();
