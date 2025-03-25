import { ethers } from "ethers";

async function computeHash() {
    // Step 1: keccak256("PrivacyERc.storage.EIP712")
    const storageHash = ethers.keccak256(ethers.toUtf8Bytes("Whispr.storage.ECDSA"));

    // Convert the hash to a BigInt and subtract 1
    const adjustedHash = BigInt(storageHash) - BigInt(1);

    // Step 2: Encode as uint256 (32-byte)
    const encoded = ethers.zeroPadValue(ethers.toBeHex(adjustedHash), 32);

    // Step 3: Compute keccak256 of the encoded value
    const finalHash = ethers.keccak256(encoded);

    // Step 4: Apply bitwise AND with ~bytes32(uint256(0xff))
    const mask = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00");
    const maskedValue = BigInt(finalHash) & mask;

    return ethers.zeroPadValue(ethers.toBeHex(maskedValue), 32);
}

computeHash().then(console.log);
