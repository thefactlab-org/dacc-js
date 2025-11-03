import { createWalletClient, http, parseEther, type Account, type Chain, type Abi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { allowDaccWallet } from "../allowDaccWallet";

export interface TypeDaccWriteContract {
  account?: Account | `0x${string}`;
  address?: `0x${string}`;
  daccPublickey?: string;
  passwordSecretkey?: string;
  network: Chain;
  contractAddress: `0x${string}`;
  abi: Abi;
  functionName: string;
  args?: any[];
  value?: number;
}

/**
 * Executes a write transaction on a smart contract using a Dacc wallet.
 * @description Creates a wallet client and sends a contract write transaction with the specified parameters.
 *
 * - Docs: https://dacc-js.thefactlab.org/functions/dacc-transactions/write-contract
 * 
 * @param account Conditional: The account to use for signing (Account object is private key).
 * @param address Wallet address for Dacc wallet authentication.
 * @param daccPublickey Encrypted public key for Dacc wallet decryption.
 * @param passwordSecretkey Password for decrypting the Dacc wallet.
 * @param network The blockchain network to execute the transaction on.
 * @param contractAddress The smart contract address to interact with.
 * @param abi The contract ABI for function calls.
 * @param functionName The contract function to execute.
 * @param args Optional array of function arguments.
 * @param value Optional ETH value to send with the transaction (in ETH units).
 * @returns ({ txHash, chainId, from, contractAddress, functionName, args })
 * 
 * @example
 * import { daccWriteContract } from "dacc-js";
 * import type { TypeDaccWriteContract } from "dacc-js"; // for type
 * import { sepolia } from "viem/chains"; // viem or viem.defineChain({custom...})
 * 
 * const tx = await daccWriteContract({
    // account: "0xPrivatekey...", // Can call with `allowDaccWallet` function
    daccPublickey: 'daccPublickey_0x123_XxX...',
    // address: "0xYourAccountAddress..", // Only the address created is set to `publicEncryption: true`
    passwordSecretkey: 'my+Password#123..',
    network: sepolia,
    contractAddress: '0xcontract...',
    abi: contractAbi, // import or define the ABI
    functionName: 'transfer',
    args: ['0xrecipient...', 1000000000000000000n]
  });
 * 
 * console.log(tx); // {txHash, chainId, from, contractAddress, functionName, args}
 * console.log(tx?.txHash); // 0xtransactionhash...
 */
export async function daccWriteContract(options: TypeDaccWriteContract) {
  const {
    account: inputAccount,
    address,
    daccPublickey,
    passwordSecretkey,
    network,
    contractAddress,
    abi,
    functionName,
    args = [],
    value,
  } = options;

  const account = typeof inputAccount === "string"
      ? privateKeyToAccount(inputAccount)
      : inputAccount ??
        privateKeyToAccount(
          (
            await allowDaccWallet({
              address,
              daccPublickey,
              passwordSecretkey: passwordSecretkey!,
            })
          ).privateKey
        );

  const client = createWalletClient({ account, chain: network, transport: http() });

  const hash = await client.writeContract({
    account,
    address: contractAddress,
    abi,
    functionName,
    args,
    value: value ? parseEther(value.toString()) : undefined,
  });

  return {
    txHash: hash,
    chainId: network.id,
    from: account.address,
    contractAddress,
    functionName,
    args
  };
}
