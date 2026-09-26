const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function normalizeSecret(secret) {
  return secret.replace(/\s+/g, "").toUpperCase();
}

export function base32ToBytes(input) {
  const clean = normalizeSecret(input).replace(/=+$/, "");
  let bits = "";
  for (const char of clean) {
    const index = base32Alphabet.indexOf(char);
    if (index === -1) {
      throw new Error("Invalid Base32 secret");
    }
    bits += index.toString(2).padStart(5, "0");
  }

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
  view.setUint32(4, counter);

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
