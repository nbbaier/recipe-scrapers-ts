/**
 * Type definitions for recipe data structures
 */

/**
 * Complete recipe data structure matching Python's to_json() output
 */
export interface Recipe {
  /** Recipe title */
  title: string;

  /** Author of the recipe */
  author?: string;

  /** Canonical or original URL of the recipe */
  canonical_url: string;

  /** Name of the website */
  site_name: string;

  /** Host domain of the recipe URL */
  host: string;

  /** Language the recipe is written in (e.g., 'en', 'es') */
  language?: string;

  /** List of ingredients */
  ingredients: string[];

  /** Grouped ingredients with purpose/section labels */
  ingredient_groups?: IngredientGroup[];

  /** Full instructions as a single string */
  instructions: string;

  /** Instructions as a list of steps */
  instructions_list: string[];

  /** Category of the recipe (e.g., 'dessert', 'main course') */
  category?: string;

  /** Yield/servings (e.g., '4 servings', '8') */
  yields?: string;

  /** Recipe description */
  description?: string;

  /** Total time in minutes */
  total_time?: number;

  /** Cooking time in minutes */
  cook_time?: number;

  /** Preparation time in minutes */
  prep_time?: number;

  /** Cuisine type (e.g., 'Italian', 'Mexican') */
  cuisine?: string;

  /** Cooking method (e.g., 'baking', 'grilling') */
  cooking_method?: string;

  /** Average rating value */
  ratings?: number;

  /** Total number of ratings */
  ratings_count?: number;

  /** Equipment needed for the recipe */
  equipment?: string[];

  /** Nutritional information */
  nutrients?: Nutrients;

  /** Dietary restrictions or guidelines (e.g., 'vegetarian', 'gluten-free') */
  dietary_restrictions?: string[];

  /** Image URL for the recipe */
  image?: string;

  /** Keywords or tags */
  keywords?: string[];
}

/**
 * Ingredient group with optional purpose label
 */
export interface IngredientGroup {
  /** Purpose or section name (e.g., 'For the sauce', 'For the topping') */
  purpose?: string;

  /** Ingredients in this group */
  ingredients: string[];
}

/**
 * Nutritional information (flexible key-value pairs)
 */
export interface Nutrients {
  /** Calories */
  calories?: string;

  /** Carbohydrate content */
  carbohydrateContent?: string;

  /** Cholesterol content */
  cholesterolContent?: string;

  /** Fat content */
  fatContent?: string;

  /** Fiber content */
  fiberContent?: string;

  /** Protein content */
  proteinContent?: string;

  /** Saturated fat content */
  saturatedFatContent?: string;

  /** Serving size */
  servingSize?: string;

  /** Sodium content */
  sodiumContent?: string;

  /** Sugar content */
  sugarContent?: string;

  /** Trans fat content */
  transFatContent?: string;

  /** Unsaturated fat content */
  unsaturatedFatContent?: string;

  /** Additional nutrients */
  [key: string]: string | undefined;
}
