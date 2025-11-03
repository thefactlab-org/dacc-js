import { allowDaccWallet } from "dacc-js";
 
const allow = await allowDaccWallet({
 daccPublickey: 'daccPublickey_XxX..', // created from createDaccWallet
 passwordSecretkey: 'myPassword@123...',
});
 
console.log("allow:", allow); // {address, privateKey}
console.log("allow address:", allow.address); // 0x123address... (recall)
console.log("allow privateKey:", allow.privateKey); // 0xprivatekey... (secret)