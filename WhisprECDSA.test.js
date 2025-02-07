const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WhisprECDSA", function () {
    let whisprECDSA, owner, user1, user2;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const WhisprECDSAFactory = await ethers.getContractFactory("WhisprECDSA");
        whisprECDSA = await WhisprECDSAFactory.deploy();
        await whisprECDSA.waitForDeployment();
    });

    it("khởi tạo các hành động đúng.", async function () {
        const approveAction = await whisprECDSA.APPROVE_ACTION();
        const transferAction = await whisprECDSA.TRANSFER_ACTION();

        expect(approveAction).to.not.equal(ethers.ZeroHash);
        expect(transferAction).to.not.equal(ethers.ZeroHash);
    });

    it("trả về nonce chính xác", async function () {
        const nonce = await whisprECDSA._getNonce(user1.address);
        expect(nonce).to.equal(0);
    });

    it("tăng nonce đúng", async function () {
        await whisprECDSA._incrementNonce(user1.address);
        const nonce = await whisprECDSA._getNonce(user1.address);
        expect(nonce).to.equal(1);
    });

    async function signData(owner, spender, amount, action, nonce) {
        const validAfter = Math.floor(Date.now() / 1000) - 10;
        const validUntil = Math.floor(Date.now() / 1000) + 1000;
        
        const data = ethers.AbiCoder.defaultAbiCoder().encode(
            ["address", "address", "uint256", "bytes32", "uint256", "uint256", "uint256"],
            [owner, spender, amount, action, nonce, validAfter, validUntil]
        );
        
        const messageHash = ethers.keccak256(data);
        const ethSignedMessageHash = ethers.solidityPackedKeccak256(
            ["string", "bytes32"],
            ["\x19Ethereum Signed Message:\n32", messageHash]
        );
        
        const signature = await user1.signMessage(ethers.getBytes(messageHash));
        return { data, signature };
    }

    it("xác thực chữ ký ECDSA cho hành động APPROVE", async function () {
        const owner = user1.address;
        const spender = user2.address;
        const amount = ethers.parseEther("1");
        const action = await whisprECDSA.APPROVE_ACTION();
        const nonce = Number(await whisprECDSA._getNonce(owner));
        
        const { data, signature } = await signData(owner, spender, amount, action, nonce);
        const isValid = await whisprECDSA.verifyEthMessage(owner, data, signature);
        expect(isValid).to.be.true;
    });

    it("xác thực chữ ký ECDSA cho hành động TRANSFER", async function () {
        const owner = user1.address;
        const spender = user2.address;
        const amount = ethers.parseEther("1");
        const action = await whisprECDSA.TRANSFER_ACTION();
        const nonce = Number(await whisprECDSA._getNonce(owner));
        
        const { data, signature } = await signData(owner, spender, amount, action, nonce);
        const isValid = await whisprECDSA.verifyEthMessage(owner, data, signature);
        expect(isValid).to.be.true;
    });

    it("không xác thực chữ ký ECDSA nếu nonce không khớp", async function () {
        const owner = user1.address;
        const spender = user2.address;
        const amount = ethers.parseEther("1");
        const action = await whisprECDSA.APPROVE_ACTION();
        
        //nonce ban đầu
        let nonce = Number(await whisprECDSA._getNonce(owner));
    
        //nonce cũ
        const { data, signature } = await signData(owner, spender, amount, action, nonce);
    
        // Tăng nonce trong hợp đồng để khác với nonce trong chữ ký
        await whisprECDSA._incrementNonce(owner);
    
        // _verifyApprove
        await expect(
            whisprECDSA._verifyApprove(owner, spender, amount, data, signature)
        ).to.be.revertedWith("PrivacyERC20Verify: invalid nonce");
    });
    
    it("không xác thực chữ ký ECDSA nếu chữ ký không hợp lệ", async function () {
        const owner = user1.address;
        const spender = user2.address;
        const amount = ethers.parseEther("1");
        const action = await whisprECDSA.APPROVE_ACTION();
        const nonce = Number(await whisprECDSA._getNonce(owner));
        
        const { data } = await signData(owner, spender, amount, action, nonce);
        const signature = await user2.signMessage(ethers.getBytes(data)); // Sai người ký
        
        const isValid = await whisprECDSA.verifyEthMessage(owner, data, signature);
        expect(isValid).to.be.false;
    });
});
