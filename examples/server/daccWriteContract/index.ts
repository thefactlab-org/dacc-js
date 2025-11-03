import { daccWriteContract } from "dacc-js";

import { sepolia } from "viem/chains"; // used `viem` - npm i viem
 
const tx = await daccWriteContract({
//   account: "0xPrivatekey...",
  daccPublickey: 'daccPublickey_XxX..',
  address: '0x123...',
  passwordSecretkey: 'myPassword#123..',
  network: sepolia,
  contractAddress: '0xcontract...',
  abi: contractAbi, // import or define your contract ABI
  functionName: 'transfer',
  args: ['0xrecipient...', 1000000000000000000n]
  // value: 0.1 // Optional: ETH Native value to send
});
 
console.log(tx); // {txHash, chainId, from, contractAddress, functionName, args}
console.log(tx?.txHash); // 0xtransactionhash...