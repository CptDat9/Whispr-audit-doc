# WhisprUSD

## Audit

Update soon

## Giới thiệu

WhisprUSD là 1 loại token được phát triển từ ERC-20 và đã được sửa đổi để phù hợp với
mạng lưới Oasis Sapphire

Các chức năng chính của WhisprUSD

-   Các chức năng của ERC-20 với sửa đổi cắt bỏ các event
-   Phân quyền xem số dư, allowance
-   Approve thông qua signature
-   Approve thông qua signature EIP-712
-   Upgradeable (Optional)

Chức năng của WhisprMinter

-

Các tác nhân:

-   User: người dùng
-   Gorernance:địa chỉ DAO
-   Minter: địa chỉ có quyền gọi hàm mint

## Giải pháp

### ERC-20

Xây dựng dựa trên contract ERC-20

```solidity
    mapping(address => uint256) internal _balances;
    mapping(address => mapping(address => uint256)) internal _allowances;

    string public name;
    string public symbol;
    uint8 public decimals;
    bool public totalSupplyVisible;
    uint256 internal _globalTotalSupply;
```

Sửa lại các giao dịch để cắt bỏ các event

### Uỷ quyền

Kế thừa từ Luminex, sử dụng contract `LuminexPrivacyPolicy` để hỗ trợ uỷ quyền trong trường hợp cần thiết

### Approve and Transfer use signature

Sử dụng chữ ký ECDSA để hỗ trở chuyển tiền, approve

### Approve and Transfer use EIP-712

Sử dụng chuẩn chữ kí EIP-712 để hỗ trợ chuyển tiền, approve. Tốt hơn các sử dụng chữ kí ECDSA thông thường về mặt giao diện người dùng
