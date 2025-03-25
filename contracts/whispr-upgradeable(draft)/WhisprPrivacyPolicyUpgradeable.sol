// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "./libraries/Bitmask.sol";

contract WhisprPrivacyPolicyUpgradeable {
    using Bitmask for uint256;

    enum PrivacyPolicy {
        Reveal
    }

    struct WhisprPrivacyPolicyStorage {
        mapping(address => mapping(address => uint256)) grantedAccess;
    }
    //  keccak256(abi.encode(uint256(keccak256("Whispr.storage.PrivacyPolicy")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant WhisprPrivacyPolicyStorageLocation =
        0xc97e90a89b8359dd142109ef1b694d6f9c94d31fef1a3ae3bbc6ac1980e94600;

    function _getWhisprPrivacyPolicyStorage()
        private
        pure
        returns (WhisprPrivacyPolicyStorage storage $)
    {
        assembly {
            $.slot := WhisprPrivacyPolicyStorageLocation
        }
    }

    function grant(address to, PrivacyPolicy accessType) public {
        uint256 accessIndex = uint256(accessType);
        WhisprPrivacyPolicyStorage storage $ = _getWhisprPrivacyPolicyStorage();
        require(
            !$.grantedAccess[msg.sender][to].get(accessIndex),
            "Access already granted"
        );
        $.grantedAccess[msg.sender][to] = $.grantedAccess[msg.sender][to].set(
            accessIndex
        );
    }

    function revoke(address from, PrivacyPolicy accessType) public {
        uint256 accessIndex = uint256(accessType);
        WhisprPrivacyPolicyStorage storage $ = _getWhisprPrivacyPolicyStorage();
        require(
            $.grantedAccess[msg.sender][from].get(accessIndex),
            "No access granted yet"
        );
        $.grantedAccess[msg.sender][from] = $
        .grantedAccess[msg.sender][from].unset(accessIndex);
    }

    function hasAccess(
        address owner,
        address accessor,
        PrivacyPolicy accessType
    ) internal view returns (bool) {
        WhisprPrivacyPolicyStorage storage $ = _getWhisprPrivacyPolicyStorage();
        return $.grantedAccess[owner][accessor].get(uint256(accessType));
    }
}
