import { createWalletClient, http, type Account, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { allowDaccWallet } from "../allowDaccWallet";

export interface TypeDaccSignMessage {
  account?: Account | `0x${string}`;
  daccPublickey?: string;
  address?: `0x${string}`;
  passwordSecretkey?: string;
  network: Chain;
  message: string | { raw: `0x${string}` };
}

/**
 * Signs a message using a Dacc wallet or provided account.
 * @description Creates a wallet client and signs the specified message, returning the signature with metadata.
 *
 * - Docs: https://dacc-js.thefactlab.org/functions/dacc-signature/sign-message
 * 
 * @param account Conditional: The account to use for signing (Account object is private key).
 * @param daccPublickey Encrypted private key for wallet access.
 * @param address Wallet address for decryption (required if using encrypted key).
 * @param passwordSecretkey Password to decrypt the private key.
 * @param network The blockchain network configuration.
 * @param message The message to sign (string or hex format).
 * @returns (signature, chainId, from, message)
 * 
 * @example
 * import { daccSignMessage } from "dacc-js";
 * import type { TypeDaccSignMessage } from "dacc-js"; // for type
 * import { optimismSepolia } from "viem/chains"; // viem or viem.defineChain({custom...})
 * 
 * const result = await daccSignMessage({
    // account: "0xPrivatekey...", // Can call with `allowDaccWallet` function
    daccPublickey: 'daccPublickey_0x123_XxX...',
    // address: "0xYourAccountAddress..", // Only the address created is set to `publicEncryption: true`
    passwordSecretkey: 'my+Password#123..',
    network: optimismSepolia,
    message: 'Hello World'
  });
 * 
 * console.log(result); // {signature, chainId, from, message}
 * console.log(result?.signature); // 0xsignature...
 */
export async function daccSignMessage(options: TypeDaccSignMessage) {
  const { account: inputAccount, daccPublickey, address, passwordSecretkey, network, message } = options;

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

  const signature = await client.signMessage({ account, message });

  return {
    signature,
    chainId: network.id,
    from: account.address,
    message,
  };
}
