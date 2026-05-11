import { getBalanceToken } from "dacc-js";
import { optimismSepolia } from "viem/chains";

const balance = await getBalanceToken({
  address: '0x123...',
  tokenAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
  network: optimismSepolia
});

console.log(balance); //
console.log(balance.balanceFormatted); // '1.0' USDC
