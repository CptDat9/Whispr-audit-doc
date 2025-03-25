import { ethers, hexlify } from "ethers";

export function derToRawSec(derSignature: string): string {
    // Đảm bảo chữ ký DER là buffer
    const derBuffer = ethers.getBytes(derSignature);

    // DER bắt đầu bằng 0x30, tiếp theo là độ dài
    if (derBuffer[0] !== 0x30) {
        throw new Error("Không phải chữ ký DER hợp lệ");
    }

    // Phân tích cấu trúc DER
    const rLength = derBuffer[3];

    const r = derBuffer.slice(4, 4 + rLength);

    const sLength = derBuffer[4 + rLength + 1];

    const s = derBuffer.slice(4 + rLength + 2, 4 + rLength + 2 + sLength);

    // Tạo chữ ký ở định dạng Raw bằng cách nối r và s
    const rawSignature = ethers.getBytes(ethers.concat([r, s]));

    return hexlify(rawSignature);
}
