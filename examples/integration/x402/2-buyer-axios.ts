import axios from "axios";
import { config } from "dotenv";
import { withPaymentInterceptor, decodeXPaymentResponse, createSigner } from "x402-axios";
import { allowDaccWallet, createDaccWallet } from "dacc-js";

config();

const baseURL = process.env.RESOURCE_SERVER_URL || 'http://localhost:4021' as string; // e.g. https://example.com
const endpointPath = process.env.ENDPOINT_PATH || '/weather' as string; // e.g. /weather

const daccPublickey = process.env.DACC_PUBLICKEY || ''; // Dacc Wallet public key from created wallet
const passwordSecretkey = process.env.PASSWORD_SECRETKEY || ''; // password to decrypt the private key

if (!baseURL || !endpointPath || !daccPublickey || !passwordSecretkey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

/**
 * This example shows how to use dacc-js and x402-axios package to make a request to a resource server that requires a payment.
 *
 * - Docs dacc-js: https://dacc-js.thefactlab.org/concept/technical#integration-examples
 * 
 * To run this example, you need to set the following environment variables:
 * - signer = await createSigner: Used to dacc-js to create or allow Dacc Wallet
 *  - DACC_PUBLICKEY: The Dacc Wallet public key
 *  - PASSWORD_SECRETKEY: The password to decrypt the private key
 * - RESOURCE_SERVER_URL: The URL of the resource server
 * - ENDPOINT_PATH: The path of the endpoint to call on the resource server
 *
 */
async function main(): Promise<void> {

  // 1. Create Dacc Wallet
  // const wallet = await createDaccWallet({
  //   passwordSecretkey: 'my+Password#123..', // password to encrypt the private key
  //   // publicEncryption: true, // Docs: https://dacc-js.thefactlab.org/functions/readDaccWallet
  //   // dataStorageNetwork: 'opSepolia',
  //   // pkWalletForSaveData: 'ENV.0XPRIVATEKEY_GAS..',
  //   // minPassword: 24
  // });
  // console.log("Dacc Public Key:", wallet.daccPublickey);

  // 2. Allow Dacc Wallet to get Private Key
  // The daccPublickey to address should also contain USDC. Please check and send USDC.
  const { privateKey } = await allowDaccWallet({
    daccPublickey: daccPublickey, // Dacc Wallet public key from created wallet
    passwordSecretkey: passwordSecretkey, // password to decrypt the private key
  });

  const signer = await createSigner("base-sepolia", privateKey);

  const api = withPaymentInterceptor(
    axios.create({
      baseURL,
    }),
    signer,
  );

  const response = await api.get(endpointPath);
  console.log(response.data);

  const paymentResponse = decodeXPaymentResponse(response.headers["x-payment-response"]);
  console.log(paymentResponse);
}

main();