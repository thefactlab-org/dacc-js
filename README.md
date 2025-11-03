<p align="center">
  <br>
    Dacc-js | Decentralized Account Control (DAcc) on Blockchain networks.
  <br>
</p>

<div align="center" style="display: flex; justify-content: center; flex-wrap: wrap; gap: 10px;">
  <a href="https://github.com/thefactlab-org/dacc-js/stargazers">
    <img src="https://img.shields.io/github/stars/thefactlab-org/dacc-js?style=social" alt="Stars Badge" />
  </a>
  <a href="https://github.com/thefactlab-org/dacc-js/forks">
    <img src="https://img.shields.io/github/forks/thefactlab-org/dacc-js?style=social" alt="Forks Badge" />
  </a>
  <a href="https://github.com/thefactlab-org/dacc-js/pulls">
    <img src="https://img.shields.io/github/issues-pr/thefactlab-org/dacc-js?style=social" alt="Pull Requests Badge" />
  </a>
  <a href="https://github.com/thefactlab-org/dacc-js/issues">
    <img src="https://img.shields.io/github/issues/thefactlab-org/dacc-js?style=social" alt="Issues Badge" />
  </a>
  <a href="https://github.com/thefactlab-org/dacc-js/graphs/contributors">
    <img alt="GitHub contributors" src="https://img.shields.io/github/contributors/thefactlab-org/dacc-js?style=social" />
  </a>
</div>

<div align="center">
  <br>
  <b>dacc-js</b> is a library for implementing <a href="https://dacc-js.thefactlab.org/concept/design" target="_blank" style="text-decoration: none;">Decentralized Account Control (DAcc)</a> on blockchain networks. It enables users and developers to <a href="https://dacc-js.thefactlab.org/concept/mechanical" target="_blank" style="text-decoration: none;">create secure encrypted</a> <b>wallets</b> with <b>Web2 solution integration</b> that can be recovered using only a <b>password</b>, eliminating the need for complex seed phrases or private key management. The library operates in a completely <b>serverless architecture</b> without storing private keys on any servers or centralized systems, utilizing advanced encryption technology to ensure <b>full wallet ownership</b>, <b>exportability</b>, and <b>user privacy</b>.
</div>

### Why Dacc-js

- **User-Centric Design**: Dacc-js is built with the user in mind, enabling easy integration with Web2 solutions and simplifying wallet creation and recovery processes.
- **Flexibility and Control**: Users have complete control over their wallets, with the ability to recover them using just a password, making it a versatile solution for various use cases.
- **Enhanced Security**: By eliminating the need for seed phrases and central key storage, Dacc-js significantly reduces the attack surface for potential threats.
- **Free and Open Source**: Completely free to use with an open-source codebase, providing full transparency for developers.


### Use Cases

- **Decentralized Applications (dApps)**: Integrate Dacc-js into dApps to provide users with a seamless and secure wallet experience.
- **Web3 Onboarding**: Simplify the onboarding process for new users entering the Web3 space.
- **Password-Based Wallets**: Create wallets that can be easily recovered with a password, enhancing user convenience without compromising security.

## Features

- **Password-based Wallet Encryption & Recovery**: Create or recover your wallet using only a password - no need to store private keys directly.
- **Self-Ownership Management**: Private keys are not stored centrally, they are decentralized, decryptable and private with a password for recovery, ensuring complete self-ownership.
- **Serverless by Design**: Fully client/server-side operation, no backend, no API, no database costs, use blockchain for data memory and transparency.
- **Built-in Transaction Functions**: Pre-built comprehensive functions designed to perfectly address all use cases with extreme ease and convenience. Easy transaction handling and simple to use, reduce development time and focus on building your app efficiently.
- **Seamless Transaction Interaction**: Easy integration with many libraries, supports all EVM types and works seamlessly with [ethers](https://docs.ethers.org/v5/), [viem](https://viem.sh/) and other blockchain development tools with direct account connection.

## Installation

> Before installing `dacc-js`, it is recommended to first install [Node.js v22+](https://nodejs.org/en/download/prebuilt-installer/current) on your system to make sure it is installed correctly.

> To use CLI Commands, you'll need to install it globally `-g` is a [global](https://docs.npmjs.com/cli/v9/commands/npm-install#global-installation) package installation. <br>
> _After installing, you can call `dacc` from your terminal using the available commands_

```bash [npm]
npm i dacc-js
```

## Quick Start

### client/server side

Create a script file or function to create your Dacc wallet.

```ts [./index.ts]
import { createDaccWallet } from "dacc-js";

const wallet = await createDaccWallet({
  passwordSecretkey: "my+Password#123...",
});

console.log("wallet:", wallet); // {address, daccPublickey}
console.log("wallet address:", wallet?.address); // 0x123address... (recall = address)
console.log("wallet daccPublickey:", wallet?.daccPublickey); // daccPublickey_0x123_XxX... (keep = id)
```

### cli command

Create a Dacc wallet quickly with the command.

```bash
dacc create
```

## Donate

Support core development team and help to the project growth.

```bash [EVM Compatible]
0x6A74308F267c07556ED170025AE2D1753F747E20
```
