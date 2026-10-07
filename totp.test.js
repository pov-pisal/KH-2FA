import { test, describe } from 'node:test';
import assert from 'node:assert';
import { parseOtpauth } from './totp.js';

describe('parseOtpauth', () => {
  test('returns null for non-string or missing inputs', () => {
    assert.strictEqual(parseOtpauth(null), null);
    assert.strictEqual(parseOtpauth(undefined), null);
    assert.strictEqual(parseOtpauth(123), null);
    assert.strictEqual(parseOtpauth({}), null);
    assert.strictEqual(parseOtpauth(), null);
  });

  test('returns null for empty strings or strings containing only whitespace', () => {
    assert.strictEqual(parseOtpauth(''), null);
    assert.strictEqual(parseOtpauth('   '), null);
  });

  test('returns null for URLs without the otpauth:// prefix', () => {
    assert.strictEqual(parseOtpauth('http://example.com'), null);
    assert.strictEqual(parseOtpauth('otpauth:totp/Example:alice@google.com'), null);
    assert.strictEqual(parseOtpauth('totp/Example:alice@google.com'), null);
  });

  test('returns null for invalid URLs that cause new URL() to throw', () => {
    // new URL() throws on [invalid_hostname] which causes parseOtpauth to return null
    assert.strictEqual(parseOtpauth('otpauth://[invalid_hostname]/totp?secret=ABC'), null);
  });

  test('returns parsed object for valid otpauth URLs', () => {
    const expected = {
      issuer: 'Example',
      label: 'alice@google.com',
      secret: 'JBSWY3DPEHPK3PXP',
      algorithm: 'SHA-1',
      digits: 6,
      period: 30
    };
    assert.deepStrictEqual(parseOtpauth('otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example'), expected);
  });

  test('handles URL whitespace trimming', () => {
    const expected = {
      issuer: 'Example',
      label: 'alice@google.com',
      secret: 'JBSWY3DPEHPK3PXP',
      algorithm: 'SHA-1',
      digits: 6,
      period: 30
    };
    assert.deepStrictEqual(parseOtpauth('  otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example  '), expected);
  });
});
