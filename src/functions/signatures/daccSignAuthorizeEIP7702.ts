import { createWalletClient, http, type Account, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { allowDaccWallet } from "../allowDaccWallet";

export interface TypeDaccSignAuthorizeEIP7702 {
  account?: Account | `0x${string}`;
  daccPublickey?: string;
  address?: `0x${string}`;
  passwordSecretkey?: string;
  network: Chain;
  contractAddress: `0x${string}`;
}

/**
 * Signs an EIP-7702 authorization for a Dacc wallet to delegate control to a smart contract.
 * @description Creates authorization signature allowing a contract to control the wallet account using EIP-7702 delegation.
 *
 * - Docs: https://dacc-js.thefactlab.org/functions/dacc-signature/sign-authorize-eip7702
 * 
 * @param account The account to sign with (Account object or private key hex string).
 * @param daccPublickey The encrypted private key (required if using encrypted wallet).
 * @param address The wallet address (required if using encrypted wallet).
 * @param passwordSecretkey The password to decrypt the private key (required if using encrypted wallet).
 * @param network The blockchain network to use for signing.
 * @param contractAddress The smart contract address to authorize for delegation.
 * @returns (authorization, chainId, from, contractAddress)
 * 
 * @example
 * import { daccSignAuthorizeEIP7702 } from "dacc-js";
 * import type { TypeDaccSignAuthorizeEIP7702 } from "dacc-js"; // for type
 * import { optimismSepolia } from "viem/chains"; // viem or viem.defineChain({custom...})
 * 
 * const result = await daccSignAuthorizeEIP7702({
    // account: "0xPrivatekey...", // Can call with `allowDaccWallet` function
    daccPublickey: 'daccPublickey_0x123_XxX...',
    // address: "0xYourAccountAddress..", // Only the address created is set to `publicEncryption: true`
    passwordSecretkey: 'my+Password#123..',
    network: optimismSepolia,
    contractAddress: '0xcontract...'
  });
 * 
 * console.log(result); // {authorization, chainId, from, contractAddress}
 * console.log(result?.authorization); // EIP-7702 authorization signature
 */
export async function daccSignAuthorizeEIP7702(options: TypeDaccSignAuthorizeEIP7702) {
  const { account: inputAccount, daccPublickey, address, passwordSecretkey, network, contractAddress } = options;

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

  const authorization = await client.signAuthorization({ account, contractAddress });

  return {
    authorization,
    chainId: network.id,
    from: account.address,
    contractAddress
  };
}
