import { createPublicClient, http, type Chain } from "viem";
import { DACC_WALLET_STORAGE_CONTRACT } from "../contracts/contracts";
import { DACC_WALLET_STORAGE_ABI } from "../abis/storage";
import * as NETWORKS from "../networks/networks";

export type TypeRequireAddressOrEncrypted =
  | { address: `0x${string}`; daccPublickey?: never }
  | { address?: never; daccPublickey: string }
  | { address: `0x${string}`; daccPublickey: string };

export type OptionReadDaccWalletNetwork =
  | keyof typeof DACC_WALLET_STORAGE_CONTRACT
  | { customChain: { chain: Chain; contract: `0x${string}` } };

export type OptionReadDaccWallet = TypeRequireAddressOrEncrypted & {
  dataStorageNetwork?: OptionReadDaccWalletNetwork | "all";
  result?: "address" | "daccPublickey" | "all";
};

/**
 * Reads a Dacc wallet from the blockchain using an address or daccPublickey.
 * @description Queries one or multiple Dacc to retrieve wallet information.
 *
 * - Docs: https://dacc-js.thefactlab.org/functions/readDaccWallet
 * 
 * @param address ?.Wallet address to find daccPublickey.
 * @param daccPublickey ?.daccPublickey to find address.
 * @param dataStorageNetwork Network to query or "all" for all networks. Defaults to "all".
 * @param result Specify which data to return: "address", "daccPublickey", or "all".
 * @returns ({result})
 * 
 * @example
 * import { readDaccWallet } from "dacc-js";
 * 
 * const info = await readDaccWallet({ 
 *   address: "0x1234abcd...",
 * // daccPublickey: 'daccPublickey_0x123_XxX...',
 * // dataStorageNetwork: "opSepolia",
 * // result: 'daccPublickey'
 * });
 * 
 * console.log(info); // { result }
 */
export async function readDaccWallet(options: OptionReadDaccWallet) {
  const { dataStorageNetwork = "all", result } = options;
  const address = (options as any).address as `0x${string}` | undefined;
  const daccPublickey = (options as any).daccPublickey as string | undefined;

  let resolvedResult: "address" | "daccPublickey" | "all" = "all";
  if (!result) {
    if (address && !daccPublickey) resolvedResult = "daccPublickey";
    else if (daccPublickey && !address) resolvedResult = "address";
  } else resolvedResult = result;

  const isAll = dataStorageNetwork === "all";
  const networks: OptionReadDaccWalletNetwork[] = isAll
    ? [...(Object.keys(DACC_WALLET_STORAGE_CONTRACT) as (keyof typeof DACC_WALLET_STORAGE_CONTRACT)[])]
    : [dataStorageNetwork as OptionReadDaccWalletNetwork];

  let found: { dataStorageNetwork: string; address?: `0x${string}`; daccPublickey?: string } | null = null;
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  for (const net of networks) {
    let network: Chain;
    let contractAddress: `0x${string}`;
    let client;

    if (typeof net === "string") {
      contractAddress = DACC_WALLET_STORAGE_CONTRACT[net] as `0x${string}`;
      if (!contractAddress) continue;
      network = (NETWORKS as Record<string, Chain>)[net] as Chain;
      if (!network) continue;
      client = createPublicClient({ chain: network, transport: http() });
    } else if ("customChain" in net) {
      contractAddress = net.customChain.contract;
      network = net.customChain.chain;
      client = createPublicClient({ chain: network, transport: http() });
    } else continue;

    try {
      let resolvedAddress: `0x${string}` | undefined;
      let resolvedEncrypted: string | undefined;

      if (address) {
        const data = await client.readContract({
          address: contractAddress,
          abi: DACC_WALLET_STORAGE_ABI,
          functionName: "getPublickeyByAddress",
          args: [address],
        });
        if (!data) continue;
        resolvedAddress = address;
        resolvedEncrypted = data as string;
      }

      if (daccPublickey) {
        const data = await client.readContract({
          address: contractAddress,
          abi: DACC_WALLET_STORAGE_ABI,
          functionName: "getAddressByPublickey",
          args: [daccPublickey],
        });
        if (!data || data === ZERO_ADDRESS) continue;
        resolvedAddress = data as `0x${string}`;
        resolvedEncrypted = daccPublickey;
      }

      if (resolvedAddress || resolvedEncrypted) {
        found = {
          dataStorageNetwork: typeof net === "string" ? net : "customChain",
          address: resolvedAddress,
          daccPublickey: resolvedEncrypted,
        };
        break;
      }
    } catch {
      continue;
    }
  }

  if (!found) {
    throw new Error(
      `No Dacc wallet found for the provided 'dataStorageNetwork' from ${address ? "address" : "daccPublickey"}`
    );
  }

  const includeNetwork = isAll;
  switch (resolvedResult) {
    case "address":
      return includeNetwork
        ? { dataStorageNetwork: found.dataStorageNetwork, address: found.address! }
        : { address: found.address! };
    case "daccPublickey":
      return includeNetwork
        ? { dataStorageNetwork: found.dataStorageNetwork, daccPublickey: found.daccPublickey! }
        : { daccPublickey: found.daccPublickey! };
    case "all":
    default:
      return includeNetwork
        ? found
        : { address: found.address, daccPublickey: found.daccPublickey };
  }
}
