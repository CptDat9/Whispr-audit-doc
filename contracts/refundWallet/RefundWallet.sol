// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RefundWallet is Initializable {
    string public constant VERSION = "0.0.1";
    address public entrypoint;
    address internal owner;
    uint256 public depositId;

    function initialize(
        address _entrypoint,
        address _owner,
        uint256 _depositId
    ) public initializer {
        entrypoint = _entrypoint;
        owner = _owner;
        depositId = _depositId;
    }

    modifier onlyEntrypoint() {
        require(
            msg.sender == entrypoint,
            "Wallet: caller is not an entrypoint"
        );
        _;
    }

    function withdraw(
        address token,
        address receiver,
        uint256 amount
    ) external onlyEntrypoint {
        IERC20(token).transfer(receiver, amount);
    }

}
