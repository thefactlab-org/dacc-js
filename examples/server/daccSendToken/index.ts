import { daccSendToken } from "dacc-js";
import { optimismSepolia } from "viem/chains"; // used `viem` - npm i viem
 
const result = await daccSendToken({
//   account: "0xPrivatekey...",
  daccPublickey: 'daccPublickey_XxX..',
  address: '0x123address...',
  passwordSecretkey: 'myPassword123..',
  network: optimismSepolia,
  tokenAddress: '0xTokenContract...',
  to: '0xRecipient...',
  amount: 100
  // decimals: 6
});
 
console.log(result); // {txHash, chainId, from, to, tokenAddress, amount, decimals}
console.log(result?.txHash); // 0xTransactionHash...