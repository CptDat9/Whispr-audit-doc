import { RefundWalletEntrypoint } from "./../../typechain-types/contracts/refundWallet/RefundWalletEntrypoint";
import { AssetForwarder } from "../../typechain-types/contracts/test/route-protocol-fork/AssetForwarder";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CHAIN_ID } from "../../utils/network";
import { includes, min } from "lodash";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getChainId } = hre;
    const { deployments, getNamedAccounts } = hre;
    const { deploy, save, getOrNull, execute, read, get } = deployments;
    const { deployer } = await getNamedAccounts();
    const assetForwarder = "0xC948a7EDA6657D355b6c3212BdB0d33901fBDc28";
    const thornUSD = "0x111DC1F7908672E051E5cbFa7A1Ff555483CcBd2";
    const whisprUSD = await get("WhisprUSD");
    const minter = await get("WhisprMinter");
    const router = "0x430e458d39154fFE80C1f305F8E6ACCE135A5116";
    const refund = await get("RefundWalletEntrypoint");

    const bridge = await deploy("WhisprBridge", {
        contract: "WhisprBridge",
        from: deployer,
        log: true,
        args: [],
        proxy: {
            owner: deployer,
            execute: {
                init: {
                    methodName: "initialize",
                    args: [whisprUSD.address, minter.address, thornUSD, router, assetForwarder, refund.address],
                },
            },
        },
    });

    await execute("WhisprBridge", { from: deployer, log: true }, "init2e2Proxy");

    const BRIDGE_ROLE = await read("RefundWalletEntrypoint", { from: deployer }, "BRIDGE_ROLE");
    await execute("RefundWalletEntrypoint", { from: deployer, log: true }, "grantRole", BRIDGE_ROLE, bridge.address);
};
export default func;
func.tags = ["bridge"];
