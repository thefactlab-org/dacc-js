import { daccSignAuthorizeEIP7702 } from "dacc-js";
import { optimismSepolia } from "viem/chains"; // used `viem` - npm i viem
 
const result = await daccSignAuthorizeEIP7702({
//   account: "0xPrivatekey...",
  daccPublickey: 'daccPublickey_XxX..',
  address: '0x123...',
  passwordSecretkey: 'myPassword#123..',
  network: optimismSepolia,
  contractAddress: '0xcontract...'
});
 
console.log(result); // {authorization, chainId, from, contractAddress}
console.log(result?.authorization); // EIP-7702 authorization signature