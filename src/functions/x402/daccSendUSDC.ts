import { createWalletClient, http, parseUnits, parseAbi, keccak256, numberToBytes, type Account, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { allowDaccWallet } from "../allowDaccWallet";

export interface USDCContract {
  address: `0x${string}`;
  name: string;
  version: string;
  decimals?: number;
}

export interface TypeDaccSendUSDC {
  account?: Account | `0x${string}`;
  address?: `0x${string}`;
  daccPublickey?: string;
  passwordSecretkey?: string;
  usdcAddress: USDCContract;
  to: `0x${string}`;
  amount: number;
  network: Chain;
  validAfter?: number;
  validBefore?: number;
  gasless: {
    account: `0x${string}`;
  };
}

/**
 * Sends USDC tokens using transferWithAuthorization (gasless transfer).
 * @description Transfer USDC with a signed EIP-712 authorization. A separate relayer account submits the transaction and pays for gas.
 *
 * - Docs: https://dacc-js.thefactlab.org/functions/dacc-x402/send-usdc
 *
 * @param account Conditional: The account to use for signing (Account object or private key).
 * @param address Wallet address to use if account is not provided.
 * @param daccPublickey Encrypted public key for wallet decryption.
 * @param passwordSecretkey Password to decrypt the wallet private key.
 * @param usdcAddress USDC contract information (address, name, version, decimals).
 * @param to Recipient address to send USDC to.
 * @param amount Amount of USDC to send (human-readable, e.g. 100 = 100 USDC).
 * @param network Blockchain network to execute the transaction on.
 * @param validAfter The time after which this is valid (unix time, default: 0).
 * @param validBefore The time before which this is valid (unix time, default: 24h from now).
 * @param gasless Object containing the relayer account (private key) that pays for gas.
 * @returns (txHash, chainId, from, to, usdcAddress, amount, signature)
 *
 * @example
 * import { daccSendUSDC } from "dacc-js";
 * import type { TypeDaccSendUSDC } from "dacc-js";
 * import { baseSepolia } from "viem/chains";
 *
 * const tx = await daccSendUSDC({
 *   daccPublickey: 'daccPublickey_0x123_XxX..',
 *   passwordSecretkey: 'my+Password#123..',
 *   network: baseSepolia,
 *   usdcAddress: {
 *     address: '0xUSDCContract...',
 *     name: 'USDC',
 *     version: '2'
 *   },
 *   to: '0xRecipient...',
 *   amount: 10,
 *   gasless: {
 *     account: 'env_0xRelayerPrivateKey...',
 *   },
 * });
 *
 * console.log(tx); // {txHash, chainId, from, to, usdcAddress, amount, signature}
 * console.log(tx?.txHash); // 0xabc123transaction...
 */
export async function daccSendUSDC(options: TypeDaccSendUSDC) {
  const {
    account: inputAccount,
    address,
    daccPublickey,
    passwordSecretkey,
    usdcAddress,
    to,
    amount,
    network,
    validAfter: inputValidAfter,
    validBefore: inputValidBefore,
    gasless,
  } = options;

  const signerAccount =
    typeof inputAccount === "string"
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

  const validAfter = BigInt(inputValidAfter ?? 0);
  const validBefore = BigInt(
    inputValidBefore ?? Math.floor(Date.now() / 1000) + 3600
  );

  const nonce = keccak256(
    numberToBytes(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER), {
      size: 32,
    })
  );

  const value = parseUnits(amount.toString(), usdcAddress.decimals ?? 6);

  const domain = {
    name: usdcAddress.name,
    version: usdcAddress.version,
    chainId: network.id,
    verifyingContract: usdcAddress.address,
  } as const;

  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  } as const;

  const message = {
    from: signerAccount.address,
    to,
    value,
    validAfter,
    validBefore,
    nonce,
  };

  const signerClient = createWalletClient({
    account: signerAccount,
    chain: network,
    transport: http(),
  });

  const signature = await signerClient.signTypedData({
    account: signerAccount,
    domain,
    types,
    primaryType: "TransferWithAuthorization",
    message,
  });

  const relayerAccount = privateKeyToAccount(gasless.account);
  const relayerClient = createWalletClient({
    account: relayerAccount,
    chain: network,
    transport: http(),
  });

  const transferWithAuthorizationAbi = parseAbi([
    "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, bytes signature) external",
]);

  const hash = await relayerClient.writeContract({
    address: usdcAddress.address,
    abi: transferWithAuthorizationAbi,
    functionName: "transferWithAuthorization",
    args: [
      signerAccount.address,
      to,
      value,
      validAfter,
      validBefore,
      nonce,
      signature,
    ],
  });

  return {
    txHash: hash,
    chainId: network.id,
    from: signerAccount.address,
    to,
    usdcAddress: usdcAddress.address,
    amount,
    signature,
  };
}