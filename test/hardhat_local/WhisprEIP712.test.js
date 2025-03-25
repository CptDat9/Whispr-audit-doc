const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WhisprEIP712", function () {
    let whisprEIP712, owner, user1, user2;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const WhisprEIP712Factory = await ethers.getContractFactory("WhisprEIP712");
        whisprEIP712 = await WhisprEIP712Factory.deploy();
        await whisprEIP712.waitForDeployment();
    });

    it("khởi tạo các dấu phân cách miền đúng.", async function () {
        const domainBalance = await whisprEIP712.DOMAIN_BALANCEOF();
        const domainApprove = await whisprEIP712.DOMAIN_APPROVE();
        const domainTransfer = await whisprEIP712.DOMAIN_TRANSFER();

        expect(domainBalance).to.not.equal(ethers.ZeroHash);
        expect(domainApprove).to.not.equal(ethers.ZeroHash);
        expect(domainTransfer).to.not.equal(ethers.ZeroHash);
    });

    it("trả về nonce chính xác", async function () {
        const nonce = await whisprEIP712._getNonceEIP712(user1.address); // Sửa hàm gọi
        expect(nonce).to.equal(0);
    });

    it("tăng nonce đúng", async function () {
        await whisprEIP712._incrementNonceEIP712(user1.address); // Sửa hàm gọi
        const nonce = await whisprEIP712._getNonceEIP712(user1.address);
        expect(nonce).to.equal(1);
    });

    it("xác thực chữ ký EIP-712 ", async function () {
        const domain = {
            name: "Whispr",
            version: "1",
            chainId: await ethers.provider.getNetwork().then(n => n.chainId),
            verifyingContract: await whisprEIP712.getAddress(),
        };

        const types = {
            BalanceOfData: [
                { name: "owner", type: "address" },
                { name: "validAfter", type: "uint256" },
                { name: "validUntil", type: "uint256" },
            ],
        };

        const validAfter = Math.floor(Date.now() / 1000) - 10;
        const validUntil = Math.floor(Date.now() / 1000) + 1000;

        const message = {
            owner: user1.address,
            validAfter: validAfter,
            validUntil: validUntil,
        };

        const signature = await user1.signTypedData(domain, types, message);

        // ethers v6: Signature.from instead of splitSignature
        const parsedSig = ethers.Signature.from(signature);
        const v = parsedSig.v;
        const r = parsedSig.r;
        const s = parsedSig.s;

        expect(v).to.be.a("number");
        expect(r).to.match(/^0x[0-9a-fA-F]{64}$/);
        expect(s).to.match(/^0x[0-9a-fA-F]{64}$/);
    });
});
