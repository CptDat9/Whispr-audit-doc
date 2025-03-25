import { deployments, ethers } from "hardhat";

export const getContract = async (name: string) => {
    const deployment = await deployments.get(name);
    const Contract = await ethers.getContractFactory(name);
    return Contract.attach(deployment.address);
};
