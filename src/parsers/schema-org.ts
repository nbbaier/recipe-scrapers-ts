/**
 * Schema.org parser for extracting recipe data from JSON-LD structured data
 *
 * This parser extracts recipe information from Schema.org markup embedded in HTML.
 * Currently supports JSON-LD format (covers 90%+ of recipe sites).
 * Microdata and RDFa support can be added in the future.
 */

import * as cheerio from "cheerio";
import { SchemaOrgException } from "../exceptions";
import {
	csvToTags,
	formatDietName,
	getMinutes,
	getYields,
	normalizeString,
} from "../utils";

const SCHEMA_ORG_HOST = "schema.org";

/**
 * Represents a Schema.org entity (Recipe, Person, WebSite, etc.)
 */
interface SchemaEntity {
	"@type"?: string | string[];
	"@id"?: string;
	"@context"?: string;
	"@graph"?: SchemaEntity[] | SchemaEntity;

	// biome-ignore lint/suspicious/noExplicitAny: Schema.org entities can have arbitrary properties
	[key: string]: any;
}

/**
 * Represents a HowToStep schema item
 */
interface HowToStep {
	"@type": "HowToStep";
	name?: string;
	text?: string;
	itemListElement?: HowToStep;
}

/**
 * Represents a HowToSection schema item
 */
interface HowToSection {
	"@type": "HowToSection";
	name?: string;
	Name?: string;
	itemListElement?: HowToSchemaItem[];
}

/**
 * Union type for instruction schema items
 */
type HowToSchemaItem = string | HowToStep | HowToSection;

/**
 * Schema.org parser for recipe data
 */
export class SchemaOrg {
	// private format: string | null = null;  // Reserved for future use (microdata/RDFa)
	private data: SchemaEntity = {};
	private people: Record<string, SchemaEntity> = {};
	private ratingsData: Record<string, SchemaEntity> = {};
	private websiteName: string | null = null;

	/**
	 * Creates a new Schema.org parser instance
	 *
	 * @param pageData - HTML content of the page
	 */
	constructor(pageData: string) {
		this.extractData(pageData);
	}

	/**
	 * Extracts Schema.org data from HTML
	 */
	private extractData(pageData: string): void {
		const $ = cheerio.load(pageData);
		const jsonLdScripts: SchemaEntity[] = [];

		// Extract all JSON-LD scripts
		$('script[type="application/ld+json"]').each((_, element) => {
			try {
				const content = $(element).html();
				if (content) {
					const parsed = JSON.parse(content);
					// Handle both array and object formats
					if (Array.isArray(parsed)) {
						jsonLdScripts.push(...parsed);
					} else {
						jsonLdScripts.push(parsed);
					}
				}
			} catch (_error) {
				// Skip invalid JSON
			}
		});

		// Extract website name
		for (const item of jsonLdScripts) {
			const website = this.findEntity(item, "WebSite");
			if (website?.name) {
				this.websiteName = website.name;
			}
		}

		// Extract person references
		for (const item of jsonLdScripts) {
			const person = this.findEntity(item, "Person");
			if (person) {
				const key = person["@id"] || person.url;
				if (key) {
					this.people[key] = person;
				}
			}
		}

		// Extract ratings data
		for (const item of jsonLdScripts) {
			const rating = this.findEntity(item, "AggregateRating");
			if (rating?.["@id"]) {
				this.ratingsData[rating["@id"]] = rating;
			}
		}

		// Find and extract recipe data
		for (const item of jsonLdScripts) {
			const context = item["@context"];
			if (typeof context === "string" && !context.includes(SCHEMA_ORG_HOST)) {
				continue;
			}

			let recipe: SchemaEntity | undefined;

			// Check if the item itself is a recipe
			if (this.containsSchemaType(item, "Recipe")) {
				recipe = item;
			}
			// Check if item is a WebPage with mainEntity that's a recipe
			else if (this.containsSchemaType(item, "WebPage") && item.mainEntity) {
				recipe = item.mainEntity;
			}
			// Search in @graph
			else {
				recipe = this.findEntity(item, "Recipe");
			}

			if (recipe && this.containsSchemaType(recipe, "Recipe")) {
				// Merge recipe data (first found wins for each field)
				if (Object.keys(this.data).length === 0) {
					this.data = recipe;
					// this.format = 'json-ld';  // Reserved for future use
				} else {
					// Update with new fields, but don't overwrite existing ones
					for (const [key, value] of Object.entries(recipe)) {
						if (!(key in this.data)) {
							this.data[key] = value;
						}
					}
				}
			}
		}
	}

	/**
	 * Checks if an entity contains a specific schema type
	 */
	private containsSchemaType(item: SchemaEntity, schemaType: string): boolean {
		const itemType = item["@type"];
		if (!itemType) {
			return false;
		}

		const types = Array.isArray(itemType) ? itemType : [itemType];
		return types.some((type) =>
			type.toLowerCase().includes(schemaType.toLowerCase()),
		);
	}

	/**
	 * Finds an entity of a specific type in the schema data
	 */
	private findEntity(
		item: SchemaEntity,
		schemaType: string,
	): SchemaEntity | undefined {
		// Check if the item itself matches
		if (this.containsSchemaType(item, schemaType)) {
			return item;
		}

		// Search in @graph
		const graph = item["@graph"];
		if (graph) {
			const nodes = Array.isArray(graph) ? graph : [graph];
			for (const node of nodes) {
				if (typeof node === "object" && node !== null) {
					if (this.containsSchemaType(node, schemaType)) {
						return node;
					}
				}
			}
		}

		return undefined;
	}

	/**
	 * Extracts site name from Schema.org data
	 */
	siteName(): string {
		if (!this.websiteName) {
			throw new SchemaOrgException("Site name not found in SchemaOrg");
		}
		return normalizeString(this.websiteName);
	}

	/**
	 * Extracts language from Schema.org data
	 */
	language(): string | undefined {
		return this.data.inLanguage || this.data.language;
	}

	/**
	 * Extracts recipe title
	 */
	title(): string {
		return normalizeString(this.data.name || "");
	}

	/**
	 * Extracts recipe category
	 */
	category(): string | undefined {
		const category = this.data.recipeCategory;
		if (Array.isArray(category)) {
			return category.map((c) => normalizeString(c)).join(",");
		}
		if (category) {
			return normalizeString(category);
		}
		return undefined;
	}

	/**
	 * Extracts recipe author
	 */
	author(): string | undefined {
		let author = this.data.author || this.data.Author;

		// Handle array of authors
		if (Array.isArray(author) && author.length > 0) {
			author = author[0];
		}

		// Resolve author reference
		if (typeof author === "object" && author !== null) {
			const authorKey = author["@id"] || author.url;
			if (authorKey && this.people[authorKey]) {
				author = this.people[authorKey];
			}
		}

		// Extract name from author object
		if (typeof author === "object" && author !== null) {
			author = author.name;
		}

		if (typeof author === "string") {
			return author.trim();
		}

		return undefined;
	}

	/**
	 * Reads a duration field and converts it to minutes
	 */
	private readDurationField(key: string): number | null {
		const value = this.data[key];
		if (value === undefined || value === null) {
			return null;
		}

		if (typeof value === "string") {
			return getMinutes(value);
		}

		// Handle QuantitativeValue with maxValue
		if (typeof value === "object" && value.maxValue) {
			return getMinutes(value.maxValue);
		}

		return null;
	}

	/**
	 * Extracts total cooking time in minutes
	 */
	totalTime(): number | null {
		const hasTimeData =
			"totalTime" in this.data ||
			"prepTime" in this.data ||
			"cookTime" in this.data;

		if (!hasTimeData) {
			throw new SchemaOrgException(
				"Cooking time information not found in SchemaOrg",
			);
		}

		const totalTime = this.readDurationField("totalTime");
		if (totalTime) {
			return totalTime;
		}

		const prepTime = this.readDurationField("prepTime") || 0;
		const cookTime = this.readDurationField("cookTime") || 0;
		if (prepTime || cookTime) {
			return prepTime + cookTime;
		}

		return null;
	}

	/**
	 * Extracts cook time in minutes
	 */
	cookTime(): number | null {
		if (!("cookTime" in this.data)) {
			throw new SchemaOrgException(
				"Cooktime information not found in SchemaOrg",
			);
		}
		return this.readDurationField("cookTime");
	}

	/**
	 * Extracts prep time in minutes
	 */
	prepTime(): number | null {
		if (!("prepTime" in this.data)) {
			throw new SchemaOrgException(
				"Preptime information not found in SchemaOrg",
			);
		}
		return this.readDurationField("prepTime");
	}

	/**
	 * Extracts recipe yield/servings
	 */
	yields(): string {
		const hasYieldData = "recipeYield" in this.data || "yield" in this.data;
		if (!hasYieldData) {
			throw new SchemaOrgException(
				"Servings information not found in SchemaOrg",
			);
		}

		let yieldData = this.data.recipeYield || this.data.yield;

		// Handle array of yields
		if (Array.isArray(yieldData)) {
			yieldData = yieldData[0];
		}

		if (yieldData) {
			return getYields(String(yieldData));
		}

		throw new SchemaOrgException("Servings information not found in SchemaOrg");
	}

	/**
	 * Extracts recipe image URL
	 */
	image(): string {
		let image = this.data.image;

		if (!image) {
			throw new SchemaOrgException("Image not found in SchemaOrg");
		}

		// Handle array of images
		if (Array.isArray(image)) {
			image = image[0];
		}

		// Handle image object with url property
		if (typeof image === "object" && image !== null) {
			image = image.url;
		}

		// Check if it's an absolute URL
		if (
			typeof image === "string" &&
			!(
				image.startsWith("http://") ||
				image.startsWith("https://") ||
				image.startsWith("//")
			)
		) {
			// Relative URLs are not supported; return empty string
			return "";
		}

		return typeof image === "string" ? image : "";
	}

	/**
	 * Extracts recipe ingredients
	 */
	ingredients(): string[] {
		let ingredients = this.data.recipeIngredient || this.data.ingredients || [];

		// Flatten nested arrays
		if (Array.isArray(ingredients) && Array.isArray(ingredients[0])) {
			ingredients = ingredients.flat();
		}

		// Handle single string ingredient
		if (typeof ingredients === "string") {
			ingredients = [ingredients];
		}

		if (!Array.isArray(ingredients)) {
			return [];
		}

		return ingredients
			.filter((ing) => ing)
			.map((ing) => normalizeString(String(ing)));
	}

	/**
	 * Extracts nutrition information
	 */
	nutrients(): Record<string, string> {
		const nutrition = this.data.nutrition || {};
		const cleanedNutrients: Record<string, string> = {};

		for (const [key, value] of Object.entries(nutrition)) {
			if (!key || !value) {
				continue;
			}
			if (key.startsWith("@") || key === "type") {
				continue;
			}
			cleanedNutrients[key] = String(value);
		}

		// Normalize keys and values
		const result: Record<string, string> = {};
		for (const [key, value] of Object.entries(cleanedNutrients)) {
			result[normalizeString(key)] = normalizeString(value);
		}

		return result;
	}

	/**
	 * Extracts text from HowTo instruction items
	 */
	private extractHowToInstructionsText(schemaItem: HowToSchemaItem): string[] {
		const instructionsGist: string[] = [];

		if (typeof schemaItem === "string") {
			instructionsGist.push(schemaItem);
		} else if (schemaItem?.["@type"] === "HowToStep") {
			// Add name if it's different from text
			if (schemaItem.name) {
				const text = schemaItem.text || "";
				const name = schemaItem.name.replace(/\.$/, "");
				if (!text.startsWith(name)) {
					instructionsGist.push(schemaItem.name);
				}
			}

			// Handle nested itemListElement
			if (schemaItem.itemListElement?.text) {
				instructionsGist.push(schemaItem.itemListElement.text);
			} else if (schemaItem.text) {
				instructionsGist.push(schemaItem.text);
			}
		} else if (schemaItem?.["@type"] === "HowToSection") {
			// Add section name
			const sectionName = schemaItem.name || schemaItem.Name;
			if (sectionName) {
				instructionsGist.push(sectionName);
			}

			// Process items in the section
			const items = schemaItem.itemListElement || [];
			for (const item of items) {
				instructionsGist.push(...this.extractHowToInstructionsText(item));
			}
		}

		return instructionsGist;
	}

	/**
	 * Extracts recipe instructions
	 */
	instructions(): string {
		let instructions =
			this.data.recipeInstructions || this.data.RecipeInstructions || "";

		// Flatten nested arrays
		if (Array.isArray(instructions) && Array.isArray(instructions[0])) {
			const allAreLists = instructions.every((item) => Array.isArray(item));
			if (allAreLists) {
				instructions = instructions.flat();
			}
		}

		// Handle dict with itemListElement
		if (
			typeof instructions === "object" &&
			!Array.isArray(instructions) &&
			instructions !== null
		) {
			instructions = instructions.itemListElement;
		}

		// Process array of instruction items
		if (Array.isArray(instructions)) {
			const instructionsGist: string[] = [];
			for (const item of instructions) {
				instructionsGist.push(...this.extractHowToInstructionsText(item));
			}
			return instructionsGist
				.map((instruction) => normalizeString(instruction))
				.join("\n");
		}

		return typeof instructions === "string" ? instructions : "";
	}

	/**
	 * Extracts recipe rating
	 */
	ratings(): number {
		let ratings =
			this.data.aggregateRating ||
			this.findEntity(this.data, "AggregateRating");

		// Resolve rating reference
		if (ratings && typeof ratings === "object") {
			const ratingId = ratings["@id"];
			if (ratingId && this.ratingsData[ratingId]) {
				ratings = this.ratingsData[ratingId];
			}
		}

		// Extract rating value
		if (ratings && typeof ratings === "object") {
			ratings = ratings.ratingValue;
		}

		if (ratings !== undefined && ratings !== null) {
			return Math.round(parseFloat(String(ratings)) * 100) / 100;
		}

		throw new SchemaOrgException("No ratingValue in SchemaOrg.");
	}

	/**
	 * Extracts recipe ratings count
	 */
	ratingsCount(): number | null {
		let ratings =
			this.data.aggregateRating ||
			this.findEntity(this.data, "AggregateRating");

		// Resolve rating reference
		if (ratings && typeof ratings === "object") {
			const ratingId = ratings["@id"];
			if (ratingId && this.ratingsData[ratingId]) {
				ratings = this.ratingsData[ratingId];
			}

			const count = ratings.ratingCount || ratings.reviewCount;
			if (count !== undefined && count !== null) {
				const countNum = parseInt(String(count), 10);
				return countNum !== 0 ? countNum : null;
			}
		}

		throw new SchemaOrgException("No ratingCount in SchemaOrg.");
	}

	/**
	 * Extracts recipe cuisine
	 */
	cuisine(): string {
		const cuisine = this.data.recipeCuisine;
		if (cuisine === undefined || cuisine === null) {
			throw new SchemaOrgException("No cuisine data in SchemaOrg.");
		}
		if (Array.isArray(cuisine)) {
			return cuisine.join(",");
		}
		return String(cuisine);
	}

	/**
	 * Extracts recipe description
	 */
	description(): string {
		let description = this.data.description;
		if (description === undefined || description === null) {
			throw new SchemaOrgException("No description data in SchemaOrg.");
		}
		if (Array.isArray(description)) {
			description = description[0];
		}
		return normalizeString(String(description));
	}

	/**
	 * Extracts cooking method
	 */
	cookingMethod(): string {
		let cookingMethod = this.data.cookingMethod;
		if (cookingMethod === undefined || cookingMethod === null) {
			throw new SchemaOrgException("No cooking method data in SchemaOrg");
		}
		if (Array.isArray(cookingMethod)) {
			cookingMethod = cookingMethod[0];
		}
		return normalizeString(String(cookingMethod));
	}

	/**
	 * Extracts recipe keywords as tags
	 */
	keywords(): string[] {
		let keywords = this.data.keywords;
		if (keywords === undefined || keywords === null) {
			throw new SchemaOrgException("No keywords data in SchemaOrg");
		}

		if (Array.isArray(keywords)) {
			const normalized = keywords.map((k) => normalizeString(String(k)));
			keywords = normalized.join(", ");
		} else {
			keywords = normalizeString(String(keywords));
		}

		return csvToTags(keywords);
	}

	/**
	 * Extracts dietary restrictions
	 */
	dietaryRestrictions(): string[] {
		let dietaryRestrictions = this.data.suitableForDiet;
		if (dietaryRestrictions === undefined || dietaryRestrictions === null) {
			throw new SchemaOrgException(
				"No dietary restrictions data in SchemaOrg.",
			);
		}

		if (!Array.isArray(dietaryRestrictions)) {
			dietaryRestrictions = [dietaryRestrictions];
		}

		const formattedDiets = dietaryRestrictions
			.map((diet: unknown) => formatDietName(String(diet)))
			.filter((diet: string | null): diet is string => diet !== null);

		const joined = formattedDiets.join(", ");
		return csvToTags(joined);
	}

	/**
	 * Returns the raw Schema.org data
	 * Useful for accessing custom or non-standard fields
	 *
	 * @returns The raw schema data object
	 */
	getRawData(): SchemaEntity {
		return this.data;
	}
}
