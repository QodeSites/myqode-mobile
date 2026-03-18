/**
 * Formats a decimal or percentage number to a display string.
 * e.g. -18.91 → "-18.91%"  |  11.89 → "+11.89%"
 */
export function formatPercent(
  value: number | null | undefined,
  showSign = true,
  decimals = 2
): string {
  if (value === null || value === undefined || isNaN(value)) return '-';

  const fixed = Math.abs(value).toFixed(decimals);
  if (value > 0 && showSign) return `+${fixed}%`;
  if (value < 0) return `-${fixed}%`;
  return `${fixed}%`;
}

/**
 * Returns 'positive' | 'negative' | 'neutral' for color coding
 */
export function getValueSentiment(value: number | null | undefined): 'positive' | 'negative' | 'neutral' {
  if (value === null || value === undefined || isNaN(value)) return 'neutral';
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}
