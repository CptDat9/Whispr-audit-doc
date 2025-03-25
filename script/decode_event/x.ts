import { CreateCallInterface } from "./../../typechain-types/contracts/safe-smart-account/contracts/libraries/CreateCall";
import hre, { ethers } from "hardhat";

import { formatUnits, getBytes, parseUnits, zeroPadBytes } from "ethers";
import * as ethersV6 from "ethers";
import * as sapphire from "@oasisprotocol/sapphire-paratime";
import { AssetForwarder__factory, PrivacyERC20__factory, WhisprBridge__factory } from "../../typechain-types";
import { TOKEN_ADDRESS, TOKEN_TESTNET } from "../../utils/address";

async function mintWhispr() {
    const { getChainId } = hre;
    const { deployments, getNamedAccounts } = hre;
    const { deploy, save, execute, get, read } = deployments;

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    // //const whisprDeployment = await get("WhisprUSD");
    // const whispr = PrivacyERC20__factory.connect(whisprDeployment.address, ethers.provider);
    // let real_balance = await whispr.connect(deployer).balanceOf(deployer.address);
    // console.log(`Real balance: ${formatUnits(real_balance, 18)}`);

    // const bridgeDeployment = await get("WhisprBridge");
    // let bridge = WhisprBridge__factory.connect(bridgeDeployment.address, ethers.provider);

    // const assetDeployment = await get("AssetForwarder");

    let asset = AssetForwarder__factory.connect("0x21c1E74CAaDf990E237920d5515955a024031109", ethers.provider);
    let raw =
        "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000493e0353600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000493e000000000000000000000000000000000000000000000000000000000000000b80000000000000000000000008c4acd74ff4385f3b7911432fa6787aa14406f8b00000000000000000000000067aff73fe697faee580583d09a3d854fe271a7e000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000001448d66a65693db44d3ca05cbb54e0a806096e2eda000000000000000000000000000000000000000000000000000000000000000000000000000000000000001455d398326f99059ff775485246999027b3197955000000000000000000000000";

    const hash = "0x18cade97769048f1dbd7ad19c029ef4e844b068b8d3a568216d55245b86536d3";

    const decode = ethersV6.AbiCoder.defaultAbiCoder().decode(
        asset.interface.getEvent("FundsDeposited").inputs,
        getBytes(raw)
    );

    console.log("Decode:", decode);

    // const filter = asset.filters.DepositInfoUpdate;

    // const receipt = await ethers.provider.getTransactionReceipt(hash);
    // console.log("Receipt:", receipt);
    // if (receipt && receipt.logs) {
    //     for (const log of receipt.logs) {
    //         try {
    //             const parsedLog = asset.interface.parseLog(log);
    //             if (parsedLog!.name === "DepositInfoUpdate") {
    //                 console.log("DepositInfoUpdate event found:", parsedLog!.args);
    //             }
    //         } catch (error) {
    //             // Ignore errors from logs that do not match the event
    //         }
    //     }
    // }
}

mintWhispr();
