import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CHAIN_ID } from "../../utils/network";
import { includes } from "lodash";
import { TOKEN_TESTNET } from "../../utils/address";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getChainId } = hre;
    const { deployments, getNamedAccounts } = hre;
    const { deploy, save, getOrNull, get, execute, read } = deployments;
    const { deployer } = await getNamedAccounts();

    const thornUSD = TOKEN_TESTNET.ThornUSD;
    const whisprUSD = await get("WhisprUSD");

    const router = "0x430e458d39154fFE80C1f305F8E6ACCE135A5116";

    const singleton = await get("RefundWalletSingleton");

    const refund = await deploy("RefundWalletEntrypoint", {
        contract: "RefundWalletEntrypoint",
        from: deployer,
        log: true,
        proxy: {
            owner: deployer,
            execute: {
                methodName: "initialize",
                args: [thornUSD, whisprUSD.address, router, singleton.address],
            },
        },
    });
};
export default func;
func.tags = ["RefundWalletEntrypoint"];
