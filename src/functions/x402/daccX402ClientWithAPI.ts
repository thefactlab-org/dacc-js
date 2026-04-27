import { allowDaccWallet } from "../allowDaccWallet";
import { privateKeyToAccount, type LocalAccount } from "viem/accounts";
import type { Account } from "viem";
import { x402Client, wrapAxiosWithPayment, x402HTTPClient } from "@x402/axios";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import axios from "axios";

interface BaseType {
  sellerServerURL: string;
  endpointPath: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers: Record<string, string>;
  data?: any;
}

interface AccountMode extends BaseType {
  account: Account | `0x${string}`;
  daccPublickey?: never;
  passwordSecretkey?: never;
}

interface DaccMode extends BaseType {
  daccPublickey: string;
  passwordSecretkey: string;
  account?: never;
}

export type TypeDaccX402ClientWithAPI = AccountMode | DaccMode;

export interface ReturnDaccX402ClientWithAPI {
  data: any;
  payment: any;
  status: number;
}

/**
 * Makes HTTP requests with automatic x402 payment handling using Dacc wallet.
 * @description Integrates Dacc wallet with x402 protocol for seamless fast micropayment-protected API access.
 *
 * - Docs: https://dacc-js.thefactlab.org/functions/dacc-x402/client-x402-api
 * - x402 Protocol: https://x402.org
 *
 * @param account Conditional: The account to use for signing (Account object is private key).
 * @param daccPublickey The Dacc wallet public key for authentication.
 * @param passwordSecretkey Password to decrypt the Dacc wallet private key.
 * @param sellerServerURL Build seller x402 resource server base URL.
 * @param endpointPath API endpoint path to request.
 * @param method HTTP method for the request: "GET" | "POST" | "PUT" | "DELETE".
 * @param headers Additional HTTP headers.
 * @param data Optional body for requests.
 * @returns Promise<{ data, payment, status }>
 *
 * @example
 * import { daccX402ClientWithAPI } from "dacc-js";
 * import type { ReturnDaccX402ClientWithAPI } from "dacc-js";
 *
 * const response = await daccX402ClientWithAPI({
 *   // account: "0xPrivatekey...", // Can call with `allowDaccWallet` function
 *   daccPublickey: 'daccPublickey_XxX..',
 *   passwordSecretkey: 'my+Password#123..',
 *   sellerServerURL: 'http://localhost:4021', // Your seller server URL
 *   endpointPath: '/weather',
 *   method: 'GET', // POST | PUT | DELETE
 *   headers: { 'Content-Type': 'application/json' },
 *   // data: { key: 'value' } // Optionals body
 * });
 *
 * console.log(response); // API response data
 * console.log(response?.payment?.transaction); // 0xabc123transaction...
 */
export async function daccX402ClientWithAPI(
  options: TypeDaccX402ClientWithAPI
): Promise<ReturnDaccX402ClientWithAPI> {
  const {
    sellerServerURL,
    endpointPath,
    method,
    headers,
    data,
  } = options;

  if (!sellerServerURL) throw new Error("sellerServerURL is required");
  if (!endpointPath) throw new Error("endpointPath is required");
  if (!method) throw new Error("method is required");
  if (!headers) throw new Error("headers is required");

  let signer: LocalAccount;

  if ("account" in options && options.account) {
    if (typeof options.account === "string") {
      signer = privateKeyToAccount(options.account);
    } else if (options.account.type === "local") {
      signer = options.account;
    } else {
      throw new Error("Account must be LocalAccount or private key");
    }
  } else {
    const { privateKey } = await allowDaccWallet({
      daccPublickey: options.daccPublickey,
      passwordSecretkey: options.passwordSecretkey,
    });

    signer = privateKeyToAccount(privateKey);
  }

  const client = new x402Client();
  registerExactEvmScheme(client, { signer });

  const api = wrapAxiosWithPayment(
    axios.create({
      baseURL: sellerServerURL,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }),
    client
  );

  const response = await api.request({
    method,
    url: endpointPath,
    data,
  });

  const httpClient = new x402HTTPClient(client);
  const paymentResponse = httpClient.getPaymentSettleResponse(
    (name: string) => response.headers[name.toLowerCase()]
  );

  return {
    data: response.data,
    payment: paymentResponse,
    status: response.status,
  };
}
