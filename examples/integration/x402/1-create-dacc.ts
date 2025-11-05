import { createDaccWallet } from "dacc-js";

/** 
 * This example shows how to create a Dacc Wallet using dacc-js package.
 * 
 * - Docs dacc-js: https://dacc-js.thefactlab.org/concept/technical#integration-examples
 * 
 * To run this example, you need to install dacc-js package:
 * - bun add dacc-js
 * 
 * Use cases:
 * - Solutions web2 to web3 wallet management e.g ai, auth log-in.
 *
*/
const wallet = await createDaccWallet({
 passwordSecretkey: "PASSWORD_SECRETKEY", // password to encrypt the private key
//  publicEncryption: true, // Docs: https://dacc-js.thefactlab.org/functions/readDaccWallet
//  dataStorageNetwork: 'opSepolia',
//  pkWalletForSaveData: 'ENV.0XPRIVATEKEY_GAS..',
//  minPassword: 24
});
 
console.log("wallet:", wallet); // {address, daccPublickey}
console.log("wallet address:", wallet?.address); // 0x123address... (recall)
console.log("wallet daccPublickey:", wallet?.daccPublickey); // daccPublickey_XxX... (keep)

// Note
// Fund this address with USDC for payments
console.log("⚠️  Fund", wallet.address, "with USDC for payments");
