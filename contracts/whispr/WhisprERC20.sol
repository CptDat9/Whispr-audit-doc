// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./WhisprECDSA.sol";
import "./WhisprEIP712.sol";
import "./WhisprPrivacyPolicy.sol";

contract WhisprERC20 is
    IERC20,
    AccessControl,
    WhisprECDSA,
    WhisprEIP712,
    WhisprPrivacyPolicy
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    mapping(address => uint256) internal _balances;
    mapping(address => mapping(address => uint256)) internal _allowances;

    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public _globalTotalSupply;

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

    function mint(
        address to,
        uint256 amount
    ) external virtual onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(uint256 amount) external virtual {
        _burn(msg.sender, amount);
    }

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

    function totalSupply() public view virtual override returns (uint256) {
        return _globalTotalSupply;
    }

    function balanceOf(
        address account
    ) public view virtual override returns (uint256) {
        if (!_isAllowedByPrivacyPolicy(account)) {
            return 0;
        }

        return _balances[account];
    }

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

    function _mint(address to, uint256 amount) internal {
        _balances[to] += amount;
        _globalTotalSupply += amount;
    }

    function _burn(address from, uint256 amount) internal {
        _balances[from] -= amount;
        _globalTotalSupply -= amount;
    }

    function getNonce(address account) public view returns (uint256) {
        if (!_isAllowedByPrivacyPolicy(account)) {
            return 0;
        }
        return _getNonce(account);
    }

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
}
