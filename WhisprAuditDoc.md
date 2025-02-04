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
## WhisprECDSA

| Thuộc tính            | Ý nghĩa |
|-----------------------|---------|
| `_nonce`             | Mapping lưu trữ nonce của từng địa chỉ |
| `APPROVE_ACTION`     | Hash của chuỗi `"APPROVE"` dùng để xác thực hành động approve |
| `TRANSFER_ACTION`    | Hash của chuỗi `"TRANSFER"` dùng để xác thực hành động transfer |

## WhisprEIP712

| Thuộc tính           | Ý nghĩa |
|----------------------|---------|
| `EIP712_DOMAIN_TYPEHASH` | Hash của domain EIP-712 |
| `BALANCEOF_CODE`    | Hash của chuỗi `"Whispr.balanceOf"` |
| `APPROVE_CODE`      | Hash của chuỗi `"Whispr.approve"` |
| `TRANSFER_CODE`     | Hash của chuỗi `"Whispr.transfer"` |
| `DOMAIN_BALANCEOF`  | Hash của domain balanceOf |
| `DOMAIN_APPROVE`    | Hash của domain approve |
| `DOMAIN_TRANSFER`   | Hash của domain transfer |
| `_nonce_eip712`     | Mapping lưu trữ nonce của từng địa chỉ trong EIP-712 |

## Struct trong WhisprEIP712

| Struct           | Thuộc tính         | Ý nghĩa |
|-----------------|------------------|---------|
| `SignatureRSV`  | `r`, `s`, `v`    | Các giá trị chữ ký ECDSA |
| `ApproveData`   | `owner`           | Địa chỉ chủ sở hữu |
|                 | `spender`         | Địa chỉ được cấp quyền |
|                 | `amount`          | Số lượng token được approve |
|                 | `nonce`           | Nonce để ngăn chặn replay attack |
|                 | `validAfter`      | Thời điểm chữ ký bắt đầu có hiệu lực |
|                 | `validUntil`      | Thời điểm chữ ký hết hiệu lực |
|                 | `rsv`             | Chữ ký của người ký |
| `BalanceOfData` | `owner`           | Địa chỉ chủ sở hữu cần kiểm tra balance |
|                 | `validAfter`      | Thời điểm chữ ký bắt đầu có hiệu lực |
|                 | `validUntil`      | Thời điểm chữ ký hết hiệu lực |
|                 | `rsv`             | Chữ ký của người ký |
| `TransferData`  | `from`            | Địa chỉ gửi token |
|                 | `to`              | Địa chỉ nhận token |
|                 | `amount`          | Số lượng token được chuyển |
|                 | `nonce`           | Nonce để ngăn chặn replay attack |
|                 | `validAfter`      | Thời điểm chữ ký bắt đầu có hiệu lực |
|                 | `validUntil`      | Thời điểm chữ ký hết hiệu lực |
|                 | `rsv`             | Chữ ký của người ký |

## Cài đặt mã nguồn
## Các vấn đề chưa giải quyết
