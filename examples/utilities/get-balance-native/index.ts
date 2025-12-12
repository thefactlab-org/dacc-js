import { getBalanceNative } from "dacc-js";
import { optimismSepolia } from "viem/chains";

const balance = await getBalanceNative({
  address: '0x123...',
  network: optimismSepolia
});

console.log(balance); // 
console.log(balance.balanceFormatted); // '1.0' ETH
