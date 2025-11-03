import { createWalletClient, http, type Account, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { allowDaccWallet } from "../allowDaccWallet";

export interface TypeDaccSignTypedData {
  account?: Account | `0x${string}`;
  daccPublickey?: string;
  address?: `0x${string}`;
  passwordSecretkey?: string;
  network: Chain;
  domain?: Record<string, any>;
  types?: Record<string, any>;
  primaryType?: string;
  message?: Record<string, any>;
}

/**
 * Signs typed data using a Dacc wallet or provided account.
 * @description Creates a wallet client and signs EIP-712 typed data, returning the signature with metadata.
 *
 * - Docs: https://dacc-js.thefactlab.org/functions/dacc-signature/sign-typed-data
 * 
 * @param account Conditional: The account to use for signing (Account object is private key).
 * @param daccPublickey The encrypted public key for Dacc wallet.
 * @param address The wallet address for Dacc wallet retrieval.
 * @param passwordSecretkey The password to decrypt the Dacc wallet.
 * @param network The blockchain network configuration.
 * @param domain The EIP-712 domain object.
 * @param types The EIP-712 types definition.
 * @param primaryType The primary type for the message.
 * @param message The message data to sign.
 * @returns (signature, chainId, from, domain, types, message)
 * 
 * @example
 * import { daccSignTypedData } from "dacc-js";
 * import type { TypeDaccSignTypedData } from "dacc-js"; // for type
 * import { optimismSepolia } from "viem/chains"; // viem or viem.defineChain({custom...})
 * 
 * const signedData = await daccSignTypedData({
    // account: "0xPrivatekey...", // Can call with `allowDaccWallet` function
    daccPublickey: 'daccPublickey_0x123_XxX...',
    // address: "0xYourAccountAddress..", // Only the address created is set to `publicEncryption: true`
    passwordSecretkey: 'my+Password#123..',
    network: optimismSepolia,
    domain: { name: 'MyApp', version: '1' },
    types: { Message: [{ name: 'content', type: 'string' }] },
    primaryType: 'Message',
    message: { content: 'Hello World' }
  });
 * 
 * console.log(signedData); // {signature, chainId, from, domain, types, message}
 * console.log(signedData?.signature); // 0x1234abcd... (signature)
 */
export async function daccSignTypedData(options: TypeDaccSignTypedData) {
  const {
    account: inputAccount,
    daccPublickey,
    address,
    passwordSecretkey,
    network,
    domain,
    types,
    primaryType,
    message,
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

  const signature = await client.signTypedData({
    account,
    domain: domain!,
    types: types!,
    primaryType: primaryType!,
    message: message!,
  });

  return {
    signature,
    chainId: network.id,
    from: account.address,
    domain,
    types,
    message,
  };
}
