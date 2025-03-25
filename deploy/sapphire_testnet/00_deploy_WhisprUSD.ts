import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CHAIN_ID } from "../../utils/network";
import { includes } from "lodash";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getChainId } = hre;
    const { deployments, getNamedAccounts } = hre;
    const { deploy, save, getOrNull, execute, read } = deployments;
    const { deployer } = await getNamedAccounts();

    await deploy("WhisprUSD", {
        contract: "PrivacyERC20",
        from: deployer,
        log: true,
        skipIfAlreadyDeployed: true,
        args: ["WhisprUSD", "WUSD", 18, deployer],
    });
};
export default func;
func.tags = ["WhisprUSD"];
