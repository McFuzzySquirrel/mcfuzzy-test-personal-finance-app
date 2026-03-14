import { formatCentsForInput, formatZAR, parseCurrencyInputToCents } from '@/utils/currency';

describe('currency utils', () => {
  it('formats cents into ZAR display string', () => {
    const result = formatZAR(4500);
    // en-ZA locale uses comma as decimal separator: "R 45,00"
    expect(result).toContain('R');
    expect(result).toContain('45');
  });

  it('formats cents for input fields', () => {
    expect(formatCentsForInput(12345)).toBe('123.45');
  });

  it('parses decimal and comma inputs to cents', () => {
    expect(parseCurrencyInputToCents('45.50')).toBe(4550);
    expect(parseCurrencyInputToCents('45,50')).toBe(4550);
  });

  it('returns null for invalid or empty values', () => {
    expect(parseCurrencyInputToCents('')).toBeNull();
    expect(parseCurrencyInputToCents('-10')).toBeNull();
    expect(parseCurrencyInputToCents('abc')).toBeNull();
  });
});
