import { createPublicClient, http, type Abi, type BlockTag, type Chain } from "viem";

export interface TypeGetReadContract {
  network: Chain;
  contractAddress: `0x${string}`;
  abi: Abi;
  functionName: string;
  args?: any[];
  blockNumber?: bigint;
  blockTag?: BlockTag;
}

/**
 * Reads data from a smart contract using a public client.
 * @description Calls a read-only contract function and returns the decoded response.
 *
 * - Docs: https://dacc-js.thefactlab.org/functions/utilities/get-read-contract
 *
 * @param network The blockchain network to query.
 * @param contractAddress The smart contract address to interact with.
 * @param abi The contract ABI for function calls.
 * @param functionName The contract function to call.
 * @param args Optional array of function arguments.
 * @param blockNumber Optional block number to execute the read against.
 * @param blockTag Optional block tag to execute the read against.
 * @returns ({ chainId, contractAddress, functionName, args, data })
 *
 * @example
 * import { getReadContract } from "dacc-js";
 * import { optimismSepolia } from "viem/chains";
 *
 * const result = await getReadContract({
 *   network: optimismSepolia,
 *   contractAddress: "0xcontract...",
 *   abi: contractAbiJSON, // ABI array for the contract OR use parseAbi from viem to parse a subset of the ABI
 *   functionName: "balanceOf",
 *   args: ["0xrecipient..."],
 * });
 *
 * console.log(result);
 * console.log(result?.data);
 */
export async function getReadContract(options: TypeGetReadContract) {
  const {
    network,
    contractAddress,
    abi,
    functionName,
    args = [],
    blockNumber,
    blockTag,
  } = options;

  const client = createPublicClient({
    chain: network,
    transport: http(),
  });

  const data = await client.readContract({
    address: contractAddress,
    abi,
    functionName,
    args,
    blockNumber,
    blockTag,
  });

  return {
    chainId: network.id,
    contractAddress,
    functionName,
    args,
    data,
  };
}
