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
    const assetForwarder = await get("AssetForwarder");
    const thornUSD = await get("ThornUSD");
    const whisprUSD = await get("WhisprUSD");
    const minter = await get("WhisprMinter");
    const router = await get("StableSwapRouter");
    const refundWalletEntrypoint = await get("RefundWalletEntrypoint");
    const bridge = await deploy("WhisprBridge", {
        contract: "WhisprBridge",
        from: deployer,
        log: true,
        args: [],
        skipIfAlreadyDeployed: true,
        proxy: {
            owner: deployer,
            execute: {
                init: {
                    methodName: "initialize",
                    args: [
                        whisprUSD.address,
                        minter.address,
                        thornUSD.address,
                        router.address,
                        assetForwarder.address,
                        refundWalletEntrypoint.address,
                    ],
                },
            },
        },
    });

    const BRIDGE_ROLE = await read("RefundWalletEntrypoint", { from: deployer }, "BRIDGE_ROLE");

    await execute("RefundWalletEntrypoint", { from: deployer, log: true }, "grantRole", BRIDGE_ROLE, bridge.address);
};
export default func;
func.tags = ["WhisprMinter"];
