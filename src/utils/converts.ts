import { bytesToHex, fromHex } from "viem";

export const BASE58_RANDOM = "1234567890ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export const DACC_PREFIX = "daccPublickey_";

export function toBase58WithPrefix(bytes: Uint8Array, address?: `0x${string}`): string {
  if (!(bytes instanceof Uint8Array)) throw new TypeError("Invalid bytes input");

  let hex = bytesToHex(bytes).slice(2);
  let num = BigInt("0x" + hex);

  let encoded = "";
  while (num > 0n) {
    const remainder = Number(num % 58n);
    encoded = BASE58_RANDOM[remainder] + encoded;
    num /= 58n;
  }

  const addPart = address ? `${address}_` : "";
  return `${DACC_PREFIX}${addPart}${encoded || "1"}`;
}

export function fromBase58WithPrefix(str: string): Uint8Array {
  if (!str.startsWith(DACC_PREFIX)) throw new Error("Invalid prefix");

  const parts = str.split("_");
  const base58Part = parts.length === 2 ? parts[1] : parts.length >= 3 ? parts.slice(2).join("_") : "";
  if (!base58Part) throw new Error("Invalid Base58 format (empty payload)");

  let num = 0n;
  for (const char of base58Part) {
    const idx = BASE58_RANDOM.indexOf(char);
    if (idx === -1) throw new Error(`Invalid Base58 character: '${char}'`);
    num = num * 58n + BigInt(idx);
  }

  let hex = num.toString(16);
  if (hex.length % 2 !== 0) hex = "0" + hex;
  return fromHex(`0x${hex}`, "bytes");
}
