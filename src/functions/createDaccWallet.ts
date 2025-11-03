import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { hexToBytes, type Chain } from "viem";
import { Storage, customChainStorage } from "../utils/storage";
import { DACC_WALLET_STORAGE_CONTRACT } from "../contracts/contracts";
import { toBase58WithPrefix } from "../utils/converts";
import { getSodium } from "../utils/sodium";

export interface TypeCreateDaccWallet {
  address: `0x${string}`;
  daccPublickey: string;
}

export type OptionDataStorageNetwork =
  | keyof typeof DACC_WALLET_STORAGE_CONTRACT
  | {
      customChain: {
        chain: Chain;
        contract: `0x${string}`;
      };
    };

export type OptionCreateDaccWallet =
  | {
      passwordSecretkey: string;
      publicEncryption?: false;
      minPassword?: number;
      maxPassword?: number;
      dataStorageNetwork?: never;
      pkWalletForSaveData?: never;
    }
  | {
      passwordSecretkey: string;
      publicEncryption: true;
      dataStorageNetwork: OptionDataStorageNetwork;
      pkWalletForSaveData: `0x${string}`;
      minPassword?: number;
      maxPassword?: number;
    };

function isPublicEncryptionEnabled(
  options: OptionCreateDaccWallet
): options is Extract<OptionCreateDaccWallet, { publicEncryption: true }> {
  return options.publicEncryption === true;
}

/**
 * Creates a new Dacc wallet encrypted with a user-defined password.
 * @description Generates a wallet, encrypt it private key and returns the address with an encrypted key for secure storage.
 * 
 * - Docs: https://dacc-js.thefactlab.org/functions/createDaccWallet
 *
 * @param passwordSecretkey User password for encrypting the private key.
 * @param publicEncryption Enable on-chain storage of the daccPublickey (default: false).
 * @param dataStorageNetwork The blockchain network to use for storing wallet data.
 * @param pkWalletForSaveData The private key used to send the transaction.
 * @param minPassword Minimum length required for the password (default: 12).
 * @param maxPassword Maximum length allowed for the password (default: 120).
 * @returns ({ address, daccPublickey })
 * 
 * @example
 * import { createDaccWallet } from "dacc-js";
 * import type { TypeCreateDaccWallet } from "dacc-js"; // for type
 * 
 * const wallet = await createDaccWallet({
    passwordSecretkey: 'my+Password#123..',
    // dataStorageNetwork: 'opSepolia',
    // pkWalletForSaveData: '0xprivatekeyGas..',
    // minPassword: 24
  });
 * 
 * console.log(wallet); // { address, daccPublickey }
 * console.log(wallet?.address); // 0x123address... (recall)
 * console.log(wallet?.daccPublickey); // daccPublickey_XxX.. (keep)
 */
export async function createDaccWallet(
  options: OptionCreateDaccWallet
): Promise<TypeCreateDaccWallet> {
  const {
    passwordSecretkey,
    minPassword = 12,
    maxPassword = 120,
  } = options;

  if (passwordSecretkey.length < minPassword)
    throw new Error(`Password must be at least ${minPassword} characters.`);
  if (passwordSecretkey.length > maxPassword)
    throw new Error(`Password must be no more than ${maxPassword} characters.`);

  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const sodium = await getSodium();
  const keyHash = sodium.crypto_pwhash(
    32,
    passwordSecretkey,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_MODERATE,
    sodium.crypto_pwhash_MEMLIMIT_MODERATE,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );

  const keyPass = await crypto.subtle.importKey(
    "raw",
    keyHash,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    keyPass,
    hexToBytes(privateKey)
  );

  const combined = new Uint8Array(
    salt.byteLength + iv.byteLength + encryptedBuffer.byteLength
  );
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(new Uint8Array(encryptedBuffer), salt.byteLength + iv.byteLength);

  const base64Encrypted = toBase58WithPrefix(combined, account.address);

  if (isPublicEncryptionEnabled(options)) {
    const { dataStorageNetwork, pkWalletForSaveData } = options;

    if (typeof dataStorageNetwork === "string") {
      await Storage(dataStorageNetwork, pkWalletForSaveData, account.address, base64Encrypted);
    } else if ("customChain" in dataStorageNetwork) {
      await customChainStorage(
        dataStorageNetwork.customChain,
        pkWalletForSaveData,
        account.address,
        base64Encrypted
      );
    } else {
      throw new Error("Invalid dataStorageNetwork format");
    }
  }

  return {
    address: account.address,
    daccPublickey: base64Encrypted,
  };
}
