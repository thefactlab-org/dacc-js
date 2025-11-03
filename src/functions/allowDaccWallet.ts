import { privateKeyToAccount } from "viem/accounts";
import { bytesToHex } from "viem";
import { readDaccWallet } from "./readDaccWallet";
import { fromBase58WithPrefix } from "../utils/converts";
import { getSodium } from "../utils/sodium";

export interface TypeAllowDaccWallet {
  address: `0x${string}`;
  privateKey: `0x${string}`;
}

export interface OptionAllowDaccWallet {
  address?: `0x${string}`;
  daccPublickey?: string;
  passwordSecretkey: string;
}

/**
 * Decrypt and recover Dacc wallet
 * @description Decrypts `daccPublickey` using `passwordSecretkey` and returns the wallet info.
 * 
 * - Docs: https://dacc-js.thefactlab.org/functions/allowDaccWallet
 * 
 * @param daccPublickey The encrypted string from {createDaccWallet}
 * @param address The encrypted wallet data returned address from {createDaccWallet}.
 * @param passwordSecretkey The password used for encryption
 * @returns ({ address, privateKey }) 
 *
 * @example
 * import { allowDaccWallet } from "dacc-js";
 * import type { TypeAllowDaccWallet } from "dacc-js"; // for type
 *
 * const allow = await allowDaccWallet({
 *   encryptedPublickey: "daccPublickey_0x123_XxX...",
 *   passwordSecretkey: "my+Password#123..."
 * });
 *
 * console.log(allow); // { address, privateKey }
 * console.log(allow.address, allow.privateKey); // 0x1234abcd... , 0xprivatekey...
 */
export async function allowDaccWallet(
  options: OptionAllowDaccWallet
): Promise<TypeAllowDaccWallet> {
  let { address, daccPublickey, passwordSecretkey } = options;

  if (!daccPublickey) {
    if (!address) throw new Error("You must provide either `account` or `daccPublickey`.");

    const result = await readDaccWallet({
      address,
      dataStorageNetwork: "all",
      result: "daccPublickey",
    });

    daccPublickey = (result as any).daccPublickey;
    if (!daccPublickey)
      throw new Error(`No daccPublickey found for address ${address}`);
  }

  try {
    const data = fromBase58WithPrefix(daccPublickey);

    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encrypted = data.slice(28);

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
      ["decrypt"]
    );

    const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, keyPass, encrypted);
    const privateKey = bytesToHex(new Uint8Array(decryptedBuffer)) as `0x${string}`;
    const account = privateKeyToAccount(privateKey);

    return {
      address: account.address,
      privateKey,
    };
  } catch (err) {
    console.error("Decryption `passwordSecretkey` failed or invalid password.");
    throw new Error("Decryption failed");
  }
}
