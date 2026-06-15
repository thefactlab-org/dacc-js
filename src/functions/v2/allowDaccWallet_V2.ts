import { privateKeyToAccount } from "viem/accounts";
import { readDaccWallet } from "../readDaccWallet";
import { decryptWithPassword } from "../../utils/modeV2";

export interface TypeAllowDaccWallet_V2 {
  address: `0x${string}`;
  privateKey: `0x${string}`;
}

export interface OptionAllowDaccWallet_V2 {
  address?: `0x${string}`;
  daccPublickey?: string;
  passwordSecretkey: string;
}

/**
 * Decrypt and recover Dacc wallet
 * @description Decrypts `daccPublickey` using `passwordSecretkey` and returns the wallet info.
 *
 * - Docs: https://dacc-js.thefactlab.org/functions/v2/allowDaccWallet_V2
 *
 * @param daccPublickey The encrypted string from {createDaccWallet}
 * @param address The encrypted wallet data returned address from {createDaccWallet}.
 * @param passwordSecretkey The password used for encryption
 * @returns ({ address, privateKey })
 *
 * @example
 * import { allowDaccWallet_V2 } from "dacc-js";
 * import type { TypeAllowDaccWallet_V2 } from "dacc-js"; // for type
 *
 * const allow = await allowDaccWallet_V2({
 *   daccPublickey: "daccPublickey_0x123_XxX...",
 *   passwordSecretkey: "my+Password#123..."
 * });
 *
 * console.log(allow); // { address, privateKey }
 * console.log(allow.address, allow.privateKey); // 0x1234abcd... , 0xprivatekey...
 */
export async function allowDaccWallet_V2(
  options: OptionAllowDaccWallet_V2
): Promise<TypeAllowDaccWallet_V2> {
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
    const { value: privateKey } = await decryptWithPassword(daccPublickey, passwordSecretkey);
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
