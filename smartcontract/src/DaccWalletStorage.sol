// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract DaccWalletStorage is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    mapping(address => string) private daccPublickeyOf;
    mapping(string => address) private addressOf;
    mapping(address => bool) private isCreated;

    event CreatedDaccWallet(address walletAddress, string daccPublickey);

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function upgrade(address newImplementation) public onlyOwner {
        upgradeToAndCall(newImplementation, "");
    }

    function createDaccWallet(address walletAddress, string memory daccPublickey) external {
        require(!isCreated[walletAddress], "Already create");
        require(addressOf[daccPublickey] == address(0), "daccPublickey already used");

        daccPublickeyOf[walletAddress] = daccPublickey;
        addressOf[daccPublickey] = walletAddress;
        isCreated[walletAddress] = true;
        emit CreatedDaccWallet(walletAddress, daccPublickey);
    }

    function getPublickeyByAddress(address walletAddress) external view returns (string memory) {
        return daccPublickeyOf[walletAddress];
    }

    function getAddressByPublickey(string memory daccPublickey) external view returns (address) {
        return addressOf[daccPublickey];
    }
}
