import { createWalletClient, http, type Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { DACC_WALLET_STORAGE_CONTRACT } from '../contracts/contracts';
import { DACC_WALLET_STORAGE_ABI } from '../abis/storage';
import * as NETWORKS from '../networks/networks';

export async function Storage(
  chainKey: keyof typeof DACC_WALLET_STORAGE_CONTRACT,
  pkWalletForTransaction: `0x${string}`,
  walletAddress: `0x${string}`,
  encryptedPublickey: string
) {
  const network = (NETWORKS as Record<string, Chain>)[chainKey];
  if (!network) {
    throw new Error(
      `Preset chain "${chainKey}" or customChain{ chain, contract }`
    );
  }

  const contract = DACC_WALLET_STORAGE_CONTRACT[chainKey];
  if (!contract) {
    throw new Error(
      `Unknown chain: ${String(chainKey)}, can use customChain{ chain, contract }`
    );
  }

  const account = privateKeyToAccount(pkWalletForTransaction);

  const client = createWalletClient({
    account,
    chain: network,
    transport: http(),
  });

  await client.writeContract({
    address: contract as `0x${string}`,
    abi: DACC_WALLET_STORAGE_ABI,
    functionName: 'createDaccWallet',
    args: [walletAddress, encryptedPublickey],
    chain: network,
  });
}

export async function customChainStorage(
  customChain: { chain: Chain; contract: `0x${string}` },
  pkWalletForTransaction: `0x${string}`,
  walletAddress: `0x${string}`,
  encryptedPublickey: string
) {
  const { chain, contract } = customChain;
  if (!chain) throw new Error('customChain{ chain } is required');
  if (!contract) throw new Error('customChain{ contract } is required');

  const account = privateKeyToAccount(pkWalletForTransaction);

  const client = createWalletClient({
    account,
    chain,
    transport: http(),
  });

  await client.writeContract({
    address: contract,
    abi: DACC_WALLET_STORAGE_ABI,
    functionName: 'createDaccWallet',
    args: [walletAddress, encryptedPublickey],
  });
}
