import { createDaccWallet } from "dacc-js";

const wallet = await createDaccWallet({
 passwordSecretkey: 'myPassword123..',
//  publicEncryption: true,
//  dataStorageNetwork: 'opSepolia',
//  pkWalletForTransaction: 'ENV.0XPRIVATEKEY_GAS..',
//  minPassword: 24
});
 
console.log("wallet:", wallet); // {address, encryptPublickey}
console.log("wallet address:", wallet.address); // 0x123address... (recall)
console.log("wallet encryptPublickey:", wallet.daccPublickey); // daccPublickey_XxX... (keep)