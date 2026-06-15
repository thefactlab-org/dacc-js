import { privateKeyToAccount } from "viem/accounts";
import { encryptWithPassword, decryptWithPassword, type EncryptMode } from "../../utils/modeV2";

export interface TypeDaccWalletJWT_V2 {
  address: `0x${string}`;
  privateKey: `0x${string}`;
}

export interface OptionAllowDaccWalletJWT_V2 {
  daccPublickey: string;
  passwordSecretkey: string;
  jwtSecret: string;
  maxAgeSeconds?: number;
  encryptMode?: EncryptMode;
}

export interface OptionVerifyDaccJWT_V2 {
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

export async function encryptHash(
  pk: `0x${string}`,
  password: string,
  mode?: EncryptMode
): Promise<string> {
  return encryptWithPassword(pk, password, mode);
}

export async function decryptHash(
  encrypted: string,
  password: string
): Promise<`0x${string}`> {
  const { value } = await decryptWithPassword(encrypted, password);
  return value;
}

async function signHMAC(payload: string, secret: string): Promise<string> {
  const key = await subtle.importKey(
    "raw",
    Uint8Array.from(new TextEncoder().encode(secret)),
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
    Uint8Array.from(new TextEncoder().encode(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  return subtle.verify("HMAC", key, Uint8Array.from(base64UrlDecode(signature)), new TextEncoder().encode(payload));
}

/**
 * Creates a JWT token containing encrypted wallet information for session management.
 * @description Decrypts wallet with user password, re-encrypts with JWT secret, and creates a signed token with expiration.
 *
 * - Docs: https://dacc-js.thefactlab.org/functions/v2/session-wallet/create-time-jwt
 *
 * @param daccPublickey The encrypted wallet data, returned from `createDaccWallet`.
 * @param passwordSecretkey User password for decrypting the wallet. Must match the password used with `createDaccWallet`.
 * @param jwtSecret Secret key for JWT signing and encryption. Keep secure and consistent across your application.
 * @param maxAgeSeconds Token expiration time in seconds. Default: 3600 (1 hour).
 * @param encryptMode Optional: Encryption speed preset used for the JWT-wrapped: `down`, `low`, `fast`, `medium`, or `high` (default: `medium`).
 * @returns JWT token string containing encrypted wallet data.
 *
 * @example
 * import { allowSessionTimeWalletWithJWT_V2 } from "dacc-js";
 *
 * const jwt = await allowSessionTimeWalletWithJWT_V2({
 *   daccPublickey: 'daccPublickey_0x123_XxX..',
 *   passwordSecretkey: 'my+Password#123..',
 *   jwtSecret: 'jwt-secret-to-app',
 *   encryptMode: 'fast', // optional (default: 'medium')
 *   // maxAgeSeconds: 3600 // default (1 hour)
 * });
 *
 * console.log(jwt); // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
export async function allowSessionTimeWalletWithJWT_V2(options: OptionAllowDaccWalletJWT_V2): Promise<string> {
  const { daccPublickey, passwordSecretkey, jwtSecret, maxAgeSeconds = 3600, encryptMode = "medium" } = options;

  try {
    const privateKey = await decryptHash(daccPublickey, passwordSecretkey);
    const { address } = privateKeyToAccount(privateKey);
    const encryptedPk = await encryptHash(privateKey, jwtSecret, encryptMode);

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
 * - Docs:https://dacc-js.thefactlab.org/functions/v2/session-wallet/verify-time-jwt
 *
 * @param jwt JWT token string to verify and decode.
 * @param jwtSecret Secret key used for JWT verification. Must match the secret used in allowSessionTimeWalletWithJWT_V2.
 * @returns Decrypted wallet object with address and private key, or null if invalid/expired.
 *
 * @example
 * import { verifySessionTimeWalletWithJWT_V2 } from "dacc-js";
 *
 * const walletJWT = await verifySessionTimeWalletWithJWT_V2({
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
export async function verifySessionTimeWalletWithJWT_V2(options: OptionVerifyDaccJWT_V2): Promise<TypeDaccWalletJWT_V2 | null> {
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
