import hre, { ethers } from "hardhat";

import { formatUnits, getBytes, parseUnits, zeroPadBytes } from "ethers";
import * as ethersV6 from "ethers";
import * as sapphire from "@oasisprotocol/sapphire-paratime";
import { ERC20__factory, PrivacyERC20__factory, Wallet__factory, WhisprBridge__factory } from "../../typechain-types";
import { TOKEN_ADDRESS, TOKEN_TESTNET } from "../../utils/address";

async function main() {
    const { getChainId } = hre;
    const { deployments, getNamedAccounts } = hre;
    const { deploy, save, execute, get, read } = deployments;

    const [deployer] = await ethers.getSigners();
    let txResponse, txReceipt;
    const walletDeployment = await get("Wallet");

    const wallet = Wallet__factory.connect(walletDeployment.address, ethers.provider);

    const usdt_sapphire = TOKEN_ADDRESS.SAPPHIRE_MAINNET.USDT;

    const usdt = ERC20__factory.connect(usdt_sapphire, ethers.provider);

    const balance = await usdt.connect(deployer).balanceOf(await wallet.getAddress());

    console.log(`Balance: ${formatUnits(balance, 6)}`);

    // withdraw
    if (balance > 0n) {
        console.log(`Withdraw ${formatUnits(balance, 6)} USDT to ${deployer.address}`);
        const txTransfer = await usdt.transfer.populateTransaction(deployer.address, balance);
        txResponse = await wallet.connect(deployer).execute_ncC(txTransfer.to, 0, txTransfer.data);
        txReceipt = await txResponse.wait();
        console.log(`TxHash: ${txReceipt?.hash}`);
    }
}

main();
