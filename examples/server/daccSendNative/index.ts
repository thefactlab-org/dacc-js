import { daccSendNative } from "dacc-js";
import { optimismSepolia } from "viem/op-stack";
 
const tx = await daccSendNative({
//   account: "0xPrivatekey...",
  daccPublickey: 'daccPublickey_XxX..',
//   address: "0xYourAccountAddress..",
  passwordSecretkey: "my!Password#123..",
  network: optimismSepolia,
  to: "0xRecipientAddress..",
  amount: 0.001,
});
 
console.log("tx:", tx);