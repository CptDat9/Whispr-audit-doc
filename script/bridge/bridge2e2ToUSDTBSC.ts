import hre, { ethers } from "hardhat";

import { formatUnits, getBytes, parseUnits, zeroPadBytes } from "ethers";
import * as ethersV6 from "ethers";
import * as sapphire from "@oasisprotocol/sapphire-paratime";
import { PrivacyERC20__factory, WhisprBridge__factory } from "../../typechain-types";
import { TOKEN_ADDRESS, TOKEN_TESTNET } from "../../utils/address";

async function mintWhispr() {
    const { getChainId } = hre;
    const { deployments, getNamedAccounts } = hre;
    const { deploy, save, execute, get, read } = deployments;

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    const whisprDeployment = await get("WhisprUSD");
    const whispr = PrivacyERC20__factory.connect(whisprDeployment.address, ethers.provider);
    let real_balance = await whispr.connect(deployer).balanceOf(deployer.address);
    console.log(`Real balance: ${formatUnits(real_balance, 18)}`);

    const bridgeDeployment = await get("WhisprBridge");
    let bridge = WhisprBridge__factory.connect(bridgeDeployment.address, ethers.provider);

    if (real_balance > 10_000_000n) {
        const nonce_x = await whispr.connect(deployer).getNonceEIP712(deployer.address);
        console.log(`Nonce: ${nonce_x}`);
        const validAfter = Math.floor(Date.now() / 1000) - 100 * 60;
        const validUntil = Math.floor(Date.now() / 1000) + 100 * 60;
        const bridgeDeployment = await get("WhisprBridge");
        const bridge = WhisprBridge__factory.connect(bridgeDeployment.address, ethers.provider);
        const amount = parseUnits("10", 18);
        const amountOutMint = parseUnits("5", 6);
        const destAmount = parseUnits("5", 6);

        const signature = await deployer.signTypedData(
            {
                name: "Whispr.approve",
                version: "1",
                chainId: 23295,
                verifyingContract: await whispr.getAddress(),
            },
            {
                approve: [
                    { name: "owner", type: "address" },
                    { name: "spender", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "nonce", type: "uint256" },
                    { name: "validAfter", type: "uint256" },
                    { name: "validUntil", type: "uint256" },
                ],
            },
            {
                owner: deployer.address,
                spender: await bridge.getAddress(),
                amount: amount,
                nonce: nonce_x,
                validAfter: validAfter,
                validUntil: validUntil,
            }
        );
        const rsv = ethers.Signature.from(signature);
        const approveData = {
            owner: deployer.address,
            spender: await bridge.getAddress(),
            amount: amount,
            nonce: nonce_x,
            validAfter: validAfter,
            validUntil: validUntil,
            rsv,
        };
        const usdt = TOKEN_TESTNET.ThornUSD;
        let txResponse, txReceipt;

        const usdt_bsc = TOKEN_ADDRESS.BSC_TESTNET.USDT;

        const path = [TOKEN_ADDRESS.SAPPHIRE_TESTNET.THORNUSD, TOKEN_ADDRESS.SAPPHIRE_TESTNET.USDT];

        const flag = [2];

        // encrypt data

        const plaintext = ethersV6.AbiCoder.defaultAbiCoder().encode(
            ["address", "address", "uint256", "uint256", "uint256", "uint256", "tuple(bytes32, bytes32, uint256)"],
            [
                approveData.owner,
                approveData.spender,
                approveData.amount,
                approveData.nonce,
                approveData.validAfter,
                approveData.validUntil,
                [approveData.rsv.r, approveData.rsv.s, approveData.rsv.v],
            ]
        );

        const publicKey = await bridge.getPublicKey();
        const box = sapphire.cipher.X25519DeoxysII.ephemeral(publicKey);
        const { nonce, ciphertext } = await box.encrypt(getBytes(plaintext));
        const nonce_bytes32_hex = zeroPadBytes(nonce, 32);

        const txTest = await bridge
            .connect(deployer)
            .bridgeEncrypt.staticCall(
                box.publicKey,
                nonce_bytes32_hex,
                ciphertext,
                parseUnits("10", 18),
                TOKEN_ADDRESS.SAPPHIRE_TESTNET.USDT,
                parseUnits("5", 6),
                path,
                flag,
                {
                    partnerId: 1,
                    destAmount: destAmount,
                    refunder: deployer.address,
                    destChainId: ethersV6.encodeBytes32String("97"),
                    tokenDestChain: TOKEN_ADDRESS.BSC_TESTNET.USDT,
                    receiver: deployer.address,
                }
            );
        console.log(txTest);

        // const request = {
        //     nonce: nonce_bytes32_hex,
        //     publicKey: Buffer.from(box.publicKey).toString("hex"),
        //     cipherText: Buffer.from(ciphertext).toString("hex"),
        //     amount: parseUnits("10", 18).toString(),
        //     tokenOut: TOKEN_ADDRESS.SAPPHIRE_TESTNET.USDT,
        //     minAmountOut: parseUnits("5", 6).toString(),
        //     path: path,
        //     flag: flag,
        //     bridgeData: {
        //         partnerId: 1,
        //         destAmount: destAmount.toString(),
        //         refunder: deployer.address,
        //         destChainId: ethersV6.encodeBytes32String("97"),
        //         tokenDestChain: TOKEN_ADDRESS.BSC_TESTNET.USDT,
        //         receiver: deployer.address,
        //     },
        // };
        // console.log(JSON.stringify(request));

        // console.log(
        //     "tham so",
        //     box.publicKey,
        //     nonce_bytes32_hex,
        //     ciphertext,
        //     parseUnits("10", 18),
        //     TOKEN_ADDRESS.SAPPHIRE_TESTNET.USDT,
        //     parseUnits("5", 6),
        //     path,
        //     flag,
        //     {
        //         partnerId: 1,
        //         destAmount: destAmount,
        //         refunder: deployer.address,
        //         destChainId: ethersV6.encodeBytes32String("97"),
        //         tokenDestChain: TOKEN_ADDRESS.BSC_TESTNET.USDT,
        //         receiver: deployer.address,
        //     }
        // );

        txResponse = await bridge
            .connect(deployer)
            .bridgeEncrypt(
                box.publicKey,
                nonce_bytes32_hex,
                ciphertext,
                parseUnits("10", 18),
                TOKEN_ADDRESS.SAPPHIRE_TESTNET.USDT,
                parseUnits("5", 6),
                path,
                flag,
                {
                    partnerId: 1,
                    destAmount: destAmount,
                    refunder: deployer.address,
                    destChainId: ethersV6.encodeBytes32String("97"),
                    tokenDestChain: TOKEN_ADDRESS.BSC_TESTNET.USDT,
                    receiver: deployer.address,
                }
            );
        txReceipt = await txResponse.wait();

        const logs = txReceipt!.logs;
        //console.log(logs);

        for (let i = 0; i < logs.length; i++) {
            if (logs[i].address === (await bridge.getAddress())) {
                let event = bridge.interface.parseLog(logs[i]);
                console.log(event);
                console.log(`
address: ${event!.args.token}
amountOut: ${event!.args.amountOut}
deposit: ${event!.args.depositId}
destChainId: ${event!.args.destChainId}
tokenDestChain: ${event!.args.tokenDestChain}
receiver: ${event!.args.receiver}
refundAddress ${event!.args.refundAddress}
`);
            }
        }
        // let event = bridge.interface.parseLog(logs[0]);
    }
}
mintWhispr();
