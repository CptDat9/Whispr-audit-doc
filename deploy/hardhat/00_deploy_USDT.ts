import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CHAIN_ID } from "../../utils/network";
import { includes } from "lodash";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getChainId } = hre;
    const { deployments, getNamedAccounts } = hre;
    const { deploy, save, getOrNull, execute, read } = deployments;
    const { deployer } = await getNamedAccounts();

    await deploy("USDT", {
        contract: "ERC20Mintable",
        from: deployer,
        log: true,
        args: ["USDT", "USDT", 6],
    });
};
export default func;
func.tags = ["USDT"];
