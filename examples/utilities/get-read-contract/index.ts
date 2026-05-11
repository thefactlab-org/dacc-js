import { getReadContract } from "dacc-js";
import { parseAbi } from "viem";
import { optimismSepolia } from "viem/chains";

const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
]);

const result = await getReadContract({
  network: optimismSepolia,
  contractAddress: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
  abi: erc20Abi,
  functionName: "balanceOf",
  args: ["0x4F0165AA31eD79386d970716d663E1F3392b7050"],
});

console.log(result);
console.log(result.data);
