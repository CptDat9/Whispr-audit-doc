import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CHAIN_ID } from "../../utils/network";
import { includes } from "lodash";
import { TOKEN_TESTNET } from "../../utils/address";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getChainId } = hre;
    const { deployments, getNamedAccounts } = hre;
    const { deploy, save, getOrNull, execute, read, get } = deployments;
    const { deployer } = await getNamedAccounts();

    const thornUSD = TOKEN_TESTNET.ThornUSD;
    const whisprUSD = await get("WhisprUSD");
    await deploy("WhisprMinter", {
        from: deployer,
        log: true,
        args: [],
        skipIfAlreadyDeployed: true,
        proxy: {
            owner: deployer,
            execute: {
                init: {
                    methodName: "initialize",
                    args: [whisprUSD.address, thornUSD],
                },
            },
        },
    });

    const MINTER_ROLE = await read("WhisprUSD", "MINTER_ROLE");
    await execute(
        "WhisprUSD",
        { from: deployer, log: true },
        "grantRole",
        MINTER_ROLE,
        (
            await get("WhisprMinter")
        ).address
    );
};
export default func;
func.tags = ["Minter"];
