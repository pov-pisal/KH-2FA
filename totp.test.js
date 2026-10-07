import { normalizeSecret } from './totp.js';

describe('normalizeSecret', () => {
  it('should remove all spaces and convert to uppercase', () => {
    expect(normalizeSecret('a b c')).toBe('ABC');
    expect(normalizeSecret('  a  b  c  ')).toBe('ABC');
    expect(normalizeSecret('a\nb\tc')).toBe('ABC');
    expect(normalizeSecret('a b c d e f g h i j k l m n o p q r s t u v w x y z')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  });

  it('should handle already normalized secrets', () => {
    expect(normalizeSecret('ABCDEF')).toBe('ABCDEF');
  });

  it('should handle empty strings', () => {
    expect(normalizeSecret('')).toBe('');
  });

  it('should handle strings with only spaces', () => {
    expect(normalizeSecret(' ')).toBe('');
    expect(normalizeSecret('   ')).toBe('');
  });
});
