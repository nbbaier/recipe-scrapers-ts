/**
 * Yield/serving parsing utilities for recipe scrapers
 */

/**
 * Regular expression to extract numeric values from yield strings
 */
const SERVE_REGEX_NUMBER = /(\D*(?<items>\d+(\.\d*)?)?\D*)/;

/**
 * Regular expression to identify specific item types (not servings)
 */
const SERVE_REGEX_ITEMS =
  /\bsandwiches\b|\btacquitos\b|\bappetizer\b|\bporzioni\b|\b(large |small )?buns\b/i;

/**
 * Regular expression to identify range formats like "4-6" or "4 to 6"
 */
const SERVE_REGEX_TO = /\d+(\s+to\s+|-)\d+/i;

/**
 * Recipe yield types in (singular, plural) format
 * Used to identify and format specific yield types
 */
export const RECIPE_YIELD_TYPES: Array<[string, string]> = [
  ['batch', 'batches'],
  ['cake', 'cakes'],
  ['cookie', 'cookies'],
  ['muffin', 'muffins'],
  ['cupcake', 'cupcakes'],
  ['loaf', 'loaves'],
  ['pie', 'pies'],
  ['cup', 'cups'],
  ['pint', 'pints'],
  ['gallon', 'gallons'],
  ['ounce', 'ounces'],
  ['pound', 'pounds'],
  ['gram', 'grams'],
  ['liter', 'liters'],
  ['piece', 'pieces'],
  ['layer', 'layers'],
  ['scoop', 'scoops'],
  ['bar', 'bars'],
  ['patty', 'patties'],
  ['hamburger bun', 'hamburger buns'],
  ['pancake', 'pancakes'],
  ['item', 'items'],
  ['dozen', 'dozen'], // Must be last - has priority over other types
];

/**
 * Formats a count with appropriate singular/plural label
 */
function formatCountLabel(
  count: number,
  singular: string,
  plural: string
): string {
  // Format as integer if the number is whole, otherwise keep decimals
  const formatted = Number.isInteger(count) ? count.toString() : count.toString();
  return `${formatted} ${count === 1 ? singular : plural}`;
}

/**
 * Parses recipe yield information from a string or HTML element.
 * Returns a string of servings or items. If the recipe is for a number of items
 * (not servings), it returns "x item(s)" where x is the quantity.
 * Handles cases where the yield is in dozens (e.g., "4 dozen cookies"),
 * batches (e.g., "2 batches of brownies"), or other specific units.
 *
 * @param element - Yield string or HTML element with text
 * @returns Formatted yield string (e.g., "4 servings", "2 dozen", "6 cookies")
 * @throws {Error} If element is null or empty
 *
 * @example
 * getYields("Serves 4-6") // Returns: "6 servings"
 * getYields("Makes 2 dozen cookies") // Returns: "2 dozen"
 * getYields("12 servings") // Returns: "12 servings"
 * getYields("8 muffins") // Returns: "8 muffins"
 */
export function getYields(
  element: string | { getText?: () => string } | null
): string {
  if (element === null || element === undefined) {
    throw new Error('Element cannot be null or undefined');
  }

  // Extract text from element
  let serveText: string;
  if (typeof element === 'string') {
    serveText = element;
  } else if (typeof element === 'object' && 'getText' in element && element.getText) {
    serveText = element.getText();
  } else {
    serveText = element.toString();
  }

  if (!serveText) {
    throw new Error('Cannot extract yield information from empty string');
  }

  // Handle range formats (e.g., "4-6 servings" or "4 to 6 servings")
  // Take the higher number (end of range)
  const rangeMatch = SERVE_REGEX_TO.exec(serveText);
  if (rangeMatch) {
    // Extract the second number from the range
    const rangeText = rangeMatch[0]; // e.g., "4-6" or "4 to 6"
    const numbers = rangeText.match(/\d+/g); // Extract all numbers
    if (numbers && numbers.length >= 2) {
      // Replace the range with just the second (higher) number
      serveText = serveText.replace(rangeMatch[0], numbers[1]);
    }
  }

  // Extract numeric value
  const numberMatch = SERVE_REGEX_NUMBER.exec(serveText);
  const matchedRaw = numberMatch?.groups?.items || '0';
  let matched: number;
  try {
    matched = parseFloat(matchedRaw);
  } catch {
    matched = 0;
  }

  const serveTextLower = serveText.toLowerCase();
  let bestMatch: string | null = null;
  let bestMatchLength = 0;

  // Look for specific yield types (dozen, batch, cookies, etc.)
  for (const [singular, plural] of RECIPE_YIELD_TYPES) {
    if (serveTextLower.includes(singular) || serveTextLower.includes(plural)) {
      const matchLength = serveTextLower.includes(singular)
        ? singular.length
        : plural.length;

      // Use the longest match (e.g., "hamburger bun" over "bun")
      // For equal lengths, later matches win (e.g., "dozen" has priority)
      if (matchLength >= bestMatchLength) {
        bestMatchLength = matchLength;
        bestMatch = formatCountLabel(matched, singular, plural);
      }
    }
  }

  if (bestMatch) {
    return bestMatch;
  }

  // Check if it's specifically for items (not servings)
  if (SERVE_REGEX_ITEMS.test(serveText)) {
    return formatCountLabel(matched, 'item', 'items');
  }

  // Default to servings
  return formatCountLabel(matched, 'serving', 'servings');
}
