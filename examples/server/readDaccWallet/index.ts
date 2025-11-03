import { readDaccWallet } from "dacc-js";


// The Dacc wallet must be created with publicEncryption: true to store data on the blockchain.
const info = await readDaccWallet({
  address: "0x1234abcd...",
//   dataStorageNetwork: "opSepolia",
//   result: "daccPublickey"
});

console.log("info:", info); // { dataStorageNetwork: "opSepolia", daccPublickey: "daccPublickey_0x1234abcd..._xyz" }