import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { type Chain } from "viem";
import { Storage, customChainStorage } from "../../utils/storage";
import { DACC_WALLET_STORAGE_CONTRACT } from "../../contracts/contracts";
import { encryptWithPassword, type EncryptMode } from "../../utils/modeV2";

export interface TypeCreateDaccWallet_V2 {
  address: `0x${string}`;
  daccPublickey: string;
}

export type OptionDataStorageNetwork_V2 =
  | keyof typeof DACC_WALLET_STORAGE_CONTRACT
  | {
      customChain: {
        chain: Chain;
        contract: `0x${string}`;
      };
    };

export type OptionCreateDaccWallet_V2 =
  | {
      passwordSecretkey: string;
      publicEncryption?: false;
      minPassword?: number;
      maxPassword?: number;
      encryptMode?: EncryptMode;
      dataStorageNetwork?: never;
      pkWalletForSaveData?: never;
    }
  | {
      passwordSecretkey: string;
      publicEncryption: true;
      dataStorageNetwork: OptionDataStorageNetwork_V2;
      pkWalletForSaveData: `0x${string}`;
      minPassword?: number;
      maxPassword?: number;
      encryptMode?: EncryptMode;
    };

function isPublicEncryptionEnabled(
  options: OptionCreateDaccWallet_V2
): options is Extract<OptionCreateDaccWallet_V2, { publicEncryption: true }> {
  return options.publicEncryption === true;
}

/**
 * Creates a new Dacc wallet encrypted with a user-defined password.
 * @description Generates a wallet, encrypt it private key and returns the address with an encrypted key for secure storage.
 *
 * - Docs: https://dacc-js.thefactlab.org/functions/v2/createDaccWallet_V2
 *
 * @param passwordSecretkey User password for encrypting the private key.
 * @param publicEncryption Enable on-chain storage of the daccPublickey (default: false).
 * @param dataStorageNetwork The blockchain network to use for storing wallet data.
 * @param pkWalletForSaveData The private key used to send the transaction.
 * @param minPassword Minimum length required for the password (default: 12).
 * @param maxPassword Maximum length allowed for the password (default: 120).
 * @param encryptMode Optional: Encryption speed preset: `down`, `low`, `fast`, `medium`, or `high` (default: `medium`).
 * @returns ({ address, daccPublickey })
 *
 * @example
 * import { createDaccWallet_V2 } from "dacc-js";
 * import type { TypeCreateDaccWallet_V2 } from "dacc-js"; // for type
 *
 * const wallet = await createDaccWallet_V2({
    passwordSecretkey: 'my+Password#123..',
    encryptMode: 'fast', // optional (default: 'medium')
    // dataStorageNetwork: 'opSepolia',
    // pkWalletForSaveData: '0xprivatekeyGas..',
    // minPassword: 24
  });
 *
 * console.log(wallet); // { address, daccPublickey }
 * console.log(wallet?.address); // 0x123address... (recall)
 * console.log(wallet?.daccPublickey); // daccPublickey_XxX.. (keep)
 */
export async function createDaccWallet_V2(
  options: OptionCreateDaccWallet_V2
): Promise<TypeCreateDaccWallet_V2> {
  const {
    passwordSecretkey,
    minPassword = 12,
    maxPassword = 120,
    encryptMode = "medium",
  } = options;

  if (passwordSecretkey.length < minPassword)
    throw new Error(`Password must be at least ${minPassword} characters.`);
  if (passwordSecretkey.length > maxPassword)
    throw new Error(`Password must be no more than ${maxPassword} characters.`);

  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  const base64Encrypted = await encryptWithPassword(
    privateKey,
    passwordSecretkey,
    encryptMode,
    account.address
  );

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
