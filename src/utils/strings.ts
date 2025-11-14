/**
 * String utility functions for recipe scrapers
 */

/**
 * Normalizes a string by unescaping HTML entities, removing HTML tags,
 * replacing special whitespace characters, and collapsing multiple spaces.
 *
 * @param input - The string to normalize
 * @returns The normalized string
 *
 * @example
 * normalizeString("&lt;p&gt;Hello&nbsp;&nbsp;World&lt;/p&gt;")
 * // Returns: "Hello World"
 */
export function normalizeString(input: string): string {
  // Recursively unescape HTML entities until no more changes occur
  let prev: string | null = null;
  let unescaped = input;
  while (prev !== unescaped) {
    prev = unescaped;
    unescaped = unescapeHtml(unescaped);
  }

  // Remove HTML tags
  const noHtmlString = unescaped.replace(/<[^>]*>/g, '');

  // Replace special characters and whitespace
  let cleaned = noHtmlString
    .replace(/\xc2\xa0/g, ' ') // Non-breaking space (encoded)
    .replace(/\xa0/g, ' ') // Non-breaking space
    .replace(/\u200b/g, '') // Zero-width space
    .replace(/\r\n/g, ' ') // Windows line endings
    .replace(/\n/g, ' ') // Unix line endings
    .replace(/\t/g, ' ') // Tabs
    .replace(/u0026#039;/g, "'") // Encoded apostrophe
    .trim();

  // Only replace '((' and '))' if both are present in the string
  if (cleaned.includes('((') && cleaned.includes('))')) {
    cleaned = cleaned.replace(/\(\(/g, '(').replace(/\)\)/g, ')');
  }

  // Collapse multiple spaces into single space
  cleaned = cleaned.replace(/\s+/g, ' ');

  return cleaned.trim();
}

/**
 * Helper function to unescape HTML entities
 */
function unescapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  };

  // Replace named entities
  let result = text;
  for (const [entity, char] of Object.entries(htmlEntities)) {
    result = result.replace(new RegExp(entity, 'g'), char);
  }

  // Replace numeric entities (decimal)
  result = result.replace(/&#(\d+);/g, (_match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });

  // Replace numeric entities (hexadecimal)
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return result;
}

/**
 * Converts a comma-separated string into an array of tags,
 * removing duplicates (case-insensitive) and optionally lowercasing.
 *
 * @param csv - Comma-separated string
 * @param lowercase - Whether to lowercase the tags (default: false)
 * @returns Array of unique tags
 *
 * @example
 * csvToTags("Italian, Pasta, italian, Dinner")
 * // Returns: ["Italian", "Pasta", "Dinner"]
 *
 * csvToTags("Italian, Pasta, italian, Dinner", true)
 * // Returns: ["italian", "pasta", "dinner"]
 */
export function csvToTags(csv: string, lowercase: boolean = false): string[] {
  const rawTags = csv.split(',');
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const rawTag of rawTags) {
    const tag = rawTag.trim();
    if (tag && !seen.has(tag.toLowerCase())) {
      seen.add(tag.toLowerCase());
      tags.push(lowercase ? tag.toLowerCase() : tag);
    }
  }

  return tags;
}

/**
 * Formats Schema.org diet names into human-readable format.
 * Handles both full Schema.org URLs and just the diet name.
 *
 * @param dietInput - Diet string (possibly a Schema.org URL)
 * @returns Formatted diet name or null if empty
 *
 * @example
 * formatDietName("http://schema.org/VeganDiet")
 * // Returns: "Vegan Diet"
 *
 * formatDietName("GlutenFreeDiet")
 * // Returns: "Gluten Free Diet"
 */
export function formatDietName(dietInput: string): string | null {
  const replacements: Record<string, string> = {
    // schema.org/RestrictedDiet
    DiabeticDiet: 'Diabetic Diet',
    GlutenFreeDiet: 'Gluten Free Diet',
    HalalDiet: 'Halal Diet',
    HinduDiet: 'Hindu Diet',
    KosherDiet: 'Kosher Diet',
    LowCalorieDiet: 'Low Calorie Diet',
    LowFatDiet: 'Low Fat Diet',
    LowLactoseDiet: 'Low Lactose Diet',
    LowSaltDiet: 'Low Salt Diet',
    VeganDiet: 'Vegan Diet',
    VegetarianDiet: 'Vegetarian Diet',
  };

  let diet = dietInput;

  // Extract diet name from Schema.org URL
  if (diet.includes('schema.org/')) {
    diet = diet.split('schema.org/').pop() || '';
  }

  // Exclude results that are just "schema.org/" (empty after split)
  if (diet.trim() === '') {
    return null;
  }

  // Check for known diet replacements
  for (const [key, value] of Object.entries(replacements)) {
    if (diet.includes(key)) {
      return value;
    }
  }

  // Return as-is if no replacement found
  return diet;
}
