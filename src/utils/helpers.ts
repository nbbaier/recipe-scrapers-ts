/**
 * Helper utilities for recipe scrapers
 */

/**
 * Recursively transforms all keys in an object using a conversion function.
 * Useful for fixing incorrect property keys in JSON-LD dictionaries.
 *
 * @param obj - The object to transform (can be nested)
 * @param convert - Function to transform each key
 * @returns New object with transformed keys
 *
 * @example
 * changeKeys({ "First Name": "John", "Last Name": "Doe" }, k => k.toLowerCase())
 * // Returns: { "first name": "john", "last name": "doe" }
 *
 * changeKeys({ "@type": "Recipe" }, k => k.replace("@", ""))
 * // Returns: { "type": "Recipe" }
 */
export function changeKeys<T>(obj: T, convert: (key: string) => string): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    // SAFETY: only keys are renamed; the array shape and element types are preserved, so the result is still a T.
    return obj.map((item) => changeKeys(item, convert)) as T;
  }

  if (typeof obj === "object" && obj.constructor === Object) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[convert(key)] = changeKeys(value, convert);
    }
    // SAFETY: only keys are renamed; values are converted recursively with their own types preserved, so the result has T's shape.
    return result as T;
  }

  if (obj instanceof Set) {
    // SAFETY: a Set of key-renamed elements has the same shape as the input Set, so it is still a T.
    return new Set(
      Array.from(obj).map((item) => changeKeys(item, convert))
    ) as T;
  }

  return obj;
}

/**
 * Removes duplicate equipment items from an array while preserving order.
 *
 * @param equipmentItems - Array of equipment items
 * @returns Array with duplicates removed, preserving original order
 *
 * @example
 * getEquipment(["Oven", "Bowl", "Oven", "Spoon"])
 * // Returns: ["Oven", "Bowl", "Spoon"]
 */
export function getEquipment(equipmentItems: string[]): string[] {
  // Use object keys to maintain order while removing duplicates
  // (Objects in modern JS maintain insertion order)
  const seen: Record<string, boolean> = {};
  const result: string[] = [];

  for (const item of equipmentItems) {
    if (!seen[item]) {
      seen[item] = true;
      result.push(item);
    }
  }

  return result;
}

/**
 * List of nutrition field keys used in Schema.org Recipe nutrition information
 */
export const NUTRITION_KEYS = [
  "servingSize",
  "calories",
  "fatContent",
  "saturatedFatContent",
  "unsaturatedFatContent",
  "transFatContent",
  "carbohydrateContent",
  "sugarContent",
  "proteinContent",
  "sodiumContent",
  "fiberContent",
  "cholesterolContent",
] as const;

/**
 * Type representing valid nutrition keys
 */
export type NutritionKey = (typeof NUTRITION_KEYS)[number];
