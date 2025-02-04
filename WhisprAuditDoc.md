# Whispr-audit-doc
## Giới thiệu
- Whispr là hệ thống hỗ trợ giao dịch token ẩn danh trên mạng Oasis Sapphire.
- WhisprUSD là token được phát triển dựa trên ERC-20 để hỗ trợ cơ chế của Whispr, đã được tùy chỉnh để phù hợp với tính riêng tư và xác thực giao dịch ẩn danh.
  Đây là tính năng mới rất độc đáo hứa hẹn sẽ làm đa dạng thêm hệ sinh thái DeFi.
## Các vấn đề cần giải quyết
- Cung cấp cơ chế giao dịch ẩn danh cho các token ERC-20 (contract hiện tại hỗ trợ WhisprUSD).
- Bảo mật thông tin giao dịch, không để lộ các thông tin giao dịch(địa chỉ người dùng, số lượng token, lịch sử giao dịch,...) trên blockchain.
- Xác thực giao dịch bằng EIP-712 để giảm chi phí gas và tăng tính bảo mật.
- Tạo cơ chế wrap/unwrap token để che giấu nguồn gốc của tài sản khi giao dịch.
- Hỗ trợ các chức năng quản lý quyền riêng tư và uỷ quyền giao dịch.
## Giải pháp

###  Xây dựng các contract sau:

#### **WhisprERC20**
- Contract token ẩn danh theo tiêu chuẩn ERC-20 với các tính năng tùy chỉnh phù hợp với tính riêng tư.
- Cắt bỏ các event công khai để tránh rò rỉ dữ liệu trên blockchain.

#### **WhisprEIP712**
- Hỗ trợ xác thực giao dịch ẩn danh bằng EIP-712.
- Ký giao dịch off-chain giúp tiết kiệm gas và bảo mật thông tin.

#### **WhisprECDSA**
- Cung cấp chữ ký số ECDSA để hỗ trợ xác thực giao dịch và uỷ quyền chuyển tiền.

#### **WhisprPrivacyPolicy**
- Hỗ trợ quản lý quyền riêng tư với các hàm `grant` và `revoke` để cấp và thu hồi quyền xem số dư, allowance.

#### **WhisprMinter**
- Quản lý việc mint token `WhisprUSD`.
- Chỉ những địa chỉ có quyền (*governance, minter*) mới có thể gọi hàm `mint`.

#### **WhisprBridge**
- Hỗ trợ chuyển đổi token `WhisprUSD` giữa các chain khác nhau thông qua cơ chế cross-chain.

#### **PrivacyWrapper**
- Cung cấp cơ chế wrap/unwrap token để che giấu nguồn gốc tài sản.
- **Wrap**: Người dùng gửi một số lượng token ERC-20 vào `PrivacyWrapper`, sau đó nhận lại lượng `wrapToken` tương ứng (`WhisprUSD`,...).
- **Unwrap**: Người dùng gửi `wrapToken` vào contract, sau đó contract sẽ **burn** `wrapToken` và chuyển lượng token ERC-20 tương ứng lại cho người dùng.

---

###  **Cơ chế hoạt động**
1. Người dùng **wrap** token ERC-20 thành `WhisprUSD` để giao dịch ẩn danh.
2. Giao dịch được gửi qua hệ thống mã hóa của **Sapphire**.
3. Xác thực giao dịch thông qua **EIP-712**.
4. Người dùng có thể **unwrap** `WhisprUSD` để nhận lại token ERC-20 gốc.
5. Với **bridge**, token có thể được chuyển đổi và gửi tới các pool khác (hỗ trợ giao dịch cross-chain).

## Thiết kế hệ thống
### Các thuộc tính quan trọng
#### WhisprECDSA

| Thuộc tính            | Ý nghĩa |
|-----------------------|---------|
| `_nonce`             | Mapping lưu trữ nonce của từng địa chỉ |
| `APPROVE_ACTION`     | Giá trị hash của chuỗi `"APPROVE"` |
| `TRANSFER_ACTION`    | Giá trị hash của chuỗi `"TRANSFER"` |
| `_getNonce`          | Hàm lấy giá trị nonce của một địa chỉ |
| `_verifyApprove`     | Hàm xác minh chữ ký cho hành động `approve` |
| `_verifyTransfer`    | Hàm xác minh chữ ký cho hành động `transfer` |
| `verifyEthMessage`   | Hàm xác minh chữ ký ECDSA trên chuỗi Ethereum |
| `_incrementNonce`    | Hàm tăng giá trị nonce của một địa chỉ |

#### WhisprEIP712

| Thuộc tính            | Ý nghĩa |
|-----------------------|---------|
| `EIP712_DOMAIN_TYPEHASH` | Giá trị hash của cấu trúc `EIP712Domain` |
| `BALANCEOF_CODE`     | Giá trị hash của chuỗi `"Whispr.balanceOf"` |
| `APPROVE_CODE`       | Giá trị hash của chuỗi `"Whispr.approve"` |
| `TRANSFER_CODE`      | Giá trị hash của chuỗi `"Whispr.transfer"` |
| `DOMAIN_BALANCEOF`   | Giá trị hash của miền `balanceOf` |
| `DOMAIN_APPROVE`     | Giá trị hash của miền `approve` |
| `DOMAIN_TRANSFER`    | Giá trị hash của miền `transfer` |
| `_nonce_eip712`      | Mapping lưu trữ nonce của từng địa chỉ cho EIP-712 |
| `authenticatedBalance` | Modifier xác minh chữ ký EIP-712 cho `balanceOf` |
| `authenticatedApprove` | Modifier xác minh chữ ký EIP-712 cho `approve` |
| `authenticatedTransfer` | Modifier xác minh chữ ký EIP-712 cho `transfer` |
| `_getNonceEIP712`    | Hàm lấy giá trị nonce EIP-712 của một địa chỉ |
| `_incrementNonceEIP712` | Hàm tăng giá trị nonce EIP-712 của một địa chỉ |


## Cài đặt mã nguồn
## Các vấn đề chưa giải quyết
