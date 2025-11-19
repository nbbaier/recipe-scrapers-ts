/**
 * Factory Pattern for Recipe Scrapers
 *
 * Provides scraper selection and instantiation based on URL domain.
 */

import {
	NoSchemaFoundInWildMode,
	WebsiteNotImplementedError,
} from "./exceptions";
import { AbstractScraper } from "./scrapers/abstract";
import { getHostName } from "./utils/url";

/**
 * Generic Schema.org-based scraper for wild mode (unsupported domains)
 */
export class SchemaScraper extends AbstractScraper {
	override host(): string {
		return getHostName(this.url);
	}

	override siteName(): string {
		return this.schema.siteName();
	}

	override title(): string {
		return this.schema.title();
	}

	override category(): string | undefined {
		return this.schema.category() ?? undefined;
	}

	override totalTime(): number | null {
		return this.schema.totalTime();
	}

	override cookTime(): number | null {
		return this.schema.cookTime();
	}

	override prepTime(): number | null {
		return this.schema.prepTime();
	}

	override yields(): string {
		return this.schema.yields() ?? "";
	}

	override image(): string {
		return this.schema.image() ?? "";
	}

	override ingredients(): string[] {
		return this.schema.ingredients();
	}

	override instructions(): string {
		return this.schema.instructions();
	}

	override ratings(): number | null {
		return this.schema.ratings();
	}

	override ratingsCount(): number | null {
		return this.schema.ratingsCount();
	}

	override author(): string | undefined {
		return this.schema.author() ?? undefined;
	}

	override cuisine(): string {
		return this.schema.cuisine() ?? "";
	}

	override description(): string {
		return this.schema.description() ?? "";
	}

	override cookingMethod(): string {
		return this.schema.cookingMethod() ?? "";
	}

	override keywords(): string[] {
		return this.schema.keywords() ?? [];
	}

	override dietaryRestrictions(): string[] {
		return this.schema.dietaryRestrictions() ?? [];
	}

	override equipment(): string[] {
		// Equipment is not available in Schema.org parser yet
		return [];
	}

	override nutrients(): Record<string, string> {
		return this.schema.nutrients();
	}
}

/**
 * Type for scraper constructor
 */
export type ScraperConstructor = new (
	html: string,
	url: string,
	bestImage?: boolean,
) => AbstractScraper;

/**
 * Registry of all supported scrapers
 * Maps hostname to scraper class
 */
export const SCRAPERS: Record<string, ScraperConstructor> = {};

// Import site-specific scrapers
import {
	AllRecipesScraper,
	AllTheHealthyThingsScraper,
	AmbitiousKitchenScraper,
	AmericasTestKitchenScraper,
	AverieCooksScraper,
	BakerByNatureScraper,
	BBCGoodFoodScraper,
	BellyFullScraper,
	BettyCrockerScraper,
	BonAppetitScraper,
	BudgetBytesScraper,
	CafeDelitesScraper,
	ClosetCookingScraper,
	CookieAndKateScraper,
	CookingLightScraper,
	CountryLivingScraper,
	CulinaryHillScraper,
	DamnDeliciousScraper,
	DelishScraper,
	DinnerAtTheZooScraper,
	DinnerThenDessertScraper,
	EatingBirdFoodScraper,
	EatingWellScraper,
	EpicuriousScraper,
	FeastingAtHomeScraper,
	FifteenSpatulasScraper,
	Food52Scraper,
	FoodAndWineScraper,
	FoodNetworkScraper,
	GimmeSomeOvenScraper,
	HalfBakedHarvestScraper,
	JamieOliverScraper,
	JoshuaWeissmanScraper,
	JustATasteScraper,
	JustBentoScraper,
	MarthaStewartScraper,
	MinimalistbakerScraper,
	MyBakingAddictionScraper,
	PinchOfYumScraper,
	RecipeTinEatsScraper,
	SallysBakingAddictionScraper,
	SeriousEatsScraper,
	SimplyRecipesScraper,
	SkinnyTasteScraper,
	SouthernLivingScraper,
	TasteOfHomeScraper,
	TastyScraper,
	TheKitchnScraper,
	ThePioneerWomanScraper,
	TheRecipeCriticScraper,
} from "./scrapers/sites";

// Register all site-specific scrapers
registerScraper("allrecipes.com", AllRecipesScraper);
registerScraper("allthehealthythings.com", AllTheHealthyThingsScraper);
registerScraper("ambitiouskitchen.com", AmbitiousKitchenScraper);
registerScraper("americastestkitchen.com", AmericasTestKitchenScraper);
registerScraper("averiecooks.com", AverieCooksScraper);
registerScraper("bakerbynature.com", BakerByNatureScraper);
registerScraper("bbcgoodfood.com", BBCGoodFoodScraper);
registerScraper("bellyfull.net", BellyFullScraper);
registerScraper("bettycrocker.com", BettyCrockerScraper);
registerScraper("bonappetit.com", BonAppetitScraper);
registerScraper("budgetbytes.com", BudgetBytesScraper);
registerScraper("cafedelites.com", CafeDelitesScraper);
registerScraper("closetcooking.com", ClosetCookingScraper);
registerScraper("cookieandkate.com", CookieAndKateScraper);
registerScraper("cookinglight.com", CookingLightScraper);
registerScraper("countryliving.com", CountryLivingScraper);
registerScraper("culinaryhill.com", CulinaryHillScraper);
registerScraper("damndelicious.net", DamnDeliciousScraper);
registerScraper("delish.com", DelishScraper);
registerScraper("dinneratthezoo.com", DinnerAtTheZooScraper);
registerScraper("dinnerthendessert.com", DinnerThenDessertScraper);
registerScraper("eatingbirdfood.com", EatingBirdFoodScraper);
registerScraper("eatingwell.com", EatingWellScraper);
registerScraper("epicurious.com", EpicuriousScraper);
registerScraper("feastingathome.com", FeastingAtHomeScraper);
registerScraper("fifteenspatulas.com", FifteenSpatulasScraper);
registerScraper("food52.com", Food52Scraper);
registerScraper("foodandwine.com", FoodAndWineScraper);
registerScraper("foodnetwork.co.uk", FoodNetworkScraper);
registerScraper("gimmesomeoven.com", GimmeSomeOvenScraper);
registerScraper("halfbakedharvest.com", HalfBakedHarvestScraper);
registerScraper("jamieoliver.com", JamieOliverScraper);
registerScraper("joshuaweissman.com", JoshuaWeissmanScraper);
registerScraper("justataste.com", JustATasteScraper);
registerScraper("justbento.com", JustBentoScraper);
registerScraper("marthastewart.com", MarthaStewartScraper);
registerScraper("minimalistbaker.com", MinimalistbakerScraper);
registerScraper("mybakingaddiction.com", MyBakingAddictionScraper);
registerScraper("pinchofyum.com", PinchOfYumScraper);
registerScraper("recipetineats.com", RecipeTinEatsScraper);
registerScraper("sallysbakingaddiction.com", SallysBakingAddictionScraper);
registerScraper("seriouseats.com", SeriousEatsScraper);
registerScraper("simplyrecipes.com", SimplyRecipesScraper);
registerScraper("skinnytaste.com", SkinnyTasteScraper);
registerScraper("southernliving.com", SouthernLivingScraper);
registerScraper("tasteofhome.com", TasteOfHomeScraper);
registerScraper("tasty.co", TastyScraper);
registerScraper("thekitchn.com", TheKitchnScraper);
registerScraper("thepioneerwoman.com", ThePioneerWomanScraper);
registerScraper("therecipecritic.com", TheRecipeCriticScraper);


/**
 * Options for scrapeHtml function
 */
export interface ScrapeOptions {
	/** Whether to restrict to supported domains only (default: true) */
	supportedOnly?: boolean;
	/** Whether to enable best image selection (default: from settings) */
	bestImage?: boolean;
}

/**
 * Main entry point for scraping recipes from HTML
 *
 * @param html - HTML content of the recipe page
 * @param url - URL of the recipe
 * @param options - Scraping options
 * @returns Scraper instance for the recipe
 *
 * @throws {WebsiteNotImplementedError} When domain is not supported and supportedOnly is true
 * @throws {NoSchemaFoundInWildMode} When domain is not supported and no Schema.org data found
 */
export function scrapeHtml(
	html: string,
	url: string,
	options: ScrapeOptions = {},
): AbstractScraper {
	const { supportedOnly = true, bestImage } = options;

	const hostName = getHostName(url);

	// Check if we have a specific scraper for this domain
	const ScraperClass = SCRAPERS[hostName];
	if (ScraperClass) {
		return new ScraperClass(html, url, bestImage);
	}

	// Domain not supported
	if (supportedOnly) {
		const message = `The website '${hostName}' isn't currently supported by recipe-scrapers!
---
If you have time to help us out, please report this as a feature
request on our bugtracker.`;
		throw new WebsiteNotImplementedError(message);
	}

	// Wild mode: try generic Schema.org scraping
	const schemaScraper = new SchemaScraper(html, url, bestImage);
	if (schemaScraper.hasSchema()) {
		return schemaScraper;
	}

	throw new NoSchemaFoundInWildMode(`No Schema.org data found at URL: ${url}`);
}

/**
 * Register a scraper class for a specific domain
 *
 * @param hostname - Domain name (e.g., 'allrecipes.com')
 * @param scraperClass - Scraper class to use for this domain
 */
export function registerScraper(
	hostname: string,
	scraperClass: ScraperConstructor,
): void {
	SCRAPERS[hostname] = scraperClass;
}

/**
 * Get list of all supported domains
 *
 * @returns Array of supported domain names
 */
export function getSupportedUrls(): string[] {
	return Object.keys(SCRAPERS).sort();
}

/**
 * Check if a URL is supported
 *
 * @param url - URL to check
 * @returns True if the domain is supported
 */
export function isSupported(url: string): boolean {
	const hostName = getHostName(url);
	return hostName in SCRAPERS;
}
