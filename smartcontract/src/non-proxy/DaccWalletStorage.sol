// SPDX-License-Identifier: MIT
// Non-Proxy - Simple Smart Contract for Dacc Wallet Storage
pragma solidity ^0.8.30;

contract DaccWalletStorage {
    mapping(address => string) private daccPublickeyOf;
    mapping(string => address) private addressOf;
    mapping(address => bool) private isCreated;

    event CreatedDaccWallet(address walletAddress, string daccPublickey);

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
