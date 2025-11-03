import { daccSignTypedData } from "dacc-js";
import { optimismSepolia } from "viem/chains"; // used `viem` - npm i viem

const domain = {
  name: "Ether Mail",
  version: "1",
  chainId: 1,
  verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
};

const types = {
  Person: [
    { name: "name", type: "string" },
    { name: "wallet", type: "address" },
  ],
  Mail: [
    { name: "from", type: "Person" },
    { name: "to", type: "Person" },
    { name: "contents", type: "string" },
  ],
};

const message = {
  from: {
    name: "Cow",
    wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
  },
  to: {
    name: "Bob",
    wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
  },
  contents: "Hello, Bob!",
};

const signedTyped = await daccSignTypedData({
  // account: "0xPrivatekey...",
  // address: "0x123...",
  daccPublickey: "daccPublickey_XxX..",
  passwordSecretkey: "myPassword123..",
  network: optimismSepolia,
  domain,
  types,
  primaryType: "Mail",
  message,
});

console.log("Typed data signed:", signedTyped.signature);