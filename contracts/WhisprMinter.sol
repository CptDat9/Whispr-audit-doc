// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IWhisprERC20.sol";

contract WhisprMinter is  AccessControlUpgradeable, PausableUpgradeable {
    address public whisprUSD;
    address public thornUSD;

    function initialize(
        address _whisprUSD,
        address _thornUSD
    ) external initializer {
        __AccessControl_init();  //fix
        __Pausable_init();  // fix
        whisprUSD = _whisprUSD;
        thornUSD = _thornUSD;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mintWhisprUSD(
        uint256 amount,
        address receiver
    ) public whenNotPaused returns (uint256 amountOut) {
        IERC20(thornUSD).transferFrom(msg.sender, address(this), amount);
        IWhisprERC20(whisprUSD).mint(receiver, amount);
        return amount;
    }

        function burnWhisprUSD(
        uint256 amount,
        address receiver
    ) public whenNotPaused {
        IWhisprERC20(whisprUSD).transferFrom(msg.sender, address(this), amount);
        IWhisprERC20(whisprUSD).burn(amount);
        IERC20(thornUSD).transfer(receiver, amount);
    }

    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
