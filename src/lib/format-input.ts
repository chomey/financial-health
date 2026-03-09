/**
 * Shared helpers for numeric input formatting and parsing.
 */

/** Strip non-numeric chars and parse as a number. Returns 0 for invalid input. */
export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a numeric string with thousand-separator commas as the user types.
 * Preserves the decimal portion and any leading minus sign.
 * Non-numeric characters (except . and -) are stripped.
 *
 * Examples: "1234" → "1,234", "1234.5" → "1,234.5", "-50000" → "-50,000"
 */
export function formatNumericInput(value: string): string {
  // Strip everything except digits, period, minus
  const stripped = value.replace(/[^0-9.\-]/g, "");
  if (stripped === "" || stripped === "-") return stripped;

  // Split on decimal point
  const parts = stripped.split(".");
  const intPart = parts[0];
  const decPart = parts.length > 1 ? parts.slice(1).join("") : null;

  // Add commas to integer part
  const negative = intPart.startsWith("-");
  const digits = negative ? intPart.slice(1) : intPart;
  const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted = negative ? "-" + withCommas : withCommas;

  return decPart !== null ? formatted + "." + decPart : formatted;
}
