import { createPublicClient, http, type Chain, formatEther } from "viem";

export interface TypeGetBalanceNative {
  address: `0x${string}`;
  network: Chain;
}

export interface ReturnGetBalanceNative {
  address: `0x${string}`;
  chainId: number;
  balance: string;
  balanceFormatted: string;
}

/**
 * Get native token balance for a specified address on a blockchain network.
 * @description Retrieves the native cryptocurrency balance (e.g., ETH, MATIC) for a given address.
 *
 * - Docs: https://dacc-js.thefactlab.org/functions/utilities/get-balance-native
 * 
 * @param address The wallet address to check balance for.
 * @param network Blockchain network to query.
 * @returns Object containing address, chainId, balance (in wei), and balanceFormatted (in ether).
 * 
 * @example
 * import { getBalanceNative } from "dacc-js";
 * import type { TypeGetBalanceNative } from "dacc-js";
 * import { optimismSepolia } from "viem/chains";
 * 
 * const balance = await getBalanceNative({
 *   address: '0x123...',
 *   network: optimismSepolia
 * });
 * 
 * console.log(balance);
 * // {
 * //   address: '0x123...',
 * //   chainId: 11155420,
 * //   balance: '1000000000000000000',
 * //   balanceFormatted: '1.0'
 * // }
 */
export async function getBalanceNative(
  options: TypeGetBalanceNative
): Promise<ReturnGetBalanceNative> {
  const { address, network } = options;

  const publicClient = createPublicClient({
    chain: network,
    transport: http(),
  });

  const balance = await publicClient.getBalance({
    address: address,
  });

  const balanceFormatted = formatEther(balance);

  return {
    address,
    chainId: network.id,
    balance: balance.toString(),
    balanceFormatted,
  };
}
