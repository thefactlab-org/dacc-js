import { bytesToHex, hexToBytes } from "viem";
import { fromBase58WithPrefix, toBase58WithPrefix, DACC_PREFIX_V2 } from "./converts";
import { getSodium } from "./sodium";

/**
 * Password hashing mode for `encryptMode`.
 */
export type EncryptMode =
  /** Even faster than `low`. Weakest resistance to brute force. Use only when latency is absolutely critical. */
  | "down"
  /** Fastest [~30–40 ms]. Lowest cost, weakest resistance to brute force. Use only when latency is critical and password is strong. */
  | "low"
  /** Faster [~80–90 ms] than `medium`. Good balance when you need extra speed with reasonable security. */
  | "fast"
  /** Balanced [~400–500 ms] default. Recommended for most use cases. */
  | "medium"
  /** Slowest [~2–3 s]. Highest resistance to brute force, but highest cost. Use for long‑term storage / high‑value wallets. */
  | "high";

const MAGIC = new TextEncoder().encode("DACC");
const FORMAT_VERSION = 1;
const HEADER_LENGTH = MAGIC.length + 2;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

const MODE_TO_BYTE: Record<EncryptMode, number> = {
  down: 0,
  low: 1,
  fast: 2,
  medium: 3,
  high: 4,
};

const BYTE_TO_MODE: Record<number, EncryptMode> = {
  0: "down",
  1: "low",
  2: "fast",
  3: "medium",
  4: "high",
};

function getPwhashParams(sodium: Awaited<ReturnType<typeof getSodium>>, mode: EncryptMode) {
  switch (mode) {
    // ~15–20 ms
    case "down":
      return {
        opslimit: 1,
        memlimit: 8 * 1024 * 1024,
      };
    // ~30–40 ms
    case "low":
      return {
        opslimit: 2,
        memlimit: 16 * 1024 * 1024,
      };
    // ~80–90 ms
    case "fast":
      return {
        opslimit: sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
        memlimit: sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      };
      // ~2–3 s
    case "high":
      return {
        opslimit: sodium.crypto_pwhash_OPSLIMIT_SENSITIVE,
        memlimit: sodium.crypto_pwhash_MEMLIMIT_SENSITIVE,
      };
    // ~400–500 ms
    case "medium":
    default:
      return {
        opslimit: sodium.crypto_pwhash_OPSLIMIT_MODERATE,
        memlimit: sodium.crypto_pwhash_MEMLIMIT_MODERATE,
      };
  }
}

async function getInitializedSodium() {
  return getSodium();
}

export function normalizeEncryptMode(mode?: EncryptMode): EncryptMode {
  return mode ?? "medium";
}

export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  mode: EncryptMode
): Promise<Uint8Array> {
  const sodium = await getInitializedSodium();
  const { opslimit, memlimit } = getPwhashParams(sodium, mode);

  return sodium.crypto_pwhash(
    KEY_LENGTH,
    password,
    salt,
    opslimit,
    memlimit,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );
}

export async function encryptWithPassword(
  value: `0x${string}`,
  password: string,
  mode?: EncryptMode,
  prefix?: `0x${string}`
): Promise<string> {
  const selectedMode = normalizeEncryptMode(mode);
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const keyHash = await deriveKeyFromPassword(password, salt, selectedMode);

  const keyPass = await crypto.subtle.importKey(
    "raw",
    Uint8Array.from(keyHash),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    keyPass,
    Uint8Array.from(hexToBytes(value))
  );

  const header = new Uint8Array(HEADER_LENGTH);
  header.set(MAGIC, 0);
  header[MAGIC.length] = FORMAT_VERSION;
  header[MAGIC.length + 1] = MODE_TO_BYTE[selectedMode];

  const combined = new Uint8Array(header.length + salt.length + iv.length + encryptedBuffer.byteLength);
  combined.set(header, 0);
  combined.set(salt, header.length);
  combined.set(iv, header.length + salt.length);
  combined.set(new Uint8Array(encryptedBuffer), header.length + salt.length + iv.length);

  return toBase58WithPrefix(combined, prefix, DACC_PREFIX_V2);
}

export async function decryptWithPassword(
  encrypted: string,
  password: string
): Promise<{ value: `0x${string}`; mode: EncryptMode }> {
  const data = fromBase58WithPrefix(encrypted);

  let mode: EncryptMode = "medium";
  let saltStart = 0;

  const hasHeader =
    data.length >= HEADER_LENGTH + SALT_LENGTH + IV_LENGTH &&
    MAGIC.every((value, index) => data[index] === value) &&
    data[MAGIC.length] === FORMAT_VERSION;

  if (hasHeader) {
    const modeByte = data[MAGIC.length + 1] as keyof typeof BYTE_TO_MODE;
    mode = BYTE_TO_MODE[modeByte] ?? "medium";
    saltStart = HEADER_LENGTH;
  }

  const salt = data.slice(saltStart, saltStart + SALT_LENGTH);
  const iv = data.slice(saltStart + SALT_LENGTH, saltStart + SALT_LENGTH + IV_LENGTH);
  const encryptedValue = data.slice(saltStart + SALT_LENGTH + IV_LENGTH);

  const keyHash = await deriveKeyFromPassword(password, salt, mode);

  const keyPass = await crypto.subtle.importKey(
    "raw",
    Uint8Array.from(keyHash),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, keyPass, encryptedValue);
  const value = bytesToHex(new Uint8Array(decryptedBuffer)) as `0x${string}`;

  return {
    value: value.startsWith("0x") ? value : (`0x${value}` as `0x${string}`),
    mode,
  };
}
