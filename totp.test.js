import test from 'node:test';
import assert from 'node:assert';
import { base32ToBytes } from './totp.js';

test('base32ToBytes error handling', async (t) => {
  await t.test('throws for invalid character (8)', () => {
    assert.throws(
      () => base32ToBytes('JBSWY3DPEHPK3PXP8'),
      { message: 'Invalid Base32 secret' }
    );
  });

  await t.test('throws for valid-looking string with space if not normalized', () => {
    // Note: normalizeSecret removes spaces, so this actually might be valid!
    // Let's test a character that won't be normalized out.
    assert.throws(
      () => base32ToBytes('JBSWY3DPEHPK3PXP!'),
      { message: 'Invalid Base32 secret' }
    );
  });

});

test('base32ToBytes valid cases', async (t) => {
  await t.test('handles empty string properly (returns empty array)', () => {
    const result = base32ToBytes('');
    assert.ok(result instanceof Uint8Array);
    assert.strictEqual(result.length, 0);
  });

  await t.test('parses valid base32 string without padding', () => {
    const result = base32ToBytes('JBSWY3DPEHPK3PXP');
    assert.ok(result instanceof Uint8Array);
    assert.strictEqual(result.length, 10);
  });

  await t.test('parses valid base32 string with padding', () => {
    const result = base32ToBytes('JBSWY3DP====');
    assert.ok(result instanceof Uint8Array);
  });

  await t.test('parses valid base32 string with spaces (normalized)', () => {
    const result = base32ToBytes('JBSWY 3DPEH PK3PXP');
    assert.strictEqual(result.length, 10);
  });
});
