const ZAR_CURRENCY_FORMATTER = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatZAR(cents: number): string {
  return ZAR_CURRENCY_FORMATTER.format(cents / 100);
}

export function formatCentsForInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function parseCurrencyInputToCents(value: string): number | null {
  if (value.trim().startsWith('-')) {
    return null;
  }

  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');

  if (normalized.trim().length === 0) {
    return null;
  }

  const firstDotIndex = normalized.indexOf('.');
  const sanitized =
    firstDotIndex === -1
      ? normalized
      : normalized.slice(0, firstDotIndex + 1) + normalized.slice(firstDotIndex + 1).replace(/\./g, '');

  const parsed = Number.parseFloat(sanitized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * 100);
}
