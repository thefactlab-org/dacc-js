import { createWalletClient, http, parseEther, type Chain, type Account } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { allowDaccWallet } from "../allowDaccWallet";

export interface TypeDaccSendNative {
  account?: Account | `0x${string}`;
  address?: `0x${string}`;
  daccPublickey?: string;
  passwordSecretkey?: string;
  to: `0x${string}`;
  amount: number;
  network: Chain;
}

/**
 * Sends native cryptocurrency to a specified address using a Dacc wallet.
 * @description Creates a wallet client and sends a native token transaction to the specified recipient address.
 *
 * - Docs: https://dacc-js.thefactlab.org/functions/dacc-transactions/send-native
 * 
 * @param account Conditional: The account to use for signing (Account object is private key).
 * @param address Wallet address to use if account is not provided.
 * @param daccPublickey Encrypted public key for wallet decryption.
 * @param passwordSecretkey Password to decrypt the wallet private key.
 * @param to Recipient address to send native tokens to.
 * @param amount Amount of native tokens to send (in ether units).
 * @param network Blockchain network to execute the transaction on.
 * @returns (txHash, chainId, from, to, amount)
 * 
 * @example
 * import { daccSendNative } from "dacc-js";
 * import type { TypeDaccSendNative } from "dacc-js"; // for type
 * import { optimismSepolia } from "viem/chains"; // viem or viem.defineChain({custom...})
 * 
 * const tx = await daccSendNative({
    // account: "0xPrivatekey...", // Can call with `allowDaccWallet` function
    daccPublickey: 'daccPublickey_0x123_XxX...',
    // address: "0xYourAccountAddress..", // Only the address created is set to `publicEncryption: true`
    passwordSecretkey: 'my+Password#123..',
    network: optimismSepolia,
    to: '0x456recipient...',
    amount: 0.1
  });
 * 
 * console.log(tx); // {txHash, chainId, from, to, amount}
 * console.log(tx?.txHash); // 0xabc123transaction...
 */
export async function daccSendNative(options: TypeDaccSendNative) {
  const {
    account: inputAccount,
    address,
    daccPublickey,
    passwordSecretkey,
    to,
    amount,
    network
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

  const amountInWei = parseEther(amount.toFixed(18));
  const hash = await client.sendTransaction({ to, value: amountInWei });

  return {
    txHash: hash,
    chainId: network.id,
    from: account.address,
    to,
    amount: amountInWei,
  };
}
