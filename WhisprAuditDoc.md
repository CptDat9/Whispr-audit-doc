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
| `APPROVE_ACTION`     | Hash của chuỗi `"APPROVE"` dùng để xác thực hành động approve |
| `TRANSFER_ACTION`    | Hash của chuỗi `"TRANSFER"` dùng để xác thực hành động transfer |

#### WhisprEIP712

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

- Struct trong WhisprEIP712

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
#### WhisprERC20
| Thuộc tính    | Ý nghĩa |
|--------------|---------|
| `MINTER_ROLE` | Hash của role "MINTER_ROLE" dùng để cấp quyền mint token |
| `_balances`   | Mapping lưu số dư token của từng địa chỉ |
| `_allowances` | Mapping lưu hạn mức chi tiêu token được cấp giữa các địa chỉ |
| `name`        | Tên của token |
| `symbol`      | Ký hiệu của token |
| `decimals`    | Số chữ số thập phân của token |
| `_globalTotalSupply` | Tổng cung token trong hệ thống |
#### WhisprPrivacyPolicy

| Thuộc tính      | Ý nghĩa |
|----------------|---------|
| `PrivacyPolicy` | Enum định nghĩa các chính sách quyền riêng tư, hiện tại chỉ có một giá trị là `Reveal`, cho phép tiết lộ thông tin khi được cấp quyền. |
| `grantedAccess` | Mapping lưu trữ quyền truy cập của một địa chỉ đối với một địa chỉ khác, sử dụng bitmask để quản lý các quyền khác nhau. |
#### WhisprBridge

| Thuộc tính              | Ý nghĩa |
|------------------------|---------|
| `VERSION`             | Phiên bản của hợp đồng WhisprBridge. |
| `whisprUSD`           | Địa chỉ của token WhisprUSD. |
| `whisprUSDMinter`     | Địa chỉ của hợp đồng Minter dùng để đốt WhisprUSD và tạo ra ThornUSD. |
| `thornUSD`            | Địa chỉ của token ThornUSD, được tạo ra sau khi đốt WhisprUSD. |
| `stableSwapRouter`    | Địa chỉ của hợp đồng Router dùng để hoán đổi stablecoin giữa các chuỗi. |
| `assetForwarder`      | Địa chỉ của hợp đồng quản lý việc chuyển tài sản giữa các chuỗi. |
| `publicKey`           | Khóa công khai dùng cho mã hóa và bảo mật dữ liệu trên Sapphire. |
| `privateKey`          | Khóa bí mật dùng để tạo khóa đối xứng cho mã hóa dữ liệu trên Sapphire. |
| `oracle`             | Địa chỉ của Oracle, có thể được sử dụng để lấy dữ liệu giá hoặc xác thực giao dịch. |
| `clearingFee`        | Phí thanh toán (clearing fee) được áp dụng khi thực hiện giao dịch. |
| `refundWalletEntrypoint` | Địa chỉ của hợp đồng tạo ví hoàn tiền khi giao dịch thất bại. |

#### WhisprMinter

| Thuộc tính  | Ý nghĩa |
|------------|---------|
| `whisprUSD` | Địa chỉ của token WhisprUSD, được mint khi nhận ThornUSD. |
| `thornUSD`  | Địa chỉ của token ThornUSD, được cung cấp vào pool để đổi lấy WhisprUSD. |
### Các usecase quan trọng
#### WhisprECDSA

#### _getNonce
**Input:**
| Parameter | Meaning |
|-----------|---------|
| owner | Địa chỉ của người dùng cần lấy nonce |

**Các công việc thực hiện:**
- Trả về giá trị nonce hiện tại của địa chỉ `owner`.



#### _verifyApprove
**Input:**
| Parameter | Meaning |
|-----------|---------|
| owner | Địa chỉ của người cấp quyền |
| spender | Địa chỉ của người được cấp quyền |
| amount | Số lượng token được cấp quyền |
| data | Dữ liệu chữ ký kèm theo |
| signature | Chữ ký số xác thực giao dịch |

**Các công việc thực hiện:**
- Giải mã dữ liệu `data` để lấy các tham số cần thiết.
- Kiểm tra các tham số có trùng khớp với giá trị được cung cấp hay không.
- Kiểm tra hành động có phải `APPROVE` không.
- Xác minh nonce để đảm bảo không có giao dịch trùng lặp.
- Kiểm tra thời gian hợp lệ của chữ ký.
- Xác thực chữ ký với hàm `verifyEthMessage`.



#### _verifyTransfer
**Input:**
| Parameter | Meaning |
|-----------|---------|
| owner | Địa chỉ của người gửi token |
| spender | Địa chỉ của người thực hiện giao dịch |
| amount | Số lượng token được gửi |
| data | Dữ liệu chữ ký kèm theo |
| signature | Chữ ký số xác thực giao dịch |

**Các công việc thực hiện:**
- Giải mã dữ liệu `data` để lấy các tham số cần thiết.
- Kiểm tra các tham số có trùng khớp với giá trị được cung cấp hay không.
- Kiểm tra hành động có phải `TRANSFER` không.
- Xác minh nonce để đảm bảo không có giao dịch trùng lặp.
- Kiểm tra thời gian hợp lệ của chữ ký.
- Xác thực chữ ký với hàm `verifyEthMessage`.


#### verifyEthMessage
**Input:**
| Parameter | Meaning |
|-----------|---------|
| signer | Địa chỉ của người ký |
| data | Dữ liệu cần kiểm tra |
| signature | Chữ ký số để xác thực |

**Các công việc thực hiện:**
- Tạo `messageHash` từ `data`.
- Chuyển đổi `messageHash` thành định dạng Ethereum Signed Message.
- Trích xuất địa chỉ từ chữ ký.
- Kiểm tra xem địa chỉ trích xuất có khớp với `signer` không.



#### _incrementNonce
**Input:**
| Parameter | Meaning |
|-----------|---------|
| owner | Địa chỉ của người cần tăng nonce |

**Các công việc thực hiện:**
- Tăng giá trị nonce của `owner` lên 1.

## Cài đặt mã nguồn
## Các vấn đề chưa giải quyết
