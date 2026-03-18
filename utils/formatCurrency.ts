/**
 * Formats a number using the Indian number system (lakh/crore)
 * e.g. 746309.51 → "₹7,46,309.51"
 */
export function formatINR(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '₹0.00';

  const isNegative = value < 0;
  const abs = Math.abs(value);

  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Short format: 746309 → "₹7.46L", 8303000 → "₹83.03L", 10000000 → "₹1.00Cr"
 */
export function formatShortINR(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '₹0';

  const isNegative = value < 0;
  const abs = Math.abs(value);

  let result: string;

  if (abs >= 10_000_000) {
    result = `₹${(abs / 10_000_000).toFixed(2)}Cr`;
  } else if (abs >= 100_000) {
    result = `₹${(abs / 100_000).toFixed(2)}L`;
  } else if (abs >= 1_000) {
    result = `₹${(abs / 1_000).toFixed(2)}K`;
  } else {
    result = `₹${abs.toFixed(2)}`;
  }

  return isNegative ? `-${result}` : result;
}
