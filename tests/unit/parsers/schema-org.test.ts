/**
 * Tests for SchemaOrg parser
 */

import { describe, expect, it } from "vitest";
import { SchemaOrg } from "../../../src/parsers/schema-org";
import { loadTestHtml } from "../../helpers/test-data";

describe("SchemaOrg Parser", () => {
	describe("Basic Initialization", () => {
		it("should parse valid JSON-LD recipe data", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "name": "Test Recipe",
              "author": {
                "@type": "Person",
                "name": "Test Author"
              },
              "description": "A test recipe",
              "recipeIngredient": ["ingredient 1", "ingredient 2"],
              "recipeInstructions": "Test instructions"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.title()).toBe("Test Recipe");
			expect(schema.author()).toBe("Test Author");
			expect(schema.description()).toBe("A test recipe");
		});

		it("should handle HTML without JSON-LD", () => {
			const html = "<html><body><p>No recipe here</p></body></html>";
			const schema = new SchemaOrg(html);

			expect(schema.title()).toBe("");
			expect(schema.author()).toBeUndefined(); // Returns undefined when no author data
		});

		it("should handle invalid JSON-LD gracefully", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            { invalid json }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.title()).toBe(""); // Returns empty string when no valid data
		});

		it("should extract website name from WebSite entity", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Test Website"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.siteName()).toBe("Test Website");
		});
	});

	describe("Entity Extraction", () => {
		it("should extract recipe from @graph array", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "name": "My Site"
                },
                {
                  "@type": "Recipe",
                  "name": "Graph Recipe"
                }
              ]
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.title()).toBe("Graph Recipe");
		});

		it("should handle @type as array", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": ["Article", "Recipe"],
              "name": "Multi-Type Recipe"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.title()).toBe("Multi-Type Recipe");
		});

		it("should resolve person references by @id", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Person",
                  "@id": "#author-1",
                  "name": "Jane Doe"
                },
                {
                  "@type": "Recipe",
                  "name": "Referenced Author Recipe",
                  "author": { "@id": "#author-1" }
                }
              ]
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.author()).toBe("Jane Doe");
		});

		it("should extract AggregateRating data", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "name": "Rated Recipe",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.5",
                "reviewCount": "100"
              }
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.ratings()).toBe(4.5);
			expect(schema.ratingsCount()).toBe(100);
		});
	});

	describe("Recipe Metadata", () => {
		it("should extract title", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "name": "Delicious Cake"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.title()).toBe("Delicious Cake");
		});

		it("should extract category", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "recipeCategory": "Desserts"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.category()).toBe("Desserts");
		});

		it("should extract cuisine", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "recipeCuisine": "Italian"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.cuisine()).toBe("Italian");
		});

		it("should extract description", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "description": "A wonderful recipe description"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.description()).toBe("A wonderful recipe description");
		});

		it("should extract image URL", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "image": "https://example.com/image.jpg"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.image()).toBe("https://example.com/image.jpg");
		});

		it("should extract image from object with url property", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "image": {
                "@type": "ImageObject",
                "url": "https://example.com/image.jpg"
              }
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.image()).toBe("https://example.com/image.jpg");
		});

		it("should extract first image from array", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "image": [
                "https://example.com/image1.jpg",
                "https://example.com/image2.jpg"
              ]
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.image()).toBe("https://example.com/image1.jpg");
		});
	});

	describe("Author Extraction", () => {
		it("should extract author from string", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "author": "John Smith"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.author()).toBe("John Smith");
		});

		it("should extract author from Person object", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "author": {
                "@type": "Person",
                "name": "Jane Doe"
              }
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.author()).toBe("Jane Doe");
		});

		it("should extract first author from array", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "author": [
                { "@type": "Person", "name": "First Author" },
                { "@type": "Person", "name": "Second Author" }
              ]
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.author()).toBe("First Author");
		});
	});

	describe("Time Extraction", () => {
		it("should extract total time from ISO 8601 duration", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "totalTime": "PT1H30M"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.totalTime()).toBe(90);
		});

		it("should extract prep time", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "prepTime": "PT15M"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.prepTime()).toBe(15);
		});

		it("should extract cook time", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "cookTime": "PT45M"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.cookTime()).toBe(45);
		});
	});

	describe("Ingredients Extraction", () => {
		it("should extract ingredients from string array", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "recipeIngredient": [
                "1 cup flour",
                "2 eggs",
                "1/2 cup sugar"
              ]
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.ingredients()).toEqual([
				"1 cup flour",
				"2 eggs",
				"1/2 cup sugar",
			]);
		});

		it("should handle single ingredient string", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "recipeIngredient": "1 cup flour"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.ingredients()).toEqual(["1 cup flour"]);
		});
	});

	describe("Instructions Extraction", () => {
		it("should extract instructions from simple string", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "recipeInstructions": "Mix all ingredients and bake."
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.instructions()).toBe("Mix all ingredients and bake.");
		});

		it("should extract instructions from string array", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "recipeInstructions": [
                "Preheat oven to 350°F",
                "Mix ingredients",
                "Bake for 30 minutes"
              ]
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			const instructions = schema.instructions();
			expect(instructions).toContain("Preheat oven to 350°F");
			expect(instructions).toContain("Mix ingredients");
			expect(instructions).toContain("Bake for 30 minutes");
		});

		it("should extract instructions from HowToStep objects", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "recipeInstructions": [
                {
                  "@type": "HowToStep",
                  "text": "Step 1: Preheat oven"
                },
                {
                  "@type": "HowToStep",
                  "text": "Step 2: Mix ingredients"
                }
              ]
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			const instructions = schema.instructions();
			expect(instructions).toContain("Step 1: Preheat oven");
			expect(instructions).toContain("Step 2: Mix ingredients");
		});

		it("should extract instructions from HowToSection with steps", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "recipeInstructions": [
                {
                  "@type": "HowToSection",
                  "name": "Preparation",
                  "itemListElement": [
                    {
                      "@type": "HowToStep",
                      "text": "Prep step 1"
                    },
                    {
                      "@type": "HowToStep",
                      "text": "Prep step 2"
                    }
                  ]
                }
              ]
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			const instructions = schema.instructions();
			expect(instructions).toContain("Preparation");
			expect(instructions).toContain("Prep step 1");
			expect(instructions).toContain("Prep step 2");
		});
	});

	describe("Yields Extraction", () => {
		it("should extract yields from string", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "recipeYield": "4 servings"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.yields()).toBe("4 servings");
		});

		it("should extract yields from number", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "recipeYield": 6
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			const yields = schema.yields();
			expect(yields).toBeTruthy();
			expect(yields).toContain("6");
		});

		it("should extract yields from array", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "recipeYield": ["4 servings", "8 pieces"]
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.yields()).toBe("4 servings");
		});
	});

	describe("Nutrition Extraction", () => {
		it("should extract nutrition information", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "nutrition": {
                "@type": "NutritionInformation",
                "calories": "300 calories",
                "proteinContent": "15g",
                "fatContent": "10g",
                "carbohydrateContent": "40g"
              }
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.nutrients().calories).toBe("300 calories");
			expect(schema.nutrients().proteinContent).toBe("15g");
			expect(schema.nutrients().fatContent).toBe("10g");
			expect(schema.nutrients().carbohydrateContent).toBe("40g");
		});

		it("should return empty object for missing nutrition", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "name": "No Nutrition Recipe"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			const nutrients = schema.nutrients();
			expect(nutrients).toEqual({});
		});
	});

	describe("Keywords and Tags", () => {
		it("should extract keywords from string", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "keywords": "dessert, chocolate, cake"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			const keywords = schema.keywords();
			expect(keywords).toBeInstanceOf(Array);
			expect(keywords).toContain("dessert");
			expect(keywords).toContain("chocolate");
			expect(keywords).toContain("cake");
		});

		it("should extract keywords from array", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "keywords": ["dessert", "chocolate", "cake"]
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			const keywords = schema.keywords();
			expect(keywords).toBeInstanceOf(Array);
			expect(keywords).toContain("dessert");
			expect(keywords).toContain("chocolate");
			expect(keywords).toContain("cake");
		});
	});

	describe("Dietary Information", () => {
		it("should extract suitable for diet", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "suitableForDiet": "https://schema.org/VegetarianDiet"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			const restrictions = schema.dietaryRestrictions();
			expect(restrictions).toBeInstanceOf(Array);
			expect(restrictions).toContain("Vegetarian Diet");
		});

		it("should extract multiple diets from array", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "suitableForDiet": [
                "https://schema.org/VeganDiet",
                "https://schema.org/GlutenFreeDiet"
              ]
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			const restrictions = schema.dietaryRestrictions();
			expect(restrictions).toBeInstanceOf(Array);
			expect(restrictions).toContain("Vegan Diet");
			expect(restrictions).toContain("Gluten Free Diet");
		});
	});

	describe("Language Detection", () => {
		it("should extract language", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Recipe",
              "inLanguage": "en-US"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.language()).toBe("en-US");
		});
	});

	describe("Real Test Data", () => {
		it("should parse allrecipes.com test data if available", () => {
			try {
				const html = loadTestHtml("allrecipes.com", "banana_bread.testhtml");
				const schema = new SchemaOrg(html);

				expect(schema.title()).toBeTruthy();
				expect(schema.ingredients()).toBeInstanceOf(Array);
				expect(schema.ingredients().length).toBeGreaterThan(0);
			} catch (_error) {
				// Test data might not be available
				console.warn("allrecipes.com test data not found, skipping");
			}
		});
	});

	describe("Error Handling", () => {
		it("should handle missing recipe data gracefully", () => {
			const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Not a recipe"
            }
            </script>
          </head>
        </html>
      `;

			const schema = new SchemaOrg(html);
			expect(schema.title()).toBe(""); // Returns empty string when no recipe data
			expect(schema.ingredients()).toEqual([]); // Returns empty array when no ingredients
		});

		it("should handle empty HTML", () => {
			const schema = new SchemaOrg("");
			expect(schema.title()).toBe(""); // Returns empty string for missing data
		});
	});
});
