import { privateKeyToAccount } from "viem/accounts";
import { bytesToHex, hexToBytes } from "viem";
import { fromBase58WithPrefix, toBase58WithPrefix } from "../utils/converts";
import { getSodium } from "../utils/sodium";

export interface TypeDaccWalletJWT {
  address: `0x${string}`;
  privateKey: `0x${string}`;
}

export interface OptionAllowDaccWalletJWT {
  daccPublickey: string;
  passwordSecretkey: string;
  jwtSecret: string;
  maxAgeSeconds?: number;
}

export interface OptionVerifyDaccJWT {
  jwt: string;
  jwtSecret: string;
}

function base64UrlEncode(data: Uint8Array | string): string {
  let binary: string;
  if (typeof data === "string") binary = data;
  else binary = String.fromCharCode(...data);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4 === 0 ? 0 : 4 - (str.length % 4);
  str += "=".repeat(pad);
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const subtle = globalThis.crypto?.subtle;
if (!subtle) throw new Error("WebCrypto API is not available");

const sodium = await getSodium();

export async function encryptHash(
  pk: string,
  password: string
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const hash = sodium.crypto_pwhash(
    32,
    password,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_MODERATE,
    sodium.crypto_pwhash_MEMLIMIT_MODERATE,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );

  const key = await subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const encrypted = await subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    hexToBytes(pk as `0x${string}`)
  );

  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return toBase58WithPrefix(combined);
}

export async function decryptHash(
  encrypted: string,
  password: string
): Promise<`0x${string}`> {
  const data = fromBase58WithPrefix(encrypted);
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const encryptedPk = data.slice(28);

  const hash = sodium.crypto_pwhash(
    32,
    password,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_MODERATE,
    sodium.crypto_pwhash_MEMLIMIT_MODERATE,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );

  const key = await subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decrypted = await subtle.decrypt({ name: "AES-GCM", iv }, key, encryptedPk);
  const privateKey = bytesToHex(new Uint8Array(decrypted)) as `0x${string}`;

  return privateKey.startsWith("0x") ? privateKey : (`0x${privateKey}` as `0x${string}`);
}

async function signHMAC(payload: string, secret: string): Promise<string> {
  const key = await subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64UrlEncode(new Uint8Array(sig));
}

async function verifyHMAC(payload: string, secret: string, signature: string): Promise<boolean> {
  const key = await subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  return subtle.verify("HMAC", key, base64UrlDecode(signature), new TextEncoder().encode(payload));
}

/**
 * Creates a JWT token containing encrypted wallet information for session management.
 * @description Decrypts wallet with user password, re-encrypts with JWT secret, and creates a signed token with expiration.
 * 
 * - Docs: https://dacc-js.thefactlab.org/functions/session-wallet/create-time-jwt
 * 
 * @param encryptedPublickey The encrypted wallet data, returned from `createDaccWallet`.
 * @param passwordSecretkey User password for decrypting the wallet. Must match the password used with `createDaccWallet`.
 * @param jwtSecret Secret key for JWT signing and encryption. Keep secure and consistent across your application.
 * @param maxAgeSeconds Token expiration time in seconds. Default: 3600 (1 hour).
 * @returns JWT token string containing encrypted wallet data.
 * 
 * @example
 * import { allowSessionTimeWalletWithJWT } from "dacc-js";
 * 
 * const jwt = await allowSessionTimeWalletWithJWT({
 *   encryptedPublickey: 'daccPublickey_0x123_XxX..',
 *   passwordSecretkey: 'my+Password#123..',
 *   jwtSecret: 'jwt-secret-to-app',
 *   // maxAgeSeconds: 3600 // default (1 hour)
 * });
 * 
 * console.log(jwt); // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
export async function allowSessionTimeWalletWithJWT(options: OptionAllowDaccWalletJWT): Promise<string> {
  const { daccPublickey, passwordSecretkey, jwtSecret, maxAgeSeconds = 3600 } = options;

  try {
    const privateKey = await decryptHash(daccPublickey, passwordSecretkey);
    const { address } = privateKeyToAccount(privateKey);
    const encryptedPk = await encryptHash(privateKey, jwtSecret);

    const header = { alg: "HS256", typ: "JWT" };
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + maxAgeSeconds;
    const payload = { address, encryptedPk, iat, exp };

    const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
    const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
    const signature = await signHMAC(`${headerB64}.${payloadB64}`, jwtSecret);

    return `${headerB64}.${payloadB64}.${signature}`;
  } catch {
    throw new Error("failed: Invalid `passwordSecretkey`, `daccPublickey` unable to wallet.");
  }
}

/**
 * Verifies and extracts wallet information from a JWT token.
 * @description Validates JWT signature, checks expiration, and returns decrypted wallet data.
 * 
 * - Docs:https://dacc-js.thefactlab.org/functions/session-wallet/verify-time-jwt
 * 
 * @param jwt JWT token string to verify and decode.
 * @param jwtSecret Secret key used for JWT verification. Must match the secret used in allowSessionTimeWalletWithJWT.
 * @returns Decrypted wallet object with address and private key, or null if invalid/expired.
 * 
 * @example
 * import { verifySessionTimeWalletWithJWT } from "dacc-js";
 * 
 * const walletJWT = await verifySessionTimeWalletWithJWT({
 *   jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   jwtSecret: 'jwt-secret-to-app'
 * });
 *
 * if (walletJWT) {
 *   console.log(walletJWT.address);    // 0x123address...
 *   console.log(walletJWT.privateKey); // 0xprivatekey...
 * } else {
 *   console.log('Invalid or expired token');
 * }
 */
export async function verifySessionTimeWalletWithJWT(options: OptionVerifyDaccJWT): Promise<TypeDaccWalletJWT | null> {
  const { jwt, jwtSecret } = options;
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signature] = parts;
  if (!headerB64 || !payloadB64 || !signature) return null;

  const signingInput = `${headerB64}.${payloadB64}`;
  const isValid = await verifyHMAC(signingInput, jwtSecret, signature);
  if (!isValid) return null;

  const payloadStr = new TextDecoder().decode(base64UrlDecode(payloadB64));
  const payload = JSON.parse(payloadStr);

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) return null;

  const privateKey = await decryptHash(payload.encryptedPk, jwtSecret);
  const address = payload.address.startsWith("0x")
    ? (payload.address as `0x${string}`)
    : (`0x${payload.address}` as `0x${string}`);

  return { address, privateKey };
}
