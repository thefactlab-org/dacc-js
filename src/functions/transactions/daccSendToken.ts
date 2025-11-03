import { createWalletClient, http, parseUnits, type Account, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { allowDaccWallet } from "../allowDaccWallet";
import { ERC20_ABI } from "../../abis/erc20";

export interface TypeDaccSendToken {
  account?: Account | `0x${string}`;
  address?: `0x${string}`;
  daccPublickey?: string;
  passwordSecretkey?: string;
  tokenAddress: `0x${string}`;
  to: `0x${string}`;
  amount: number;
  network: Chain;
  decimals?: number;
}

/**
 * Sends ERC20 tokens from a Dacc wallet to a recipient address.
 * @description Transfer tokens using either a provided account or by decrypting a Dacc wallet with password.
 *
 * - Docs: https://dacc-js.thefactlab.org/functions/dacc-transactions/send-token
 * 
 * @param account Conditional: The account to use for signing (Account object is private key).
 * @param address The wallet address (required if using encrypted wallet).
 * @param daccPublickey The encrypted private key (required if using encrypted wallet).
 * @param passwordSecretkey The password to decrypt the private key (required if using encrypted wallet).
 * @param tokenAddress The ERC20 token contract address.
 * @param to The recipient wallet address.
 * @param amount The amount of tokens to send.
 * @param network The blockchain network to use for the transaction.
 * @param decimals The token decimals (default: 18).
 * @returns (txHash, chainId, from, to, tokenAddress, amount, decimals)
 * 
 * @example
 * import { daccSendToken } from "dacc-js";
 * import type { TypeDaccSendToken } from "dacc-js"; // for type
 * import { optimismSepolia } from "viem/chains"; // viem or viem.defineChain({custom...})
 * 
 * const tx = await daccSendToken({
    // account: "0xPrivatekey...", // Can call with `allowDaccWallet` function
    daccPublickey: 'daccPublickey_0x123_XxX...',
    // address: "0xYourAccountAddress..", // Only the address created is set to `publicEncryption: true`
    passwordSecretkey: 'my+Password#123..',
    network: optimismSepolia,
    tokenAddress: '0xTokenContract...',
    to: '0xRecipient...',
    amount: 100,
    // decimals: 18
  });
 * 
 * console.log(tx); // {txHash, chainId, from, to, tokenAddress, amount, decimals}
 * console.log(tx?.txHash); // 0xTransactionHash...
 */
export async function daccSendToken(options: TypeDaccSendToken) {
  const {
    account: inputAccount,
    address,
    daccPublickey,
    passwordSecretkey,
    tokenAddress,
    to,
    amount,
    network,
    decimals = 18,
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
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "transfer",
    account,
    args: [to, parseUnits(amount.toString(), decimals)],
  });

  return {
    txHash: hash,
    chainId: network.id,
    from: account.address,
    to,
    tokenAddress,
    amount,
    decimals,
  };
}
