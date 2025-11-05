# test-x402

To install dependencies:

```bash
bun install
```

To settings
```bash
edit in file .env
```

To run:

1. Run server for Seller
```bash
bun run 0-seller-hono.ts
```

2. Create Dacc for Management wallet
```bash
bun run 1-create-dacc.ts
```
> The daccPublickey to address should also contain USDC. Please check and send USDC.

1. Send payments for Buyer to 2.
```bash
bun run 2-buyer-axios.ts
```
> The daccPublickey to address should also contain USDC. Please check and send USDC.

This project was created using `bun init` in bun v1.3.0. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
