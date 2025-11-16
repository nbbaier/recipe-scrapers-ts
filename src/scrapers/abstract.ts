/**
 * Abstract base class for all recipe scrapers
 *
 * This class defines the interface that all recipe scrapers must implement.
 * It provides common functionality and delegates recipe extraction to
 * Schema.org and OpenGraph parsers.
 */

import * as cheerio from 'cheerio';
import { ElementNotFoundInHtml } from '../exceptions';
import { OpenGraph } from '../parsers/opengraph';
import { SchemaOrg } from '../parsers/schema-org';
import { settings } from '../settings';
import type { IngredientGroup, Recipe } from '../types/recipe';

/**
 * Abstract base scraper class
 */
export abstract class AbstractScraper {
  protected pageData: string;
  protected url: string;
  protected readonly $: cheerio.CheerioAPI;
  protected opengraph: OpenGraph;
  protected schema: SchemaOrg;
  protected bestImageSelection: boolean;

  /**
   * Check if Schema.org data is available
   * Used by factory to determine if wild mode scraping is possible
   */
  hasSchema(): boolean {
    // biome-ignore lint/suspicious/noExplicitAny: schema type is dynamic and can have various shapes
    return !!(this.schema && (this.schema as any).data);
  }

  /**
   * Creates a new scraper instance
   *
   * @param html - HTML content of the recipe page
   * @param url - URL of the recipe page
   * @param bestImage - Whether to enable best image selection. If undefined, uses settings.BEST_IMAGE_SELECTION
   */
  constructor(html: string, url: string, bestImage?: boolean) {
    this.pageData = html;
    this.url = url;
    this.$ = cheerio.load(html) as cheerio.CheerioAPI;
    this.opengraph = new OpenGraph(html);
    this.schema = new SchemaOrg(html);
    this.bestImageSelection = bestImage ?? settings.BEST_IMAGE_SELECTION;

    // Attach plugins as instructed in settings.PLUGINS
    // Apply plugins per-instance to avoid prototype pollution
    const methodNames = this._getMethodNames();

    for (const methodName of methodNames) {
      // Get the current method from the instance's prototype
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      let currentMethod = (Object.getPrototypeOf(this) as Record<string, unknown>)[methodName];

      // Apply plugins in reverse order (outermost plugin first)
      for (let i = settings.PLUGINS.length - 1; i >= 0; i--) {
        const plugin = settings.PLUGINS[i];
        if (plugin.shouldRun(this.host(), methodName)) {
          // biome-ignore lint/suspicious/noExplicitAny: plugin.run requires flexible method type
          currentMethod = plugin.run(currentMethod as any);
        }
      }

      // Replace the method on the instance, binding 'this' to the current instance
      (this as unknown as Record<string, unknown>)[methodName] =
        typeof currentMethod === 'function'
          ? // biome-ignore lint/complexity/noBannedTypes: Function type needed for generic method binding
            (currentMethod as Function).bind(this)
          : currentMethod;
    }
  }

  /**
   * Get all method names from the scraper instance
   * Returns only methods, not properties or constructor
   */
  private _getMethodNames(): string[] {
    const methods: string[] = [];
    const proto = Object.getPrototypeOf(this);

    // Walk up the prototype chain with safety checks
    const MAX_DEPTH = 50; // Reasonable limit for prototype chain depth
    const visited = new Set<object>(); // Track visited prototypes to detect cycles

    let current = proto;
    let depth = 0;

    while (current && current !== Object.prototype) {
      // Safety check: prevent infinite loops with maximum depth
      if (depth >= MAX_DEPTH) {
        break;
      }

      // Safety check: detect circular references
      if (visited.has(current)) {
        break;
      }
      visited.add(current);

      const names = Object.getOwnPropertyNames(current);
      for (const name of names) {
        // Skip constructor, private methods (starting with _), and duplicates
        if (name !== 'constructor' && !name.startsWith('_') && !methods.includes(name)) {
          const descriptor = Object.getOwnPropertyDescriptor(current, name);
          // Check if it's a method (function) not a getter/setter or property
          if (descriptor && typeof descriptor.value === 'function') {
            methods.push(name);
          }
        }
      }

      current = Object.getPrototypeOf(current);
      depth++;
    }

    return methods;
  }

  /**
   * Returns the host domain for this scraper
   * Must be implemented by each site-specific scraper
   */
  abstract host(): string;

  /**
   * Extracts the recipe author
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  author(): string | undefined {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts the site name
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  siteName(): string {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts the recipe title
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  title(): string {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts the recipe category
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  category(): string | undefined {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts the recipe yields/servings
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  yields(): string {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts the recipe description
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  description(): string {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts the recipe ingredients
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  ingredients(): string[] {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts the recipe instructions as a single string
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  instructions(): string {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts total time in minutes
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  totalTime(): number | null {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts cook time in minutes
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  cookTime(): number | null {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts prep time in minutes
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  prepTime(): number | null {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts recipe ratings
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  ratings(): number | null {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts ratings count
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  ratingsCount(): number | null {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts cuisine type
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  cuisine(): string {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts cooking method
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  cookingMethod(): string {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts recipe image URL
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  image(): string {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts keywords/tags
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  keywords(): string[] {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts dietary restrictions
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  dietaryRestrictions(): string[] {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts nutrition information
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  nutrients(): Record<string, string> {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts equipment needed
   * Override in subclass or will be filled by SchemaOrgFillPlugin
   */
  equipment(): string[] {
    throw new Error('This should be implemented');
  }

  /**
   * Extracts the canonical URL of the recipe
   * This implementation looks for a canonical link tag, falling back to the provided URL
   */
  canonicalUrl(): string {
    const canonicalLink = this.$('link[rel="canonical"][href]');
    if (canonicalLink.length > 0) {
      const href = canonicalLink.attr('href');
      if (href) {
        // Convert relative URLs to absolute
        try {
          const absolute = new URL(href, this.url);
          return absolute.href;
        } catch {
          return href;
        }
      }
    }
    return this.url;
  }

  /**
   * Extracts the language the recipe is written in
   * Checks html lang attribute and meta tags
   */
  language(): string {
    const candidateLanguages: string[] = [];

    // Check html lang attribute
    const htmlLang = this.$('html').attr('lang');
    if (htmlLang) {
      candidateLanguages.push(htmlLang);
    }

    // Check deprecated meta http-equiv content-language
    const metaLanguage = this.$(
      'meta[http-equiv="content-language"][content], meta[http-equiv="Content-Language"][content]'
    );
    if (metaLanguage.length > 0) {
      const content = metaLanguage.attr('content');
      if (content) {
        const language = content.split(',')[0].trim();
        if (language) {
          candidateLanguages.push(language);
        }
      }
    }

    // If multiple languages exist, remove 'en' (commonly generated by HTML editors)
    if (candidateLanguages.length > 1) {
      const filteredLanguages = candidateLanguages.filter((lang) => lang !== 'en');
      if (filteredLanguages.length > 0) {
        return filteredLanguages[0];
      }
    }

    // Return the first candidate language
    if (candidateLanguages.length > 0) {
      return candidateLanguages[0];
    }

    throw new ElementNotFoundInHtml('Could not find language.');
  }

  /**
   * Extracts recipe instructions as a list of steps
   * Splits the instructions string by newlines
   */
  instructionsList(): string[] {
    return this.instructions()
      .split('\n')
      .filter((instruction) => instruction.trim() !== '');
  }

  /**
   * Extracts ingredient groups (ingredients organized by purpose/section)
   * For now, returns a single group with all ingredients
   * TODO: Implement proper ingredient grouping logic
   */
  ingredientGroups(): IngredientGroup[] {
    return [
      {
        purpose: undefined,
        ingredients: this.ingredients(),
      },
    ];
  }

  /**
   * Extracts all links found in the recipe
   */
  links(): Array<Record<string, string>> {
    const invalidHref = new Set(['#', '']);
    const links: Array<Record<string, string>> = [];

    this.$('a[href]').each((_, element) => {
      const $link = this.$(element);
      const href = $link.attr('href');

      if (href && !invalidHref.has(href)) {
        const attrs: Record<string, string> = {};
        // Get all attributes from the element
        const elementAttrs = $link.attr();
        if (elementAttrs) {
          for (const [key, value] of Object.entries(elementAttrs)) {
            if (typeof value === 'string') {
              attrs[key] = value;
            }
          }
        }
        links.push(attrs);
      }
    });

    return links;
  }

  /**
   * Converts the recipe to JSON format
   * Calls all public methods and catches exceptions for missing data
   */
  // Type for public method names of AbstractScraper that return any value (excluding constructor and properties)
  private static readonly scraperMethodNames = [
    'host',
    'canonicalUrl',
    'language',
    'author',
    'siteName',
    'title',
    'category',
    'yields',
    'description',
    'ingredients',
    'ingredientGroups',
    'instructions',
    'instructionsList',
    'totalTime',
    'cookTime',
    'prepTime',
    'ratings',
    'ratingsCount',
    'cuisine',
    'cookingMethod',
    'image',
    'keywords',
    'dietaryRestrictions',
    'nutrients',
    'equipment',
  ] as const;

  toJson(): Partial<Recipe> {
    // Use Record<string, unknown> for type-safe dynamic property assignment
    const jsonDict: Record<string, unknown> = {};

    // List of methods to call (excluding internal methods)
    const methodsToCall: readonly string[] = AbstractScraper.scraperMethodNames;

    for (const method of methodsToCall) {
      try {
        const func = this[method as keyof this];
        if (typeof func === 'function') {
          const result = (func as () => unknown).call(this);

          // Map method names to Recipe field names
          const fieldName = this.mapMethodToField(method as keyof AbstractScraper);
          jsonDict[fieldName] = result;
        }
      } catch (_error) {
        // Skip fields that throw exceptions (data not available)
      }
    }

    // Safe to cast since we control the method names and field mappings
    return jsonDict as Partial<Recipe>;
  }

  /**
   * Maps method names to Recipe field names
   * Handles camelCase conversion
   */
  private mapMethodToField(method: keyof AbstractScraper): string {
    // Convert method names to match Recipe interface
    const mapping: Record<string, string> = {
      siteName: 'site_name',
      canonicalUrl: 'canonical_url',
      ingredientGroups: 'ingredient_groups',
      instructionsList: 'instructions_list',
      totalTime: 'total_time',
      cookTime: 'cook_time',
      prepTime: 'prep_time',
      ratingsCount: 'ratings_count',
      cookingMethod: 'cooking_method',
      dietaryRestrictions: 'dietary_restrictions',
    };

    return mapping[method] || method;
  }
}
