import { readFileSync } from "fs";
import { scrapeHtml, settings } from "./dist/index.js";

console.log("=== SETTINGS ===");
console.log("Number of plugins:", settings.PLUGINS.length);
console.log("Plugins:", settings.PLUGINS.map((p: any) => p.name).join(", "));

const html = readFileSync(
	"../tests/test_data/allrecipes.com/allrecipescurated.testhtml",
	"utf-8",
);

const scraper = scrapeHtml(html, "https://allrecipes.com/", {
	supportedOnly: true,
});

console.log("=== SCRAPER INFO ===");
console.log("Scraper class:", scraper.constructor.name);
console.log("Host:", scraper.host());

console.log("\n=== toJson() OUTPUT ===");
const json = scraper.toJson();
console.log(JSON.stringify(json, null, 2));

console.log("\n=== SCHEMA DATA CHECK ===");
console.log("Schema exists:", !!(scraper as any).schema);
console.log("Schema data:", !!(scraper as any).schema?.data);
console.log(
	"Schema data keys:",
	Object.keys((scraper as any).schema?.data || {}),
);
console.log(
	"Schema has author method:",
	typeof (scraper as any).schema?.author,
);
console.log("\n=== SCHEMA METHODS DIRECT CALL ===");
console.log("schema.title():", (scraper as any).schema.title());
console.log("schema.author():", (scraper as any).schema.author());
console.log("schema.image():", (scraper as any).schema.image());
console.log("schema.data.name:", (scraper as any).schema.data.name);

console.log("\n=== OPENGRAPH DATA CHECK ===");
try {
	console.log(
		"opengraph.title():",
		typeof (scraper as any).opengraph.title === "function"
			? (scraper as any).opengraph.title()
			: (scraper as any).opengraph.title,
	);
} catch (e: any) {
	console.log("opengraph.title() error:", e.message);
}
console.log(
	"opengraph.image():",
	typeof (scraper as any).opengraph.image === "function"
		? (scraper as any).opengraph.image()
		: "not a function",
);
console.log(
	"opengraph.article_author:",
	(scraper as any).opengraph.article_author,
);

console.log("\n=== INDIVIDUAL METHODS ===");
console.log("title():", scraper.title());
try {
	console.log("author():", scraper.author());
} catch (error: any) {
	console.log("author() error:", error.message);
}
console.log("image():", scraper.image());
console.log("description():", scraper.description());
console.log("ingredients():", scraper.ingredients());
