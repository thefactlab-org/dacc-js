import { daccSignMessage } from "dacc-js";
import { optimismSepolia } from "viem/chains"; // used `viem` - npm i viem
 
const result = await daccSignMessage({
//   account: "0xPrivatekey...",
  daccPublickey: 'daccPublickey_XxX..',
  address: '0x123...',
  passwordSecretkey: 'myPassword123..',
  network: optimismSepolia,
  message: 'Hello World'
});
 
console.log(result); // {signature, chainId, from, message}
console.log(result?.signature); // 0xsignature...