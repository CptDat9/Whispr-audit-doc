import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CHAIN_ID } from "../../utils/network";
import { includes } from "lodash";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getChainId } = hre;
    const { deployments, getNamedAccounts } = hre;
    const { deploy, save, getOrNull, execute, read } = deployments;
    const { deployer } = await getNamedAccounts();

    await deploy("RefundWalletSingleton", {
        contract: "RefundWallet",
        from: deployer,
        log: true,
        skipIfAlreadyDeployed: true,
    });
};
export default func;
func.tags = ["RefundWalletSingleton"];
