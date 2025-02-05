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
- Cơ chế RefundWallet:
Hỗ trợ hoàn tiền tự động cho các giao dịch thất bại hoặc cần hủy.
Tạo ví hoàn tiền riêng biệt cho từng giao dịch để tối ưu hóa bảo mật.
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

#### **RefundWallet**
- Hỗ trợ rút token hoàn trả cho người dùng.
- Chỉ có `Entrypoint` mới có quyền thực hiện rút tiền.
- Cho phép rút các token ERC-20.

#### **RefundWalletEntrypoint**
- Tạo ví hoàn trả (Refund Wallet) cho mỗi giao dịch nạp tiền.
- Hỗ trợ xác thực đăng nhập bằng EIP-712.
- Cho phép rút token từ ví hoàn trả và swap thành `WhisprUSD`.

#### **Wallet**
- Là contract ví được sử dụng trong hệ thống Whispr.
- Chỉ admin mới có quyền thực hiện giao dịch từ ví này.
- Hỗ trợ thực thi các giao dịch tùy chỉnh.

#### **Proxy**
- Là proxy contract hỗ trợ nâng cấp các ví RefundWallet.
- Delegate call đến contract triển khai (implementation).

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
#### **RefundWallet**  

| Thuộc tính   | Ý nghĩa |
|-------------|---------|
| `VERSION`   | Chuỗi phiên bản của contract (`"0.0.1"`) |
| `entrypoint` | Địa chỉ của contract **RefundWalletEntrypoint**, chỉ contract này mới có quyền gọi `withdraw` |
| `owner`     | Địa chỉ chủ sở hữu của ví hoàn trả (người dùng) |
| `depositId` | ID của lần nạp tiền tương ứng với ví hoàn trả |

#### **RefundWalletEntrypoint**  

| Thuộc tính               | Ý nghĩa |
|--------------------------|---------|
| `ENTRYPOINT_VERSION`     | Chuỗi phiên bản của contract (`"0.0.1"`) |
| `BRIDGE_ROLE`           | Hash của chuỗi `"BRIDGE_ROLE"` dùng để xác thực vai trò bridge |
| `thornUSD`              | Địa chỉ token ThornUSD, token chính trong hệ thống |
| `whisprMinter`          | Địa chỉ của contract **WhisprMinter**, dùng để mint WhisprUSD |
| `stableSwapRouter`      | Địa chỉ của contract **StableSwapRouter**, dùng để swap token |
| `thornBridge`           | Địa chỉ của contract **ThornBridge**, chịu trách nhiệm cầu nối (bridge) tài sản |
| `basicImplementation`   | Địa chỉ của contract **RefundWallet**, được dùng làm implementation cho proxy |
| `countTransaction`      | Mapping lưu số lượng transaction của từng chủ sở hữu ví |
| `ownerToWallet`         | Mapping lưu địa chỉ ví hoàn trả theo chủ sở hữu và số thứ tự giao dịch |
| `EIP712_DOMAIN_TYPEHASH` | Hash của cấu trúc domain EIP-712 |
| `LOGIN_CODE`            | Hash của chuỗi `"Whispr.login"`, dùng để xác thực đăng nhập EIP-712 |
| `DOMAIN_LOGIN`          | Hash của domain đăng nhập, được tạo từ `EIP712_DOMAIN_TYPEHASH` |
#### **Wallet**

| Thuộc tính  | Ý nghĩa                                                                                         |
|-------------|-------------------------------------------------------------------------------------------------|
| `admin`     | Địa chỉ của admin, người có quyền thực hiện các hành động chỉ dành cho admin.                   |
| `dest`      | Địa chỉ của contract hoặc tài khoản đích được gọi bởi hàm `execute_ncC`.                        |
| `value`     | Số lượng ETH (hoặc giá trị) được gửi kèm khi thực hiện lệnh gọi tới `dest`.                     |
| `func`      | Dữ liệu mã hóa (`calldata`) của hàm được gọi trên `dest`.                                       |
| `target`    | Địa chỉ contract hoặc tài khoản đích được sử dụng trong hàm nội bộ `_call`.                     |
| `data`      | Dữ liệu mã hóa (`bytes`) được truyền vào hàm `_call`.                                           |
| `success`   | Kết quả của lệnh gọi contract (thành công hay thất bại), được xác định qua assembly.            |
| `ptr`       | Con trỏ trong bộ nhớ, được sử dụng để lưu dữ liệu trả về từ contract khác trong assembly.        |
#### **Proxy**

| Thuộc tính      | Ý nghĩa                                                                                     |
|------------------|---------------------------------------------------------------------------------------------|
| `_implementation` | Địa chỉ của contract implementation, được thiết lập khi khởi tạo Proxy.                   |
| `target`          | Địa chỉ contract implementation được lấy từ slot lưu trữ (sử dụng `sload`).              |
| `result`          | Kết quả của lệnh `delegatecall`, xác định xem việc gọi hàm ở implementation thành công hay không. |

## Các usecase quan trọng
### WhisprECDSA

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
### WhisprEIP712

#### _getNonceEIP712
**Input:**
| Parameter | Meaning |
|-----------|---------|
| owner | Địa chỉ của người dùng cần lấy nonce |

**Các công việc thực hiện:**
- Trả về giá trị nonce hiện tại của địa chỉ `owner`.



#### _incrementNonceEIP712
**Input:**
| Parameter | Meaning |
|-----------|---------|
| owner | Địa chỉ của người cần tăng nonce |

**Các công việc thực hiện:**
- Tăng giá trị nonce của `owner` lên 1.



#### authenticatedBalance
**Input:**
| Parameter | Meaning |
|-----------|---------|
| auth | Dữ liệu xác thực `BalanceOfData` |

**Các công việc thực hiện:**
- Kiểm tra thời gian hợp lệ của chữ ký.
- Tạo `authdataDigest` để kiểm tra tính hợp lệ của chữ ký.
- Sử dụng `ecrecover` để trích xuất địa chỉ ký từ chữ ký số.
- Kiểm tra xem địa chỉ được trích xuất có khớp với `auth.owner` không.



#### authenticatedApprove
**Input:**
| Parameter | Meaning |
|-----------|---------|
| auth | Dữ liệu xác thực `ApproveData` |

**Các công việc thực hiện:**
- Kiểm tra thời gian hợp lệ của chữ ký.
- Kiểm tra nonce để đảm bảo không có giao dịch trùng lặp.
- Tạo `authdataDigest` để kiểm tra tính hợp lệ của chữ ký.
- Sử dụng `ecrecover` để trích xuất địa chỉ ký từ chữ ký số.
- Kiểm tra xem địa chỉ được trích xuất có khớp với `auth.owner` không.



#### authenticatedTransfer
**Input:**
| Parameter | Meaning |
|-----------|---------|
| auth | Dữ liệu xác thực `TransferData` |

**Các công việc thực hiện:**
- Kiểm tra thời gian hợp lệ của chữ ký.
- Kiểm tra nonce để đảm bảo không có giao dịch trùng lặp.
- Tạo `authdataDigest` để kiểm tra tính hợp lệ của chữ ký.
- Sử dụng `ecrecover` để trích xuất địa chỉ ký từ chữ ký số.
- Kiểm tra xem địa chỉ được trích xuất có khớp với `auth.from` không.

### WhisprERC20

#### mint
**Input:**
| Parameter | Meaning |
|-----------|---------|
| to | Địa chỉ nhận token được mint |
| amount | Số lượng token cần mint |

**Các công việc thực hiện:**
- Kiểm tra xem người gọi có quyền `MINTER_ROLE` hay không.
- Gọi hàm `_mint(to, amount)` để tạo thêm token cho địa chỉ `to`.

---

#### burn
**Input:**
| Parameter | Meaning |
|-----------|---------|
| amount | Số lượng token cần burn |

**Các công việc thực hiện:**
- Gọi hàm `_burn(msg.sender, amount)` để giảm số lượng token của người gọi.

---

#### totalSupply
**Input:** Không có  

**Các công việc thực hiện:**
- Trả về tổng số token đang lưu hành (`_globalTotalSupply`).

---

#### balanceOf
**Input:**
| Parameter | Meaning |
|-----------|---------|
| account | Địa chỉ tài khoản cần kiểm tra số dư |

**Các công việc thực hiện:**
- Kiểm tra quyền truy cập thông qua `WhisprPrivacyPolicy`.
- Nếu được phép, trả về số dư của `account`, ngược lại trả về `0`.



#### allowance
**Input:**
| Parameter | Meaning |
|-----------|---------|
| owner | Địa chỉ chủ sở hữu token |
| spender | Địa chỉ được cấp quyền chi tiêu token |

**Các công việc thực hiện:**
- Kiểm tra quyền truy cập thông qua `WhisprPrivacyPolicy`.
- Nếu `spender` là người gọi và đã được cấp quyền, trả về số lượng token được phép sử dụng.
- Ngược lại, trả về số lượng token `owner` đã cấp phép cho `spender`.



#### approve
**Input:**
| Parameter | Meaning |
|-----------|---------|
| spender | Địa chỉ được cấp quyền sử dụng token |
| amount | Số lượng token được cấp phép |

**Các công việc thực hiện:**
- Gọi `_approve(owner, spender, amount)` để cấp quyền sử dụng token cho `spender`.



#### transfer
**Input:**
| Parameter | Meaning |
|-----------|---------|
| to | Địa chỉ nhận token |
| amount | Số lượng token cần chuyển |

**Các công việc thực hiện:**
- Gọi `_transfer(owner, to, amount)` để thực hiện giao dịch.



#### transferFrom
**Input:**
| Parameter | Meaning |
|-----------|---------|
| from | Địa chỉ gửi token |
| to | Địa chỉ nhận token |
| amount | Số lượng token cần chuyển |

**Các công việc thực hiện:**
- Gọi `_spendAllowance(from, spender, amount)` để kiểm tra và trừ lượng token được cấp phép.
- Gọi `_transfer(from, to, amount)` để thực hiện giao dịch.


#### approveUseSignature
**Input:**
| Parameter | Meaning |
|-----------|---------|
| owner | Địa chỉ chủ sở hữu token |
| spender | Địa chỉ được cấp quyền sử dụng token |
| amount | Số lượng token được cấp phép |
| data | Dữ liệu EIP-712 xác thực giao dịch |
| signature | Chữ ký số xác nhận giao dịch |

**Các công việc thực hiện:**
- Xác thực chữ ký với `_verifyApprove(owner, spender, amount, data, signature)`.
- Tăng nonce của `owner` để tránh replay attack.
- Cấp quyền sử dụng token cho `spender`.


#### transferUseSignature
**Input:**
| Parameter | Meaning |
|-----------|---------|
| from | Địa chỉ gửi token |
| to | Địa chỉ nhận token |
| amount | Số lượng token cần chuyển |
| data | Dữ liệu EIP-712 xác thực giao dịch |
| signature | Chữ ký số xác nhận giao dịch |

**Các công việc thực hiện:**
- Xác thực chữ ký với `_verifyTransfer(from, to, amount, data, signature)`.
- Tăng nonce của `from` để tránh replay attack.
- Thực hiện chuyển token từ `from` đến `to`.


#### balanceOfByEIP712
**Input:**
| Parameter | Meaning |
|-----------|---------|
| auth | Dữ liệu xác thực `BalanceOfData` |

**Các công việc thực hiện:**
- Kiểm tra thời gian hợp lệ của chữ ký.
- Xác thực địa chỉ `auth.owner` thông qua chữ ký số.
- Trả về số dư của `auth.owner` nếu xác thực thành công.


#### approveByEIP712
**Input:**
| Parameter | Meaning |
|-----------|---------|
| auth | Dữ liệu xác thực `ApproveData` |

**Các công việc thực hiện:**
- Kiểm tra thời gian hợp lệ của chữ ký.
- Kiểm tra nonce để đảm bảo không có giao dịch trùng lặp.
- Xác thực chữ ký số để đảm bảo tính hợp lệ.
- Tăng nonce của `auth.owner`.
- Cấp quyền sử dụng token cho `auth.spender`.


#### transferByEIP712
**Input:**
| Parameter | Meaning |
|-----------|---------|
| auth | Dữ liệu xác thực `TransferData` |

**Các công việc thực hiện:**
- Kiểm tra thời gian hợp lệ của chữ ký.
- Kiểm tra nonce để đảm bảo không có giao dịch trùng lặp.
- Xác thực chữ ký số để đảm bảo tính hợp lệ.
- Tăng nonce của `auth.from`.
- Chuyển token từ `auth.from` đến `auth.to`.

### WhisprPrivacyPolicy

#### grant
**Input:**
| Parameter | Meaning |
|-----------|---------|
| to | Địa chỉ sẽ được cấp quyền |
| accessType | Loại quyền riêng tư (ví dụ: `PrivacyPolicy.Reveal`) |

**Các công việc thực hiện:**
- Kiểm tra xem quyền truy cập đã được cấp chưa bằng `grantedAccess[msg.sender][to]`.
- Nếu chưa cấp quyền, cập nhật `grantedAccess[msg.sender][to]` bằng cách sử dụng `Bitmask.set(accessIndex)`.
- Nếu quyền đã được cấp, báo lỗi `"Access already granted"`.

#### revoke
**Input:**
| Parameter | Meaning |
|-----------|---------|
| from | Địa chỉ bị thu hồi quyền |
| accessType | Loại quyền riêng tư cần thu hồi |

**Các công việc thực hiện:**
- Kiểm tra xem quyền truy cập đã được cấp chưa bằng `grantedAccess[msg.sender][from]`.
- Nếu có quyền, xóa quyền truy cập bằng `Bitmask.unset(accessIndex)`.
- Nếu chưa có quyền, báo lỗi `"No access granted yet"`.


#### hasAccess
**Input:**
| Parameter | Meaning |
|-----------|---------|
| owner | Địa chỉ của người sở hữu thông tin |
| accessor | Địa chỉ của người muốn truy cập thông tin |
| accessType | Loại quyền riêng tư cần kiểm tra |

**Các công việc thực hiện:**
- Kiểm tra xem `accessor` có quyền truy cập vào dữ liệu của `owner` hay không.
- Trả về `true` nếu `grantedAccess[owner][accessor]` chứa `accessType`, ngược lại trả về `false`.
### WhisprBridge

#### initialize
**Input:**
| Parameter | Meaning |
|-----------|---------|
| _whisprUSD | Địa chỉ của token WhisprUSD |
| _whisprUSDMinter | Địa chỉ của hợp đồng minter cho WhisprUSD |
| _thornUSD | Địa chỉ của token ThornUSD |
| _stableSwapRouter | Địa chỉ của router hoán đổi stablecoin |
| _assetForwarder | Địa chỉ của hợp đồng chuyển tiếp tài sản |
| _refundWalletEntrypoint | Địa chỉ của hợp đồng tạo ví hoàn tiền |

**Các công việc thực hiện:**
- Khởi tạo quyền truy cập bằng `AccessControl`.
- Gán vai trò `DEFAULT_ADMIN_ROLE` cho `msg.sender`.
- Lưu trữ các địa chỉ của các hợp đồng liên quan.


#### init2e2Proxy
**Input:**  
Không có.

**Các công việc thực hiện:**
- Yêu cầu người gọi phải có vai trò `DEFAULT_ADMIN_ROLE`.
- Tạo khóa công khai và khóa riêng Curve25519 bằng `Sapphire.generateCurve25519KeyPair`.



#### getPublicKey
**Input:**  
Không có.

**Output:**
- Trả về khóa công khai Curve25519.

**Các công việc thực hiện:**
- Lấy và trả về giá trị khóa công khai Curve25519.



#### bridge
**Input:**
| Parameter | Meaning |
|-----------|---------|
| approveData | Dữ liệu phê duyệt giao dịch (`IWhisprERC20.ApproveData`) |
| amount | Số lượng WhisprUSD cần chuyển |
| tokenOut | Token đầu ra sau hoán đổi |
| amountOutMin | Số lượng tối thiểu của `tokenOut` nhận được sau hoán đổi |
| path | Đường dẫn hoán đổi token |
| flags | Cờ cho phép hoán đổi |
| bridgeData | Dữ liệu cầu nối (`BridgeData`) |

**Các công việc thực hiện:**
1. Xác thực và phê duyệt giao dịch WhisprUSD bằng `approveByEIP712`.
2. Chuyển `amount` WhisprUSD từ `approveData.owner` đến hợp đồng.
3. Đốt (burn) WhisprUSD để nhận ThornUSD.
4. Hoán đổi ThornUSD thành `tokenOut` bằng `stableSwapRouter`.
5. Tạo `depositId` thông qua `assetForwarder`.
6. Phê duyệt `tokenOut` cho `assetForwarder`.
7. Tạo địa chỉ ví hoàn tiền cho `approveData.owner`.
8. Gửi tài sản đến hợp đồng `assetForwarder`.
9. Ghi nhận sự kiện `BridgeSuccess`.

---

#### bridgeEncrypt
**Input:**
| Parameter | Meaning |
|-----------|---------|
| peerPublicKey | Khóa công khai của bên gửi |
| nonce | Nonce để giải mã dữ liệu |
| data | Dữ liệu đã mã hóa |
| amount | Số lượng WhisprUSD cần chuyển |
| tokenOut | Token đầu ra sau hoán đổi |
| amountOutMin | Số lượng tối thiểu của `tokenOut` nhận được sau hoán đổi |
| path | Đường dẫn hoán đổi token |
| flags | Cờ cho phép hoán đổi |
| bridgeData | Dữ liệu cầu nối (`BridgeData`) |

**Các công việc thực hiện:**
1. Tạo khóa đối xứng từ khóa công khai `peerPublicKey` và khóa riêng `privateKey`.
2. Giải mã dữ liệu `data` bằng `Sapphire.decrypt`.
3. Giải mã `approveData` từ `plaintext`.
4. Gọi hàm `bridge` với `approveData` và các tham số tương ứng.



#### update
**Input:**
| Parameter | Meaning |
|-----------|---------|
| _refundWalletEntrypoint | Địa chỉ mới của hợp đồng ví hoàn tiền |

**Các công việc thực hiện:**
- Yêu cầu người gọi phải có vai trò `DEFAULT_ADMIN_ROLE`.
- Cập nhật địa chỉ `refundWalletEntrypoint`.
### WhisprMinter

#### initialize
**Input:**
| Parameter | Meaning |
|-----------|---------|
| _whisprUSD | Địa chỉ của token WhisprUSD |
| _thornUSD | Địa chỉ của token ThornUSD |

**Các công việc thực hiện:**
- Khởi tạo hợp đồng với hai địa chỉ token `whisprUSD` và `thornUSD`.
- Gán vai trò `DEFAULT_ADMIN_ROLE` cho `msg.sender`.



#### mintWhisprUSD
**Input:**
| Parameter | Meaning |
|-----------|---------|
| amount | Số lượng ThornUSD cần chuyển đổi |
| receiver | Địa chỉ nhận WhisprUSD |

**Output:**
- Trả về số lượng WhisprUSD được mint.

**Các công việc thực hiện:**
1. Kiểm tra hợp đồng không bị tạm dừng (`whenNotPaused`).
2. Chuyển `amount` ThornUSD từ `msg.sender` đến hợp đồng.
3. Mint số lượng tương ứng WhisprUSD cho `receiver`.
4. Trả về số lượng WhisprUSD đã mint.



#### burnWhisprUSD
**Input:**
| Parameter | Meaning |
|-----------|---------|
| amount | Số lượng WhisprUSD cần đốt |
| receiver | Địa chỉ nhận ThornUSD sau khi đốt |

**Các công việc thực hiện:**
1. Kiểm tra hợp đồng không bị tạm dừng (`whenNotPaused`).
2. Chuyển `amount` WhisprUSD từ `msg.sender` đến hợp đồng.
3. Đốt (burn) số lượng WhisprUSD tương ứng.
4. Chuyển `amount` ThornUSD đến `receiver`.


#### pause
**Input:**  
Không có.

**Các công việc thực hiện:**
- Kiểm tra người gọi có quyền `DEFAULT_ADMIN_ROLE`.
- Tạm dừng hợp đồng (`_pause`).


#### unpause
**Input:**  
Không có.

**Các công việc thực hiện:**
- Kiểm tra người gọi có quyền `DEFAULT_ADMIN_ROLE`.
- Tiếp tục hoạt động hợp đồng (`_unpause`).


## Cài đặt mã nguồn
### **WhisprEDCSA**

**Import:**
- `ECDSA` từ `"ECDSA.sol"` của `OpenZeppelin`
- `MessageHashUtils` từ `MessageHashUtils.sol"` của `OpenZeppelin`

**Khai báo:**
```solidity
mapping(address => uint256) private _nonce;

bytes32 public APPROVE_ACTION = keccak256("APPROVE");

bytes32 public TRANSFER_ACTION = keccak256("TRANSFER");
```

**Function:**

- `_getNonce`
```solidity
function _getNonce(address owner) internal view returns (uint256) {
        return _nonce[owner];
}
```

- `_verifyApprove`
```solidity
function _verifyApprove(
        address owner,
        address spender,
        uint256 amount,
        bytes calldata data,
        bytes calldata signature
    ) internal view {
        (
            address _owner,
            address _spender,
            uint256 _amount,
            bytes32 _action,
            uint256 _nonceNumber,
            uint256 _validAfter,
            uint256 _validUntil
        ) = abi.decode(
                data,
                (address, address, uint256, bytes32, uint256, uint256, uint256)
            );
        require(owner == _owner, "PrivacyERC20Verify: owner mismatch");
        require(spender == _spender, "PrivacyERC20Verify: spender mismatch");
        require(amount == _amount, "PrivacyERC20Verify: amount mismatch");
        require(
            _action == APPROVE_ACTION,
            "PrivacyERC20Verify: action mismatch"
        );
        require(
            _nonceNumber == _nonce[owner],
            "PrivacyERC20Verify: invalid nonce"
        );
        require(
            block.timestamp >= _validAfter,
            "PrivacyERC20Verify: signature not yet valid"
        );
        require(
            block.timestamp <= _validUntil,
            "PrivacyERC20Verify: signature expired"
        );
        require(
            verifyEthMessage(owner, data, signature),
            "PrivacyERC20Verify: invalid signature"
        );
    }
```
- `_verifyTransfer`
```solidity
function _verifyTransfer(
        address owner,
        address spender,
        uint256 amount,
        bytes calldata data,
        bytes calldata signature
    ) internal view {
        (
            address _owner,
            address _spender,
            uint256 _amount,
            bytes32 _action,
            uint256 _nonceNumber,
            uint256 _validAfter,
            uint256 _validUntil
        ) = abi.decode(
                data,
                (address, address, uint256, bytes32, uint256, uint256, uint256)
            );
        require(owner == _owner, "PrivacyERC20Verify: owner mismatch");
        require(spender == _spender, "PrivacyERC20Verify: spender mismatch");
        require(amount == _amount, "PrivacyERC20Verify: amount mismatch");
        require(
            _action == TRANSFER_ACTION,
            "PrivacyERC20Verify: action mismatch"
        );
        require(
            _nonceNumber == _nonce[owner],
            "PrivacyERC20Verify: invalid nonce"
        );
        require(
            block.timestamp >= _validAfter,
            "PrivacyERC20Verify: signature not yet valid"
        );
        require(
            block.timestamp <= _validUntil,
            "PrivacyERC20Verify: signature expired"
        );

        require(
            verifyEthMessage(owner, data, signature),
            "PrivacyERC20Verify: invalid signature"
        );
    }
```

- `verifyEthMessage`
```solidity
function verifyEthMessage(
        address signer,
        bytes calldata data,
        bytes calldata signature
    ) public pure returns (bool) {
        bytes32 messageHash = keccak256(data);
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            messageHash
        );

        address recoveredSigner = ECDSA.recover(
            ethSignedMessageHash,
            signature
        );

        return recoveredSigner == signer;
    }

    function _incrementNonce(address owner) internal {
        _nonce[owner]++;
    }
```

### **WhisprEIP712**
**Import:**
- `None`

**Khai báo:**

```solidity
    struct SignatureRSV {
        bytes32 r;
        bytes32 s;
        uint256 v;
    }
    bytes32 public constant EIP712_DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );

    bytes32 public constant BALANCEOF_CODE = keccak256("Whispr.balanceOf");
    bytes32 public constant APPROVE_CODE = keccak256("Whispr.approve");
    bytes32 public constant TRANSFER_CODE = keccak256("Whispr.transfer");

    bytes32 public DOMAIN_BALANCEOF;
    bytes32 public DOMAIN_APPROVE;
    bytes32 public DOMAIN_TRANSFER;

    struct ApproveData {
        address owner;
        address spender;
        uint256 amount;
        uint256 nonce;
        uint256 validAfter;
        uint256 validUntil;
        SignatureRSV rsv;
    }

    struct BalanceOfData {
        address owner;
        uint256 validAfter;
        uint256 validUntil;
        SignatureRSV rsv;
    }

    struct TransferData {
        address from;
        address to;
        uint256 amount;
        uint256 nonce;
        uint256 validAfter;
        uint256 validUntil;
        SignatureRSV rsv;
    }

    mapping(address => uint256) internal _nonce_eip712;
```
**Constructor:**
```solidity
constructor() {
        DOMAIN_BALANCEOF = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                BALANCEOF_CODE,
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );

        DOMAIN_APPROVE = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                APPROVE_CODE,
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );

        DOMAIN_TRANSFER = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                TRANSFER_CODE,
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }
```
**Modifiers:**
- `authenticatedBalance:`
  
  ```solidity
      modifier authenticatedBalance(BalanceOfData calldata auth) {
        require(
            block.timestamp >= auth.validAfter,
            "WhisprEIP712: signature not yet valid"
        );
        require(
            block.timestamp <= auth.validUntil,
            "WhisprEIP712: signature expired"
        );
        bytes32 BALANCEOF_TYPEHASH = keccak256(
            bytes(
                "balanceOf(address owner,uint256 validAfter,uint256 validUntil)"
            )
        );
        // Validate EIP-712 sign-in authentication.
        bytes32 authdataDigest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_BALANCEOF,
                keccak256(
                    abi.encode(
                        BALANCEOF_TYPEHASH,
                        auth.owner,
                        auth.validAfter,
                        auth.validUntil
                    )
                )
            )
        );

        address recovered_address = ecrecover(
            authdataDigest,
            uint8(auth.rsv.v),
            auth.rsv.r,
            auth.rsv.s
        );
        require(
            auth.owner == recovered_address,
            "WhisprEIP712: Invalid BalanceOf Authentication"
        );
        _;
    }
  ```
  
- `authenticatedApprove:`
  
  ```solidity
      modifier authenticatedApprove(ApproveData calldata auth) {
        require(
            block.timestamp >= auth.validAfter,
            "WhisprEIP712: signature not yet valid"
        );
        require(
            block.timestamp <= auth.validUntil,
            "WhisprEIP712: signature expired"
        );
        require(
            auth.nonce == _nonce_eip712[auth.owner],
            "WhisprEIP712: invalid nonce"
        );
        bytes32 APPROVE_TYPEHASH = keccak256(
            "approve(address owner,address spender,uint256 amount,uint256 nonce,uint256 validAfter,uint256 validUntil)"
        );
        // Validate EIP-712 sign-in authentication.
        bytes32 authdataDigest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_APPROVE,
                keccak256(
                    abi.encode(
                        APPROVE_TYPEHASH,
                        auth.owner,
                        auth.spender,
                        auth.amount,
                        auth.nonce,
                        auth.validAfter,
                        auth.validUntil
                    )
                )
            )
        );

        address recovered_address = ecrecover(
            authdataDigest,
            uint8(auth.rsv.v),
            auth.rsv.r,
            auth.rsv.s
        );

        require(
            auth.owner == recovered_address,
            "WhisprEIP712: Invalid Appvove Authentication"
        );
        _;
    }
  ```
  
- `authenticatedTransfer:`
  
  ```solidity
      modifier authenticatedTransfer(TransferData calldata auth) {
        require(
            block.timestamp >= auth.validAfter,
            "WhisprEIP712: signature not yet valid"
        );
        require(
            block.timestamp <= auth.validUntil,
            "WhisprEIP712: signature expired"
        );
        require(
            auth.nonce == _nonce_eip712[auth.from],
            "WhisprEIP712: invalid nonce"
        );
        bytes32 TRANSFER_TYPEHASH = keccak256(
            "transfer(address from,address to,uint256 amount,uint256 nonce,uint256 validAfter,uint256 validUntil)"
        );
        // Validate EIP-712 sign-in authentication.
        bytes32 authdataDigest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_TRANSFER,
                keccak256(
                    abi.encode(
                        TRANSFER_TYPEHASH,
                        auth.from,
                        auth.to,
                        auth.amount,
                        auth.nonce,
                        auth.validAfter,
                        auth.validUntil
                    )
                )
            )
        );

        address recovered_address = ecrecover(
            authdataDigest,
            uint8(auth.rsv.v),
            auth.rsv.r,
            auth.rsv.s
        );

        require(
            auth.from == recovered_address,
            "WhisprEIP712: Invalid Transfer Authentication"
        );
        _;
    }
  ```

**Functions:**
- `_getNonceEIP712:`

  ```solidity
      function _getNonceEIP712(address owner) internal view returns (uint256) {
        return _nonce_eip712[owner];
     }
  ```

- `_incrementNonceEIP712:`

  ```solidity
    function _incrementNonceEIP712(address owner) internal {
        _nonce_eip712[owner]++;
    }
  ```

### **WhipsrPrivacyPolicy**
**Import:**
- Tạo thư viện `Bitmask`
  ```solidity
  library Bitmask {
    function get(uint256 bitmap, uint256 index) internal pure returns (bool) {
        uint256 mask = 1 << (index & 0xff);
        return bitmap & mask != 0;
    }

    function setTo(uint256 bitmap, uint256 index, bool value) internal pure returns (uint256) {
        if (value) {
            return set(bitmap, index);
        } else {
            return unset(bitmap, index);
        }
    }

    function set(uint256 bitmap, uint256 index) internal pure returns (uint256) {
        uint256 mask = 1 << (index & 0xff);
        return bitmap | mask;
    }

    function unset(uint256 bitmap, uint256 index) internal pure returns (uint256) {
        uint256 mask = 1 << (index & 0xff);
        return bitmap & ~mask;
    }
  }
  ``` 
**Khai báo:**

  ```solidity
  using Bitmask for uint256;

  enum PrivacyPolicy {
        Reveal
  }

  mapping(address => mapping(address => uint256)) internal grantedAccess;
  ```

**Functions:**

- `grant`
  
  ```solidity
  function grant(address to, PrivacyPolicy accessType) public {
        uint256 accessIndex = uint256(accessType);

        require(
            !grantedAccess[msg.sender][to].get(accessIndex),
            "Access already granted"
        );

        grantedAccess[msg.sender][to] = grantedAccess[msg.sender][to].set(
            accessIndex
        );
    }
  ```

- `revoke`

  ```solidity
  function revoke(address from, PrivacyPolicy accessType) public {
        uint256 accessIndex = uint256(accessType);

        require(
            grantedAccess[msg.sender][from].get(accessIndex),
            "No access granted yet"
        );
        grantedAccess[msg.sender][from] = grantedAccess[msg.sender][from].unset(
            accessIndex
        );
    }
  ```

- `hasAccess`

  ```solidity
  function hasAccess(
        address owner,
        address accessor,
        PrivacyPolicy accessType
    ) internal view returns (bool) {
        return grantedAccess[owner][accessor].get(uint256(accessType));
    }
  ```
### **WhisprERC20**
**Import:**
- `IERC20.sol` từ `OpenZeppelin`
- `AcessControl.sol` từ `OpenZeppelin`
- `WhisprEDCSA.sol`
- `WhisprEIP712.sol`
- `WhisprPrivacyPolicy.sol`

**Inheritance:**
- `IERC20`
- `AccesControl`
- `WhisprEDCSA`
- `WhisprEIP712`
- `WhisprPrivacyPolicy`

**Khai báo:**

```solidity
bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

mapping(address => uint256) internal _balances;
mapping(address => mapping(address => uint256)) internal _allowances;

string public name;
string public symbol;
uint8 public decimals;
uint256 public _globalTotalSupply;
```

**Constructor:**

 ```solidity
constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address owner
    ) WhisprEIP712() {
        name = name_;
        symbol = symbol_;
        decimals = decimals_;
        _grantRole(DEFAULT_ADMIN_ROLE, owner);
    }
```

**Functions:**
- `mint`

```solidity
function mint(
        address to,
        uint256 amount
    ) external virtual onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
function _mint(address to, uint256 amount) internal {
        _balances[to] += amount;
        _globalTotalSupply += amount;
    }
```

- `burn`

```solidity
function burn(uint256 amount) external virtual {
        _burn(msg.sender, amount);
    }
function _burn(address from, uint256 amount) internal {
        _balances[from] -= amount;
        _globalTotalSupply -= amount;
    }
```

- `_isAllowedByPrivacyPolicy`

```solidity
function _isAllowedByPrivacyPolicy(
        address owner
    ) private view returns (bool) {
        return
            _msgSender() == owner ||
            msg.sender == address(this) ||
            hasAccess(
                owner,
                _msgSender(),
                WhisprPrivacyPolicy.PrivacyPolicy.Reveal
            );
    }
```

- `totalSupply`

```solidity
function totalSupply() public view virtual override returns (uint256) {
        return _globalTotalSupply;
    }
```

- `balanceOf`

```solidity
function balanceOf(
        address account
    ) public view virtual override returns (uint256) {
        if (!_isAllowedByPrivacyPolicy(account)) {
            return 0;
        }

        return _balances[account];
    }
```

- `allowance`

```solidity
function allowance(
        address owner,
        address spender
    ) public view virtual override returns (uint256) {
        if (!_isAllowedByPrivacyPolicy(owner)) {
            return 0;
        }

        if (_allowances[owner][spender] > 0 && _msgSender() == spender) {
            return _allowances[owner][spender];
        }

        return _allowances[owner][spender];
    }

function _spendAllowance(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual {
        uint256 currentAllowance = _allowances[owner][spender];
        if (currentAllowance != type(uint256).max) {
            require(
                currentAllowance >= amount,
                "ERC20: insufficient allowance"
            );
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }
```

- `approve`

```solidity
function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        _allowances[owner][spender] = amount;
    }


function approve(
        address spender,
        uint256 amount
    ) external virtual returns (bool) {
        address owner = msg.sender;
        _approve(owner, spender, amount);
        return true;
    }
```

- `transfer`

```solidity
function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        uint256 fromBalance = _balances[from];
        require(
            fromBalance >= amount,
            "ERC20: transfer amount exceeds balance"
        );
        unchecked {
            _balances[from] = fromBalance - amount;
        }

        _balances[to] += amount;
    }

function transfer(
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address owner = msg.sender;
        _transfer(owner, to, amount);
        return true;
    }

function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address spender = msg.sender;
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }
```

- `getNonce`

```solidity
function getNonce(address account) public view returns (uint256) {
        if (!_isAllowedByPrivacyPolicy(account)) {
            return 0;
        }
        return _getNonce(account);
    }
```

- `verify`

```solidity
function verifyApprove(
        address owner,
        address spender,
        uint256 amount,
        bytes calldata data,
        bytes calldata signature
    ) public view {
        _verifyApprove(owner, spender, amount, data, signature);
    }

function verifyTransfer(
        address owner,
        address spender,
        uint256 amount,
        bytes calldata data,
        bytes calldata signature
    ) public view {
        _verifyTransfer(owner, spender, amount, data, signature);
    }
```

- `UseSignature`

```solidity
function approveUseSignature(
        address owner,
        address spender,
        uint256 amount,
        bytes calldata data,
        bytes calldata signature
    ) external virtual returns (bool) {
        _verifyApprove(owner, spender, amount, data, signature);
        _incrementNonce(owner);
        _approve(owner, spender, amount);
        return true;
    }

function transferUseSignature(
        address from,
        address to,
        uint256 amount,
        bytes calldata data,
        bytes calldata signature
    ) external virtual returns (bool) {
        _verifyTransfer(from, to, amount, data, signature);
        _incrementNonce(from);
        _transfer(from, to, amount);
        return true;
    }
```

- `EIP712`


```solidity
    function getNonceEIP712(address account) external view returns (uint256) {
        if (!_isAllowedByPrivacyPolicy(account)) {
            return 0;
        }
        return _getNonceEIP712(account);
    }

    function balanceOfByEIP712(
        BalanceOfData calldata auth
    ) external view authenticatedBalance(auth) returns (uint256) {
        return _balances[auth.owner];
    }

    function approveByEIP712(
        ApproveData calldata auth
    ) external authenticatedApprove(auth) returns (bool) {
        _incrementNonceEIP712(auth.owner);
        _approve(auth.owner, auth.spender, auth.amount);
        return true;
    }

    function transferByEIP712(
        TransferData calldata auth
    ) external authenticatedTransfer(auth) returns (bool) {
        _incrementNonceEIP712(auth.from);
        _transfer(auth.from, auth.to, auth.amount);
        return true;
    }
```

## Các vấn đề chưa giải quyết
