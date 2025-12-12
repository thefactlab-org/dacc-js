import { createPublicClient, http, type Chain, formatUnits, erc20Abi } from "viem";

export interface TypeGetBalanceToken {
  address: `0x${string}`;
  tokenAddress: `0x${string}`;
  network: Chain;
}

export interface ReturnGetBalanceToken {
  address: `0x${string}`;
  tokenAddress: `0x${string}`;
  chainId: number;
  balance: string;
  balanceFormatted: string;
  decimals: number;
  symbol?: string;
  name?: string;
}

/**
 * Get ERC20 token balance for a specified address on a blockchain network.
 * @description Retrieves the ERC20 token balance for a given address, including token details like decimals and symbol.
 *
 * - Docs: https://dacc-js.thefactlab.org/functions/utilities/get-balance-token
 * 
 * @param address The wallet address to check balance for.
 * @param tokenAddress The ERC20 token contract address.
 * @param network Blockchain network to query.
 * @returns Object containing address, tokenAddress, chainId, balance (in smallest unit), balanceFormatted (in token units), decimals, symbol, and name.
 * 
 * @example
 * import { getBalanceToken } from "dacc-js";
 * import type { TypeGetBalanceERC20 } from "dacc-js";
 * import { optimismSepolia } from "viem/chains";
 * 
 * const balance = await getBalanceToken({
 *   address: '0x123...',
 *   tokenAddress: '0xUSDC...',
 *   network: optimismSepolia
 * });
 * 
 * console.log(balance);
 * // {
 * //   address: '0x123...',
 * //   tokenAddress: '0xUSDC...',
 * //   chainId: 11155420,
 * //   balance: '1000000',
 * //   balanceFormatted: '1.0',
 * //   decimals: 6,
 * //   symbol: 'USDC',
 * //   name: 'USD Coin'
 * // }
 */
export async function getBalanceToken(
  options: TypeGetBalanceToken
): Promise<ReturnGetBalanceToken> {
  const { address, tokenAddress, network } = options;

  const publicClient = createPublicClient({
    chain: network,
    transport: http(),
  });

  const [balance, decimals, symbol, name] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "decimals",
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "symbol",
    }).catch(() => undefined),
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "name",
    }).catch(() => undefined),
  ]);

  const balanceFormatted = formatUnits(balance as bigint, decimals as number);

  return {
    address,
    tokenAddress,
    chainId: network.id,
    balance: (balance as bigint).toString(),
    balanceFormatted,
    decimals: decimals as number,
    symbol: symbol as string | undefined,
    name: name as string | undefined,
  };
}
