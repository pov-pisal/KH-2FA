// passwordGenerator.js - Cryptographic Password & Passphrase Generator for KH 2FA

// Curated list of friendly, distinct, memorable English words for passphrases
const PASSPHRASE_WORDS = [
  "acorn", "amber", "anchor", "anthem", "apex", "apron", "archer", "arrow", "aspect", "atlas",
  "atomic", "aurora", "autumn", "avatar", "badge", "bamboo", "banner", "baron", "beacon", "breeze",
  "bronze", "bubble", "cactus", "canyon", "castle", "cedar", "celeste", "chalet", "champion", "chrome",
  "cider", "cipher", "citadel", "clover", "cobalt", "comet", "compass", "copper", "coral", "cosmos",
  "crater", "crescent", "crown", "crystal", "dagger", "dawn", "delta", "drift", "dynamo", "eagle",
  "echo", "eclipse", "ember", "emerald", "engine", "falcon", "feather", "flame", "flint", "forest",
  "fossil", "fountain", "fox", "frost", "galaxy", "garnet", "glacier", "glider", "glow", "granite",
  "harbor", "haven", "hawk", "hazel", "helix", "horizon", "hunter", "hydra", "iceberg", "indigo",
  "island", "jade", "javelin", "jungle", "jupiter", "kayak", "knight", "lagoon", "lantern", "laser",
  "legend", "lemon", "leopard", "liberty", "lightning", "lynx", "magnet", "maple", "marble", "matrix",
  "meadow", "meteor", "mirage", "mirror", "mist", "monarch", "moon", "mosaic", "mountain", "nebula",
  "neon", "nexus", "ninja", "nomad", "nova", "oasis", "obsidian", "ocean", "omega", "onyx",
  "opal", "orbit", "orchid", "orion", "otter", "oxygen", "panda", "panther", "parrot", "pebble",
  "phantom", "phoenix", "pilot", "pinnacle", "planet", "plasma", "polar", "prism", "pulsar", "quantum",
  "quartz", "quasar", "radar", "radiant", "raven", "reef", "rhino", "ridge", "river", "rocket",
  "ruby", "sage", "sapphire", "saturn", "shadow", "shimmer", "sierra", "signal", "silver", "siren",
  "solar", "spark", "spectrum", "sphere", "spiral", "spring", "stellar", "summit", "sunburst", "supernova",
  "talon", "tempest", "thunder", "tiger", "timber", "titan", "topaz", "tornado", "tracer", "traveler",
  "tropic", "tsunami", "tundra", "twilight", "ultra", "valiant", "valley", "vapor", "velvet", "venture",
  "vessel", "vibrant", "victory", "vintage", "violet", "viper", "vision", "vortex", "voyager", "walrus",
  "wave", "willow", "winter", "wizard", "wolf", "zenith", "zephyr", "zodiac"
];

const CHAR_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

const AMBIGUOUS_CHARS = new Set(["i", "l", "1", "I", "o", "0", "O", "|"]);

/**
 * Generate a cryptographically secure random integer in [0, max) with zero bias.
 */
function secureRandomInt(max) {
  if (max <= 0) return 0;
  if (max === 1) return 0;

  // Rejection sampling for uniform distribution
  const maxUint = 0xffffffff;
  const limit = maxUint - (maxUint % max);
  const buffer = new Uint32Array(1);

  let rand;
  do {
    crypto.getRandomValues(buffer);
    rand = buffer[0];
  } while (rand >= limit);

  return rand % max;
}

/**
 * Generate a cryptographically secure random password.
 */
export function generateRandomPassword(options = {}) {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
    avoidAmbiguous = false,
  } = options;

  let pool = "";
  const guaranteedChars = [];

  const addSet = (charString) => {
    let set = charString;
    if (avoidAmbiguous) {
      set = set.split("").filter((ch) => !AMBIGUOUS_CHARS.has(ch)).join("");
    }
    if (set.length > 0) {
      pool += set;
      guaranteedChars.push(set[secureRandomInt(set.length)]);
    }
  };

  if (lowercase) addSet(CHAR_SETS.lowercase);
  if (uppercase) addSet(CHAR_SETS.uppercase);
  if (numbers) addSet(CHAR_SETS.numbers);
  if (symbols) addSet(CHAR_SETS.symbols);

  // Fallback to lowercase + numbers if everything was unchecked
  if (!pool) {
    pool = CHAR_SETS.lowercase + CHAR_SETS.numbers;
    guaranteedChars.push(CHAR_SETS.lowercase[0]);
    guaranteedChars.push(CHAR_SETS.numbers[0]);
  }

  const result = [...guaranteedChars];
  const targetLen = Math.max(result.length, Number(length) || 16);

  while (result.length < targetLen) {
    result.push(pool[secureRandomInt(pool.length)]);
  }

  // Cryptographic Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }

  return result.slice(0, targetLen).join("");
}

/**
 * Generate a memorable passphrase (e.g. "comet-amber-falcon-zenith").
 */
export function generatePassphrase(options = {}) {
  const {
    wordCount = 4,
    separator = "-",
    capitalize = true,
    includeNumber = true,
  } = options;

  const count = Math.max(3, Math.min(8, Number(wordCount) || 4));
  const words = [];

  for (let i = 0; i < count; i++) {
    let word = PASSPHRASE_WORDS[secureRandomInt(PASSPHRASE_WORDS.length)];
    if (capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    words.push(word);
  }

  if (includeNumber) {
    const num = secureRandomInt(90) + 10; // 10 to 99
    const pos = secureRandomInt(words.length);
    words[pos] = words[pos] + num;
  }

  let sep = separator;
  if (sep === "space") sep = " ";
  else if (sep === "dot") sep = ".";
  else if (sep === "underscore") sep = "_";
  else if (sep === "hyphen" || !sep) sep = "-";

  return words.join(sep);
}

/**
 * Generate a PIN (digits only).
 */
export function generatePin(length = 6) {
  const len = Math.max(4, Math.min(16, Number(length) || 6));
  let pin = "";
  for (let i = 0; i < len; i++) {
    pin += CHAR_SETS.numbers[secureRandomInt(CHAR_SETS.numbers.length)];
  }
  return pin;
}

/**
 * Evaluate password strength and estimate crack resistance.
 * Returns { score: 0-4, label, entropy, percent, color, crackTime }
 */
export function evaluatePasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: "Empty",
      entropy: 0,
      percent: 0,
      color: "var(--muted)",
      crackTime: "Instant",
    };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 33;

  const len = password.length;
  // Entropy in bits: E = len * log2(poolSize)
  const entropy = Math.round(len * Math.log2(Math.max(2, poolSize)));

  let score = 0;
  let label = "Very Weak";
  let color = "#ef4444"; // red
  let crackTime = "Instant";

  if (entropy < 35 || len < 6) {
    score = 0;
    label = "Very Weak";
    color = "#ef4444";
    crackTime = "Instant";
  } else if (entropy < 50 || len < 8) {
    score = 1;
    label = "Weak";
    color = "#f97316"; // orange
    crackTime = "A few minutes";
  } else if (entropy < 65 || len < 12) {
    score = 2;
    label = "Fair";
    color = "#fbbf24"; // yellow
    crackTime = "A few months";
  } else if (entropy < 85 || len < 15) {
    score = 3;
    label = "Strong";
    color = "#34d399"; // emerald
    crackTime = "Several centuries";
  } else {
    score = 4;
    label = "Very Strong";
    color = "#38bdf8"; // cyan
    crackTime = "Millions of years";
  }

  const percent = Math.min(100, Math.round((entropy / 100) * 100));

  return {
    score,
    label,
    entropy,
    percent,
    color,
    crackTime,
  };
}
