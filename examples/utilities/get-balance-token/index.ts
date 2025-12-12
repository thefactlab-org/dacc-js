import { getBalanceToken } from "dacc-js";
import { optimismSepolia } from "viem/chains";

const balance = await getBalanceToken({
  address: '0x123...',
  tokenAddress: '0x975bD3D1d5B8bac5769ADc6Ae856649d60fC7b49',
  network: optimismSepolia
});

console.log(balance); //
console.log(balance.balanceFormatted); // '1.0' USDC
