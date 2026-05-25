# dacc-js

## 0.0.9

### Patch Changes

- Update: v0.0.9 - New: Add contracts parameter for pre-configured read/write contract calls

  - Fix `daccSendToken`
    - Bug converting number to string with decimals before parsing

## 0.0.8

### Patch Changes

- Add getMulticalBalance and getReadContract utility functions

  - getMulticalBalance: query multiple ERC20 token balances in a single multicall
  - getReadContract: read data from any smart contract function

  The main theme here is adding two new utility functions: `getMulticalBalance` and `getReadContract`, along with their documentation and examples.

## 0.0.7

### Patch Changes

- Update: v0.0.7 - New: x402 Protocol integration.
  - 1. daccSendUSDC - Send USDC via gasless transferWithAuthorization.
  - 2. daccX402ClientWithAPI - x402 client for API payments.

## 0.0.6

### Patch Changes

- Update: v0.0.6 - New: Add daccAiAgent for AI-powered wallet interactions.

## 0.0.5

### Patch Changes

- Update: v0.0.5 - Utilities Explore the utility functions that Dacc-js provides for common blockchain tasks, such as balance checking and more. 1.getBalanceNative 2.getBalanceToken

## 0.0.4

### Patch Changes

- **dacc-js** An innovative way to create a web3 wallet that encrypts your secret key and remembers it by setting your own password. It is stored as a daccPublickey instead, adding 2-step security and making it easier to remember and maintaining privacy. / fix: Adjust the encryption latency that may cause problems in cach.

## 0.0.3

### Patch Changes

- **dacc-js** An innovative way to create a web3 wallet that encrypts your secret key and remembers it by setting your own password. It is stored as a daccPublickey instead, adding 2-step security and making it easier to remember and maintaining privacy. / fix: again README

## 0.0.2

### Patch Changes

- **dacc-js** An innovative way to create a web3 wallet that encrypts your secret key and remembers it by setting your own password. It is stored as a daccPublickey instead, adding 2-step security and making it easier to remember and maintaining privacy. / fix: export file pack size to npm

## 0.0.1

### Patch Changes

- **dacc-js** An innovative way to create a web3 wallet that encrypts your secret key and remembers it by setting your own password. It is stored as a daccPublickey instead, adding 2-step security and making it easier to remember and maintaining privacy.
