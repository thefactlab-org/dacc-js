import { createPublicClient, erc20Abi, formatUnits, http, type Address, type Chain } from "viem";

export interface TypeGetMulticalBalance {
  address: `0x${string}`;
  tokenAddress: readonly `0x${string}`[];
  network: Chain;
  multicalAddress?: Address;
}

export interface ReturnGetMulticalBalanceItem {
  address: `0x${string}`;
  tokenAddress: `0x${string}`;
  chainId: number;
  balance: string;
  balanceFormatted: string;
  decimals: number;
  symbol?: string;
  name?: string;
}

export type ReturnGetMulticalBalance = ReturnGetMulticalBalanceItem[];

type MulticallSuccessResult<T> = {
  status: "success";
  result: T;
};

type MulticallFailureResult = {
  status: "failure";
  error: unknown;
};

type MulticallResult<T> = MulticallSuccessResult<T> | MulticallFailureResult;

function getSuccessfulResult<T>(
  result: MulticallResult<T> | undefined,
  tokenAddress: `0x${string}`,
  functionName: string,
): T {
  if (!result || result.status !== "success") {
    throw new Error(`Failed to read ${functionName} for token ${tokenAddress}`);
  }

  return result.result;
}

/**
 * Get ERC20 token balances for multiple token contracts in a single multicall.
 * @description Retrieves balances and token metadata for many ERC20 tokens of one wallet address.
 *
 * - Docs: https://dacc-js.thefactlab.org/functions/utilities/get-multical-balance
 *
 * @param address The wallet address to check balances for.
 * @param tokenAddress The ERC20 token contract addresses.
 * @param network Blockchain network to query.
 * @param multicalAddress Optional Multicall contract address for chains that need a custom deployment.
 * @returns Array of token balance objects including balance, decimals, symbol, and name.
 *
 * @example
 * import { getMulticalBalance } from "dacc-js";
 * import type { TypeGetMulticalBalance } from "dacc-js";
 * import { optimismSepolia } from "viem/chains";
 *
 * const balances = await getMulticalBalance({
 *   address: "0x123...",
 *   tokenAddress: [
 *     "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
 *     "0x4200000000000000000000000000000000000006",
 *   ],
 *   network: optimismSepolia,
 *   // multicalAddress: "0xMulticalAddress...", // optional, only needed for chains that do not expose a multicall address in the chain config
 * });
 *
 * console.log(balances);
 * console.log(balances.map((balance) => `${balance.symbol}: ${balance.balanceFormatted}`));
 * // [
 * //   {
 * //     address: "0x123...",
 * //     tokenAddress: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
 * //     chainId: 11155420,
 * //     balance: "1000000",
 * //     balanceFormatted: "1",
 * //     decimals: 6,
 * //     symbol: "USDC",
 * //     name: "USDC"
 * //   },
 * //   {
 * //     address: "0x123...",
 * //     tokenAddress: "0x4200000000000000000000000000000000000006",
 * //     chainId: 11155420,
 * //     balance: "10000000000000000",
 * //     balanceFormatted: "0.01",
 * //     decimals: 18,
 * //     symbol: "WETH",
 * //     name: "Wrapped Ether"
 * //   }
 * // ]
 * // ["USDC: 1", "WETH: 0.01"]
 */
export async function getMulticalBalance(
  options: TypeGetMulticalBalance,
): Promise<ReturnGetMulticalBalance> {
  const { address, tokenAddress, network, multicalAddress } = options;

  if (tokenAddress.length === 0) {
    return [];
  }

  const publicClient = createPublicClient({
    chain: network,
    transport: http(),
  });

  const contracts = tokenAddress.flatMap((tokenAddress) => [
    {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [address] as const,
    },
    {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "decimals" as const,
    },
    {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "symbol" as const,
    },
    {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "name" as const,
    },
  ]);

  const multicallResults = await publicClient.multicall({
    contracts,
    allowFailure: true,
    multicallAddress: multicalAddress,
  });

  return tokenAddress.map((tokenAddress, index) => {
    const offset = index * 4;

    const balance = getSuccessfulResult(
      multicallResults[offset] as MulticallResult<bigint> | undefined,
      tokenAddress,
      "balanceOf",
    );
    const decimals = getSuccessfulResult(
      multicallResults[offset + 1] as MulticallResult<number> | undefined,
      tokenAddress,
      "decimals",
    );
    const symbolResult = multicallResults[offset + 2] as MulticallResult<string> | undefined;
    const nameResult = multicallResults[offset + 3] as MulticallResult<string> | undefined;

    return {
      address,
      tokenAddress,
      chainId: network.id,
      balance: balance.toString(),
      balanceFormatted: formatUnits(balance, decimals),
      decimals,
      symbol: symbolResult?.status === "success" ? symbolResult.result : undefined,
      name: nameResult?.status === "success" ? nameResult.result : undefined,
    };
  });
}
