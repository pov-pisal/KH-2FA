const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function normalizeSecret(secret) {
  return (secret || "").toString().replace(/\s+/g, "").toUpperCase();
}

export function isValidSecret(input) {
  try {
    const bytes = base32ToBytes(input);
    return bytes.length > 0;
  } catch {
    return false;
  }
}

export function base32ToBytes(input) {
  const clean = normalizeSecret(input).replace(/=+$/, "");
  if (!clean) return new Uint8Array(0);

  const bitsArray = [];
  for (const char of clean) {
    const index = base32Alphabet.indexOf(char);
    if (index === -1) {
      throw new Error("Invalid Base32 secret");
    }
    bitsArray.push(index.toString(2).padStart(5, "0"));
  }
  const bits = bitsArray.join("");

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

export async function generateTOTP(secret, now = Date.now(), options = {}) {
  const period = Number(options.period) || 30;
  const digits = options.digits === "steam" || options.digits === 5 ? "steam" : (Number(options.digits) || 6);
  const algorithm = (options.algorithm || "SHA-1").toUpperCase();

  const hashName =
    algorithm === "SHA-256" || algorithm === "SHA256"
      ? "SHA-256"
      : algorithm === "SHA-512" || algorithm === "SHA512"
        ? "SHA-512"
        : "SHA-1";

  const keyData = base32ToBytes(secret);
  const counter = Math.floor(now / 1000 / period);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(counter));

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: hashName },
    false,
    ["sign"]
  );

  const hmac = await crypto.subtle.sign("HMAC", key, buffer);
  const hmacView = new DataView(hmac);
  const offset = hmacView.getUint8(hmac.byteLength - 1) & 0x0f;
  const binCode =
    ((hmacView.getUint8(offset) & 0x7f) << 24) |
    ((hmacView.getUint8(offset + 1) & 0xff) << 16) |
    ((hmacView.getUint8(offset + 2) & 0xff) << 8) |
    (hmacView.getUint8(offset + 3) & 0xff);

  if (digits === "steam") {
    const STEAM_CHARS = "23456789BCDFGHJKMNPQRTVWXY";
    let fullCode = binCode;
    let steamCode = "";
    for (let i = 0; i < 5; i += 1) {
      steamCode += STEAM_CHARS[fullCode % STEAM_CHARS.length];
      fullCode = Math.floor(fullCode / STEAM_CHARS.length);
    }
    return steamCode;
  }

  const numDigits = Math.min(Math.max(Number(digits) || 6, 6), 8);
  const modulo = Math.pow(10, numDigits);
  const otp = (binCode % modulo).toString().padStart(numDigits, "0");
  return otp;
}

export function bytesToBase32(bytes) {
  if (!bytes || bytes.length === 0) return "";
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < bytes.length; i += 1) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += base32Alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

function decodeVarint(bytes, offset) {
  let res = 0;
  let shift = 0;
  while (offset < bytes.length) {
    const b = bytes[offset];
    offset += 1;
    res |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }
  return [res, offset];
}

/**
 * Parses Google Authenticator export migration URIs:
 * otpauth-migration://offline?data=...
 * Returns an array of account objects or null if invalid.
 */
export function parseGoogleMigrationUri(uri) {
  if (!uri || typeof uri !== "string") return null;
  const cleanUri = uri.trim();
  if (!cleanUri.startsWith("otpauth-migration://offline?data=")) return null;

  try {
    const url = new URL(cleanUri);
    const rawData = url.searchParams.get("data");
    if (!rawData) return null;

    // Convert URL-safe base64 to standard base64 and pad
    let b64 = rawData.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4 !== 0) {
      b64 += "=";
    }

    const binaryStr = atob(b64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i += 1) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const accounts = [];
    let offset = 0;

    while (offset < bytes.length) {
      const [key, nextOffset] = decodeVarint(bytes, offset);
      offset = nextOffset;
      const fieldNum = key >>> 3;
      const wireType = key & 0x07;

      if (wireType === 0) {
        // varint field
        const [, nextO] = decodeVarint(bytes, offset);
        offset = nextO;
      } else if (wireType === 2) {
        // length-delimited field
        const [len, dataOffset] = decodeVarint(bytes, offset);
        offset = dataOffset;
        const fieldBytes = bytes.slice(offset, offset + len);
        offset += len;

        // field 1 = repeated OtpParameters
        if (fieldNum === 1) {
          let pOffset = 0;
          let secret = null;
          let name = "";
          let issuer = "";
          let algorithm = "SHA-1";
          let digits = 6;

          while (pOffset < fieldBytes.length) {
            const [pKey, pNext] = decodeVarint(fieldBytes, pOffset);
            pOffset = pNext;
            const pField = pKey >>> 3;
            const pWire = pKey & 0x07;

            if (pWire === 0) {
              const [val, po] = decodeVarint(fieldBytes, pOffset);
              pOffset = po;
              if (pField === 4) {
                algorithm = val === 2 ? "SHA-256" : val === 3 ? "SHA-512" : "SHA-1";
              } else if (pField === 5) {
                digits = val === 2 ? 8 : 6;
              }
            } else if (pWire === 2) {
              const [pLen, po] = decodeVarint(fieldBytes, pOffset);
              pOffset = po;
              const subBytes = fieldBytes.slice(pOffset, pOffset + pLen);
              pOffset += pLen;

              if (pField === 1) {
                secret = bytesToBase32(subBytes);
              } else if (pField === 2) {
                name = new TextDecoder().decode(subBytes);
              } else if (pField === 3) {
                issuer = new TextDecoder().decode(subBytes);
              }
            } else {
              break;
            }
          }

          if (secret) {
            let label = name;
            if (!issuer && name.includes(":")) {
              const parts = name.split(":");
              issuer = parts[0].trim();
              label = parts.slice(1).join(":").trim();
            } else if (issuer && name.startsWith(`${issuer}:`)) {
              label = name.slice(issuer.length + 1).trim();
            }

            accounts.push({
              issuer: issuer || label || "Account",
              label: label || "",
              secret: normalizeSecret(secret),
              algorithm,
              digits,
              period: 30,
            });
          }
        }
      } else {
        break;
      }
    }

    return accounts.length > 0 ? accounts : null;
  } catch (err) {
    console.warn("Failed to parse Google migration URI:", err);
    return null;
  }
}

export function parseOtpauth(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  const cleanUrl = url.trim();
  if (!cleanUrl.startsWith("otpauth://")) {
    return null;
  }

  try {
    const parsed = new URL(cleanUrl);
    const labelRaw = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    const params = parsed.searchParams;
    const secret = params.get("secret") || "";
    const issuerParam = params.get("issuer") || "";
    const algorithm = (params.get("algorithm") || "SHA1").toUpperCase();
    const digits = params.get("digits") ? Number(params.get("digits")) : 6;
    const period = params.get("period") ? Number(params.get("period")) : 30;

    let issuer = issuerParam;
    let label = labelRaw;
    if (labelRaw.includes(":")) {
      const [labelIssuer, labelName] = labelRaw.split(":");
      issuer = issuer || labelIssuer;
      label = labelName;
    }

    return {
      issuer: issuer.trim(),
      label: label.trim(),
      secret: normalizeSecret(secret),
      algorithm: algorithm.includes("256") ? "SHA-256" : algorithm.includes("512") ? "SHA-512" : "SHA-1",
      digits: digits === 8 ? 8 : digits === 7 ? 7 : 6,
      period: period > 0 ? period : 30,
    };
  } catch (error) {
    return null;
  }
}
