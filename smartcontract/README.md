## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

#### Non-Proxy Version
```shell
# Deploy DaccWalletStorage (non-proxy)
$ forge create src/non-proxy/DaccWalletStorage.sol:DaccWalletStorage --rpc-url <your_rpc_url> --private-key <your_private_key>
```

#### Proxy Version (UUPS Upgradeable)
```shell
# 1. Deploy implementation contract
$ forge create src/DaccWalletStorage.sol:DaccWalletStorage --rpc-url <your_rpc_url> --private-key <your_private_key>

# 2. Deploy proxy contract
$ forge create src/ProxyDaccWalletStorage.sol:ProxyDaccWalletStorage --constructor-args <implementation_address> <initialize_calldata> --rpc-url <your_rpc_url> --private-key <your_private_key>

# 3. Initialize the proxy (if not done in constructor)
$ cast send <proxy_address> "initialize()" --rpc-url <your_rpc_url> --private-key <your_private_key>
```

**Note:** Replace `<implementation_address>` with the deployed implementation contract address from step 1.

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
