import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CHAIN_ID } from "../../utils/network";
import { includes } from "lodash";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getChainId } = hre;
    const { deployments, getNamedAccounts } = hre;
    const { deploy, save, getOrNull, execute, read } = deployments;
    const { deployer } = await getNamedAccounts();

    await deploy("AssetForwarder", {
        contract: "AssetForwarder",
        from: deployer,
        log: true,
        proxy: {
            owner: deployer,
            execute: {
                init: {
                    methodName: "initialize",
                    args: [],
                },
            },
        },
    });
};
export default func;
func.tags = ["WhisprUSD"];
