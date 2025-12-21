import axios from "axios";
import { x402Client, wrapAxiosWithPayment, x402HTTPClient } from "@x402/axios";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import { allowDaccWallet } from "dacc-js";

// Dacc-js setup
const daccPublickey = process.env.DACC_PUBLICKEY || ''; // Dacc Wallet public key from created wallet
const passwordSecretkey = process.env.PASSWORD_SECRETKEY || ''; // password to decrypt the private key
const { privateKey} = await allowDaccWallet({
  daccPublickey: daccPublickey, // Dacc Wallet public key from created wallet
  passwordSecretkey: passwordSecretkey, // password to decrypt the private key
});

// Create signer
const signer = privateKeyToAccount(privateKey as `0x${string}`);
const endpointPath = process.env.ENDPOINT_PATH || '/weather' as string; 

// Create x402 client and register EVM scheme
const client = new x402Client();
registerExactEvmScheme(client, { signer });

// Create an Axios instance with payment handling
const api = wrapAxiosWithPayment(
  axios.create({ baseURL: process.env.RESOURCE_SERVER_URL || "http://localhost:4021" }),
  client,
);

// Make request - payment is handled automatically
const response = await api.get(endpointPath);
console.log("Response:", response.data);

// Get payment receipt
const httpClient = new x402HTTPClient(client);
const paymentResponse = httpClient.getPaymentSettleResponse(
  (name) => response.headers[name.toLowerCase()]
);
console.log("Payment settled:", paymentResponse);