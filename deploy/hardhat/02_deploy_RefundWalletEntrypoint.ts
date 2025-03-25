import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CHAIN_ID } from "../../utils/network";
import { includes } from "lodash";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getChainId } = hre;
    const { deployments, getNamedAccounts } = hre;
    const { deploy, save, getOrNull, get, execute, read } = deployments;
    const { deployer } = await getNamedAccounts();

    const thornUSD = await get("ThornUSD");
    const whisprUSD = await get("WhisprUSD");
    const minter = await get("WhisprMinter");
    const router = await get("StableSwapRouter");
    const singleton = await get("RefundWalletSingleton");

    const refund = await deploy("RefundWalletEntrypoint", {
        contract: "RefundWalletEntrypoint",
        from: deployer,
        log: true,
        proxy: {
            owner: deployer,
            execute: {
                methodName: "initialize",
                args: [thornUSD.address, whisprUSD.address, router.address, singleton.address],
            },
        },
    });
};
export default func;
func.tags = ["RefundWalletSingleton"];
