import { Address } from "./../../typechain-types/@openzeppelin/contracts/utils/Address";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CHAIN_ID } from "../../utils/network";
import { includes } from "lodash";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getChainId } = hre;
    const { deployments, getNamedAccounts } = hre;
    const { deploy, save, getOrNull, execute, read } = deployments;
    const { deployer } = await getNamedAccounts();

    await deploy("Wallet", {
        contract: "Wallet",
        from: deployer,
        log: true,
        skipIfAlreadyDeployed: true,
        proxy: {
            owner: deployer,
            execute: {
                init: {
                    methodName: "initialize",
                    args: [deployer],
                },
            },
        },
    });
};
export default func;
func.tags = ["WhisprUSD"];
