import { HardhatUserConfig } from "hardhat/config";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "@typechain/hardhat";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-network-helpers";
import "@nomicfoundation/hardhat-ethers";
import "@oasisprotocol/sapphire-hardhat";
import dotenv from "dotenv";
import "@openzeppelin/hardhat-upgrades";

dotenv.config();

const TEST_HDWALLET = {
    mnemonic: "test test test test test test test test test test test junk",
    path: "m/44'/60'/0'/0",
    initialIndex: 0,
    count: 20,
    passphrase: "",
};

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY, process.env.PRIVATE_KEY_2!] : TEST_HDWALLET;

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            gasPrice: 100e9,
            live: false,
            deploy: ["deploy/hardhat"],
        },
        eth_sepolia: {
            url: process.env.ETH_SEPOLIA_RPC,
            chainId: 11155111,
            live: true,
            tags: ["eth-sepolia"],
            accounts,
        },
        sapphire_testnet: {
            url: "https://testnet.sapphire.oasis.dev",
            chainId: 0x5aff,
            live: true,
            tags: ["sapphire-testnet"],
            accounts,
            deploy: ["deploy/sapphire_testnet"],
        },
        sapphire_mainnet: {
            url: "https://sapphire.oasis.io",
            chainId: 0x5afe,
            live: true,
            tags: ["sapphire-mainnet"],
            accounts,
            deploy: ["deploy/sapphire_mainnet"],
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.24",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                    viaIR: true,
                },
            },
        ],
    },
    gasReporter: {
        currency: "USD",
        gasPrice: 21,
        enabled: false,
    },
    mocha: {
        timeout: 200000,
        require: ["dd-trace/ci/init"],
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
            42161: 0,
            53935: 3,
            335: 3,
        },
        relayer: {
            default: 1, // use a different account for relayer on the hardhat network
        },
        libraryDeployer: {
            default: 0, // use a different account for deploying libraries on the hardhat network
            1: 0, // use the same address as the main deployer on mainnet,
            250: 0,
        },
    },
};

export default config;
