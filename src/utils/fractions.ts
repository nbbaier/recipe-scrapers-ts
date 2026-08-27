/**
 * Fraction parsing utilities for recipe scrapers
 */

const WHITESPACE_PATTERN = /\s+/;

/**
 * Map of Unicode fraction characters to their decimal values
 */
export const FRACTIONS = {
  "½": 0.5,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 0.25,
  "¾": 0.75,
  "⅕": 0.2,
  "⅖": 0.4,
  "⅗": 0.6,
  "⅘": 0.8,
  "⅙": 1 / 6,
  "⅚": 5 / 6,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

/**
 * Extracts a fractional number from a string.
 * Handles Unicode fractions (½, ¾), slash fractions (1/2),
 * and mixed numbers (1 1/2, 1½).
 *
 * @param input - The string containing the fraction
 * @returns The decimal value of the fraction
 * @throws {Error} If the fraction format is not recognized
 *
 * @example
 * extractFractional("1½") // Returns: 1.5
 * extractFractional("¾") // Returns: 0.75
 * extractFractional("1 1/2") // Returns: 1.5
 * extractFractional("3/4") // Returns: 0.75
 */
export function extractFractional(input: string): number {
  const trimmed = input.trim();

  // Handle unicode fractions, standalone or in mixed numbers (e.g., '¾', '1⅔')
  for (const [unicodeFraction, fractionValue] of Object.entries(FRACTIONS)) {
    if (trimmed.includes(unicodeFraction)) {
      const wholeNumberPart = trimmed.split(unicodeFraction)[0];
      const wholeNumber = Number.parseFloat(wholeNumberPart || "0");
      return wholeNumber + fractionValue;
    }
  }

  // Try parsing as a simple number
  const asNumber = Number.parseFloat(trimmed);
  if (!(Number.isNaN(asNumber) || trimmed.includes("/"))) {
    return asNumber;
  }

  // Handle mixed numbers with slash fractions (e.g., '1 1/2')
  if (trimmed.includes(" ") && trimmed.includes("/")) {
    const parts = trimmed.split(WHITESPACE_PATTERN); // Split on any whitespace
    const wholePart = Number.parseFloat(parts[0]);
    const fractionalPart = parts[1];
    const [numerator, denominator] = fractionalPart.split("/");
    return (
      wholePart + Number.parseFloat(numerator) / Number.parseFloat(denominator)
    );
  }

  // Handle simple slash fractions (e.g., '3/4')
  if (trimmed.includes("/")) {
    const [numerator, denominator] = trimmed.split("/");
    return Number.parseFloat(numerator) / Number.parseFloat(denominator);
  }

  throw new Error(`Unrecognized fraction format: '${trimmed}'`);
}
