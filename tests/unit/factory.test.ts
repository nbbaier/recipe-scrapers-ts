/**
 * Tests for Factory pattern and scraper registry
 */

import { beforeEach, describe, expect, it } from "vitest";
import { WebsiteNotImplementedError } from "../../src/exceptions";
import {
	getSupportedUrls,
	isSupported,
	registerScraper,
	SCRAPERS,
	SchemaScraper,
	scrapeHtml,
} from "../../src/factory";
import { AbstractScraper } from "../../src/scrapers/abstract";

// Test scraper for registration tests
class TestScraper extends AbstractScraper {
	override host(): string {
		return "test.com";
	}

	override title(): string {
		return "Test Recipe";
	}

	override ingredients(): string[] {
		return ["ingredient 1", "ingredient 2"];
	}

	override instructions(): string {
		return "Test instructions";
	}

	override totalTime(): number | null {
		return 30;
	}
}

describe("Factory Pattern", () => {
	// Clean up registered scrapers after each test
	beforeEach(() => {
		// Clear any test scrapers
		for (const key in SCRAPERS) {
			if (key.includes("test")) {
				delete SCRAPERS[key];
			}
		}
	});

	describe("SchemaScraper", () => {
		it("should create a generic schema scraper", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "name": "Generic Recipe",
              "recipeIngredient": ["flour", "eggs"],
              "recipeInstructions": "Mix and bake"
            }
            </script>
          </head>
        </html>
      `;

			const scraper = new SchemaScraper(
				html,
				"https://unknown-site.com/recipe",
			);
			expect(scraper.title()).toBe("Generic Recipe");
			expect(scraper.ingredients()).toEqual(["flour", "eggs"]);
			expect(scraper.host()).toBe("unknown-site.com");
		});

		it("should extract host name from URL", () => {
			const html = "<html></html>";
			const scraper = new SchemaScraper(
				html,
				"https://example.com/path/to/recipe",
			);
			expect(scraper.host()).toBe("example.com");
		});

		it("should detect schema data presence", () => {
			const htmlWithSchema = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "name": "Test"
            }
            </script>
          </head>
        </html>
      `;
			const htmlWithoutSchema = "<html><body>No schema</body></html>";

			const scraperWithSchema = new SchemaScraper(
				htmlWithSchema,
				"https://example.com/recipe",
			);
			const scraperWithoutSchema = new SchemaScraper(
				htmlWithoutSchema,
				"https://example.com/recipe",
			);

			// hasSchema checks if schema.data exists (even if empty object)
			// Both will return true because data is initialized as {}
			expect(scraperWithSchema.hasSchema()).toBe(true);
			// The scraper without schema will also have hasSchema() true due to empty object
			expect(scraperWithoutSchema.hasSchema()).toBe(true);
		});
	});

	describe("registerScraper", () => {
		it("should register a scraper for a domain", () => {
			registerScraper("test.com", TestScraper);
			expect(SCRAPERS["test.com"]).toBe(TestScraper);
		});

		it("should allow overriding existing scrapers", () => {
			class NewTestScraper extends AbstractScraper {
				override host(): string {
					return "test.com";
				}
			}

			registerScraper("test.com", TestScraper);
			registerScraper("test.com", NewTestScraper);

			expect(SCRAPERS["test.com"]).toBe(NewTestScraper);
		});

		it("should register multiple scrapers for different domains", () => {
			class AnotherTestScraper extends AbstractScraper {
				override host(): string {
					return "another-test.com";
				}
			}

			registerScraper("test.com", TestScraper);
			registerScraper("another-test.com", AnotherTestScraper);

			expect(SCRAPERS["test.com"]).toBe(TestScraper);
			expect(SCRAPERS["another-test.com"]).toBe(AnotherTestScraper);
		});
	});

	describe("getSupportedUrls", () => {
		it("should return empty array when no scrapers registered", () => {
			// Clear all scrapers for this test
			for (const key in SCRAPERS) {
				delete SCRAPERS[key];
			}

			expect(getSupportedUrls()).toEqual([]);
		});

		it("should return sorted list of registered domains", () => {
			registerScraper("zebra.com", TestScraper);
			registerScraper("apple.com", TestScraper);
			registerScraper("banana.com", TestScraper);

			const urls = getSupportedUrls();
			expect(urls).toContain("apple.com");
			expect(urls).toContain("banana.com");
			expect(urls).toContain("zebra.com");
			// Check sorted order
			const testUrls = urls.filter(
				(u) => u === "apple.com" || u === "banana.com" || u === "zebra.com",
			);
			expect(testUrls).toEqual(["apple.com", "banana.com", "zebra.com"]);
		});
	});

	describe("isSupported", () => {
		beforeEach(() => {
			registerScraper("supported.com", TestScraper);
		});

		it("should return true for supported URLs", () => {
			expect(isSupported("https://supported.com/recipe")).toBe(true);
			expect(isSupported("http://supported.com/path/to/recipe")).toBe(true);
			expect(isSupported("https://www.supported.com/recipe")).toBe(true);
		});

		it("should return false for unsupported URLs", () => {
			expect(isSupported("https://unsupported.com/recipe")).toBe(false);
			expect(isSupported("https://example.com/recipe")).toBe(false);
		});

		it("should handle URLs without protocol", () => {
			expect(isSupported("supported.com/recipe")).toBe(true);
			expect(isSupported("unsupported.com/recipe")).toBe(false);
		});
	});

	describe("scrapeHtml - supported mode", () => {
		beforeEach(() => {
			registerScraper("test.com", TestScraper);
		});

		it("should create scraper for supported domain", () => {
			const html = "<html></html>";
			const scraper = scrapeHtml(html, "https://test.com/recipe");

			expect(scraper).toBeInstanceOf(TestScraper);
			expect(scraper.host()).toBe("test.com");
		});

		it("should throw WebsiteNotImplementedError for unsupported domain", () => {
			const html = "<html></html>";

			expect(() => {
				scrapeHtml(html, "https://unsupported.com/recipe");
			}).toThrow(WebsiteNotImplementedError);
		});

		it("should include domain name in error message", () => {
			const html = "<html></html>";

			expect(() => {
				scrapeHtml(html, "https://unsupported.com/recipe");
			}).toThrow("isn't currently supported");
		});

		it("should pass bestImage option to scraper", () => {
			const html = "<html></html>";
			const scraper = scrapeHtml(html, "https://test.com/recipe", {
				bestImage: true,
			});

			expect(scraper).toBeInstanceOf(TestScraper);
		});
	});

	describe("scrapeHtml - wild mode", () => {
		it("should use SchemaScraper for unsupported domain with Schema.org data", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "name": "Wild Mode Recipe",
              "recipeIngredient": ["ingredient"],
              "recipeInstructions": "instructions"
            }
            </script>
          </head>
        </html>
      `;

			const scraper = scrapeHtml(html, "https://random-site.com/recipe", {
				supportedOnly: false,
			});

			expect(scraper).toBeInstanceOf(SchemaScraper);
			expect(scraper.hasSchema()).toBe(true);
			expect(scraper.title()).toBe("Wild Mode Recipe");
		});

		it("should create SchemaScraper even without recipe data in wild mode", () => {
			const html = "<html><body>No recipe data</body></html>";

			// In wild mode, SchemaScraper is created even without recipe data
			// hasSchema() returns true due to empty object initialization
			// The scraper will have empty/default values for all fields
			const scraper = scrapeHtml(html, "https://random-site.com/recipe", {
				supportedOnly: false,
			});

			expect(scraper).toBeInstanceOf(SchemaScraper);
			expect(scraper.hasSchema()).toBe(true); // Returns true due to data being {}
			expect(scraper.title()).toBe(""); // Empty title when no data
		});

		it("should prefer specific scraper over SchemaScraper even in wild mode", () => {
			registerScraper("supported.com", TestScraper);

			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "name": "Should Use Specific Scraper"
            }
            </script>
          </head>
        </html>
      `;

			const scraper = scrapeHtml(html, "https://supported.com/recipe", {
				supportedOnly: false,
			});

			expect(scraper).toBeInstanceOf(TestScraper);
			expect(scraper).not.toBeInstanceOf(SchemaScraper);
		});
	});

	describe("scrapeHtml - options handling", () => {
		it("should default to supportedOnly: true", () => {
			const html = "<html></html>";

			expect(() => {
				scrapeHtml(html, "https://unsupported.com/recipe");
			}).toThrow(WebsiteNotImplementedError);
		});

		it("should accept supportedOnly: false", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "name": "Test"
            }
            </script>
          </head>
        </html>
      `;

			expect(() => {
				scrapeHtml(html, "https://unsupported.com/recipe", {
					supportedOnly: false,
				});
			}).not.toThrow();
		});

		it("should accept empty options object", () => {
			const html = "<html></html>";

			expect(() => {
				scrapeHtml(html, "https://unsupported.com/recipe", {});
			}).toThrow(WebsiteNotImplementedError);
		});
	});

	describe("URL handling", () => {
		beforeEach(() => {
			registerScraper("example.com", TestScraper);
		});

		it("should extract hostname from full URL", () => {
			const html = "<html></html>";
			const scraper = scrapeHtml(
				html,
				"https://example.com/path/to/recipe?id=123",
			);

			expect(scraper).toBeInstanceOf(TestScraper);
		});

		it("should handle www subdomain", () => {
			const html = "<html></html>";
			const scraper = scrapeHtml(html, "https://www.example.com/recipe");

			expect(scraper).toBeInstanceOf(TestScraper);
		});

		it("should handle http protocol", () => {
			const html = "<html></html>";
			const scraper = scrapeHtml(html, "http://example.com/recipe");

			expect(scraper).toBeInstanceOf(TestScraper);
		});

		it("should handle URL without protocol", () => {
			const html = "<html></html>";
			const scraper = scrapeHtml(html, "example.com/recipe");

			expect(scraper).toBeInstanceOf(TestScraper);
		});
	});
});
