import { getMulticalBalance } from "dacc-js";
import { optimismSepolia } from "viem/chains";

const balances = await getMulticalBalance({
  address: "0x123...",
  tokenAddress: [
    "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    "0x4200000000000000000000000000000000000006",
  ],
  network: optimismSepolia,
  // multicalAddress: "0xca11bde05977b3631167028862be2a173976ca11",
});

console.log(balances);
console.log(
  balances.map((balance) => `${balance.symbol}: ${balance.balanceFormatted}`)
);
