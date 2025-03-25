// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Wallet is Initializable {
    address public admin;

    modifier onlyAdmin() {
        require(msg.sender == admin, "only admin");
        _;
    }

    function initialize(address _admin) public initializer {
        admin = _admin;
    }

    function execute_ncC(
        address dest,
        uint256 value,
        bytes calldata func
    ) public onlyAdmin {
        _call(dest, value, func);
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        assembly {
            let success := call(
                gas(),
                target,
                value,
                add(data, 0x20),
                mload(data),
                0,
                0
            )
            let ptr := mload(0x40)
            returndatacopy(ptr, 0, returndatasize())
            if iszero(success) {
                revert(ptr, returndatasize())
            }
        }
    }
}
