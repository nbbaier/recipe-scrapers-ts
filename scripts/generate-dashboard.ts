/**
 * Generate a static HTML dashboard showing scraper porting progress.
 *
 * Reads the Python SCRAPERS registry from __init__.py to get the true
 * domain list (including aliases like hellofresh.de, aldi-nord.de, etc.)
 * and compares against the TypeScript SCRAPER_REGISTRY.
 *
 * Usage:
 *   bun scripts/generate-dashboard.ts
 *
 * Outputs: dashboard.html in the project root
 */

import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const SITES_DIR = join(import.meta.dirname, "../src/scrapers/sites");
const PYTHON_DIR = join(
	import.meta.dirname,
	"../../recipe-scrapers/recipe_scrapers",
);
const OUTPUT = join(import.meta.dirname, "../dashboard.html");

/**
 * Get all registered domains from the Python SCRAPERS dict.
 * Returns a map of domain -> class name, plus alias groupings.
 */
function getPythonRegistry(): {
	domains: Map<string, string>;
	classToDomains: Map<string, string[]>;
} {
	const script = `
import json
from recipe_scrapers import SCRAPERS
result = {}
for domain, cls in SCRAPERS.items():
    result[domain] = cls.__name__
print(json.dumps(result))
`;
	try {
		const output = execSync(`uv run python -c "${script}"`, {
			encoding: "utf-8",
			cwd: join(import.meta.dirname, "../../recipe-scrapers"),
			stdio: ["pipe", "pipe", "pipe"],
		}).trim();

		const raw = JSON.parse(output) as Record<string, string>;
		const domains = new Map(Object.entries(raw));

		const classToDomains = new Map<string, string[]>();
		for (const [domain, cls] of domains) {
			const existing = classToDomains.get(cls) || [];
			existing.push(domain);
			classToDomains.set(cls, existing);
		}

		return { domains, classToDomains };
	} catch {
		console.warn(
			"Warning: Could not run Python to get SCRAPERS registry, falling back to file listing",
		);
		return getPythonRegistryFallback();
	}
}

/**
 * Fallback: count .py files if Python isn't available.
 */
function getPythonRegistryFallback(): {
	domains: Map<string, string>;
	classToDomains: Map<string, string[]>;
} {
	const files = readdirSync(PYTHON_DIR).filter((f) => {
		if (!f.endsWith(".py")) return false;
		if (f.startsWith("_")) return false;
		return statSync(join(PYTHON_DIR, f)).isFile();
	});

	const domains = new Map<string, string>();
	const classToDomains = new Map<string, string[]>();
	for (const f of files) {
		const name = basename(f, ".py");
		// Use filename as both domain placeholder and class name
		domains.set(name, name);
		classToDomains.set(name, [name]);
	}
	return { domains, classToDomains };
}

/**
 * Get TS registered domains from SCRAPER_REGISTRY in sites/index.ts.
 */
function getTsRegistry(): Map<string, string> {
	const indexPath = join(SITES_DIR, "index.ts");
	const content = readFileSync(indexPath, "utf-8");

	const registry = new Map<string, string>();
	// Match lines like: "allrecipes.com": AllRecipesScraper,
	const re = /["']([^"']+)["']\s*:\s*(\w+)/g;
	let match: RegExpExecArray | null;
	// biome-ignore lint/suspicious/noAssignInExpressions: simple regex loop
	while ((match = re.exec(content)) !== null) {
		registry.set(match[1], match[2]);
	}
	return registry;
}

/**
 * Get the set of TS scraper filenames (module names, not domains).
 */

interface DashboardRow {
	domain: string;
	pythonClass: string;
	ported: boolean;
	isAlias: boolean; // true if this domain is a secondary alias
	primaryDomain: string; // the "main" domain for the class
	tsDomains: string[]; // which aliases are registered in TS
}

function buildRows(
	pythonDomains: Map<string, string>,
	classToDomains: Map<string, string[]>,
	tsRegistry: Map<string, string>,
): DashboardRow[] {
	const rows: DashboardRow[] = [];

	for (const [domain, className] of [...pythonDomains.entries()].sort((a, b) =>
		a[0].localeCompare(b[0]),
	)) {
		const allDomainsForClass = classToDomains.get(className) || [domain];
		const primaryDomain = allDomainsForClass[0];
		const isAlias = domain !== primaryDomain;

		// A scraper is "ported" if the module file exists
		// (module name is derived from Python class file, roughly matching the filename)
		const ported =
			tsRegistry.has(domain) ||
			allDomainsForClass.some((d) => tsRegistry.has(d));

		const tsDomains = allDomainsForClass.filter((d) => tsRegistry.has(d));

		rows.push({
			domain,
			pythonClass: className,
			ported,
			isAlias,
			primaryDomain,
			tsDomains,
		});
	}

	return rows;
}

function generateHtml(rows: DashboardRow[]): string {
	const totalDomains = rows.length;
	const portedDomains = rows.filter((r) => r.ported).length;
	const notPortedDomains = totalDomains - portedDomains;
	const pct = ((portedDomains / totalDomains) * 100).toFixed(1);

	// Count unique classes
	const allClasses = new Set(rows.map((r) => r.pythonClass));
	const portedClasses = new Set(
		rows.filter((r) => r.ported).map((r) => r.pythonClass),
	);
	``;
	// Find classes with aliases where only some domains are registered in TS

	const scraperRow = (row: DashboardRow) => {
		const statusClass = row.ported ? "ported" : "not-ported";
		const aliasTag = row.isAlias
			? `<span class="alias-tag">alias of ${row.primaryDomain}</span>`
			: "";
		const missingTag =
			row.ported && !row.tsDomains.includes(row.domain)
				? `<span class="missing-alias-tag">alias not registered</span>`
				: "";
		const statusText = row.ported ? "Ported" : "Not ported";
		return `<tr class="${statusClass}" data-class="${row.pythonClass}">
			<td>${row.domain}${aliasTag}${missingTag}</td>
			<td>${row.pythonClass}</td>
			<td>${statusText}</td>
		</tr>`;
	};

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>recipe-scrapers-ts — Porting Dashboard</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #f8f9fa; color: #1a1a2e; padding: 2rem; max-width: 960px; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  .subtitle { color: #666; margin-bottom: 1.5rem; font-size: 0.9rem; }
  .stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .stat { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 1rem 1.25rem; min-width: 120px; }
  .stat .number { font-size: 1.75rem; font-weight: 700; }
  .stat .label { font-size: 0.8rem; color: #666; margin-top: 0.2rem; }
  .stat.ported .number { color: #16a34a; }
  .stat.remaining .number { color: #dc2626; }
  .stat.total .number { color: #2563eb; }
  .stat.classes .number { color: #7c3aed; }
  .progress-bar { background: #e5e7eb; border-radius: 999px; height: 24px; margin-bottom: 1.5rem; overflow: hidden; position: relative; }
  .progress-bar .fill { background: #16a34a; height: 100%; border-radius: 999px; transition: width 0.3s; }
  .progress-bar .pct { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 600; color: #1a1a2e; }
  .controls { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center; }
  .controls input { padding: 0.4rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; flex: 1; max-width: 300px; }
  .controls button { padding: 0.4rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; cursor: pointer; font-size: 0.85rem; }
  .controls button.active { background: #1a1a2e; color: #fff; border-color: #1a1a2e; }
  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
  th { text-align: left; padding: 0.6rem 1rem; background: #f1f5f9; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; border-bottom: 1px solid #e0e0e0; }
  td { padding: 0.5rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; }
  tr.ported td:nth-child(3) { color: #16a34a; font-weight: 600; }
  tr.not-ported td:nth-child(3) { color: #94a3b8; }
  tr:last-child td { border-bottom: none; }
  .alias-tag { display: inline-block; margin-left: 0.4rem; padding: 0.1rem 0.4rem; background: #e0e7ff; color: #3730a3; border-radius: 4px; font-size: 0.7rem; vertical-align: middle; }
  .missing-alias-tag { display: inline-block; margin-left: 0.4rem; padding: 0.1rem 0.4rem; background: #fef3c7; color: #92400e; border-radius: 4px; font-size: 0.7rem; vertical-align: middle; }
  .count { font-size: 0.8rem; color: #666; margin-bottom: 0.5rem; }
  .generated { margin-top: 1.5rem; font-size: 0.75rem; color: #94a3b8; }
  .note { margin-bottom: 1.5rem; padding: 0.75rem 1rem; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; font-size: 0.8rem; color: #0c4a6e; }
</style>
</head>
<body>

<h1>recipe-scrapers-ts</h1>
<p class="subtitle">TypeScript port progress dashboard</p>

<div class="stats">
  <div class="stat ported"><div class="number">${portedDomains}</div><div class="label">Domains ported</div></div>
  <div class="stat remaining"><div class="number">${notPortedDomains}</div><div class="label">Domains remaining</div></div>
  <div class="stat total"><div class="number">${totalDomains}</div><div class="label">Total domains</div></div>
  <div class="stat classes"><div class="number">${portedClasses.size}/${allClasses.size}</div><div class="label">Scraper classes</div></div>
</div>

<div class="progress-bar">
  <div class="fill" style="width: ${pct}%"></div>
  <div class="pct">${pct}%</div>
</div>

<div class="note">
  Some scraper classes handle multiple domains (e.g., HelloFresh handles 18 country domains).
  Python registers <strong>${totalDomains} domains</strong> across <strong>${allClasses.size} scraper classes</strong>.
  Domains marked <span class="alias-tag">alias</span> share a scraper with their primary domain.
  Domains marked <span class="missing-alias-tag">alias not registered</span> are ported but the alias isn't in the TS registry yet.
</div>

<div class="controls">
  <input type="text" id="search" placeholder="Filter by domain or class…" autocomplete="off">
  <button class="filter-btn active" data-filter="all">All</button>
  <button class="filter-btn" data-filter="ported">Ported</button>
  <button class="filter-btn" data-filter="not-ported">Not ported</button>
</div>
<div class="count" id="count"></div>

<table>
  <thead><tr><th>Domain</th><th>Class</th><th>Status</th></tr></thead>
  <tbody id="tbody">
    ${rows.map(scraperRow).join("\n    ")}
  </tbody>
</table>

<p class="generated">Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC</p>

<script>
  const rows = [...document.querySelectorAll("#tbody tr")];
  const search = document.getElementById("search");
  const countEl = document.getElementById("count");
  const buttons = document.querySelectorAll(".filter-btn");
  let activeFilter = "all";

  function update() {
    const q = search.value.toLowerCase();
    let visible = 0;
    for (const row of rows) {
      const domain = row.children[0].textContent.toLowerCase();
      const cls = row.children[1].textContent.toLowerCase();
      const status = row.classList.contains("ported") ? "ported" : "not-ported";
      const matchFilter = activeFilter === "all" || status === activeFilter;
      const matchSearch = !q || domain.includes(q) || cls.includes(q);
      const show = matchFilter && matchSearch;
      row.style.display = show ? "" : "none";
      if (show) visible++;
    }
    countEl.textContent = "Showing " + visible + " of " + rows.length;
  }

  search.addEventListener("input", update);
  for (const btn of buttons) {
    btn.addEventListener("click", () => {
      for (const b of buttons) b.classList.remove("active");
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      update();
    });
  }
  update();
</script>
</body>
</html>`;
}

// Main
const { domains: pythonDomains, classToDomains } = getPythonRegistry();
const tsRegistry = getTsRegistry();
const rows = buildRows(pythonDomains, classToDomains, tsRegistry);

const html = generateHtml(rows);
writeFileSync(OUTPUT, html);

const portedCount = rows.filter((r) => r.ported).length;
console.log(`Dashboard written to ${OUTPUT}`);
console.log(
	`  Domains: ${portedCount} / ${rows.length} (${((portedCount / rows.length) * 100).toFixed(1)}%)`,
);
console.log(
	`  Classes: ${new Set(rows.filter((r) => r.ported).map((r) => r.pythonClass)).size} / ${new Set(rows.map((r) => r.pythonClass)).size}`,
);
