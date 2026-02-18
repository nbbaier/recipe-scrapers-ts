/**
 * Generate a static HTML dashboard showing scraper porting progress.
 *
 * Usage:
 *   bun scripts/generate-dashboard.ts
 *
 * Outputs: dashboard.html in the project root
 */

import { readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const SITES_DIR = join(import.meta.dirname, "../src/scrapers/sites");
const PYTHON_DIR = join(import.meta.dirname, "../../recipe-scrapers/recipe_scrapers");
const OUTPUT = join(import.meta.dirname, "../dashboard.html");

function getPortedScrapers(): string[] {
	return readdirSync(SITES_DIR)
		.filter((f) => f.endsWith(".ts") && f !== "index.ts")
		.map((f) => basename(f, ".ts"))
		.sort();
}

function getPythonScrapers(): string[] {
	return readdirSync(PYTHON_DIR)
		.filter((f) => {
			if (!f.endsWith(".py")) return false;
			if (f.startsWith("_")) return false;
			const full = join(PYTHON_DIR, f);
			return statSync(full).isFile();
		})
		.map((f) => basename(f, ".py"))
		.sort();
}

function generateHtml(ported: string[], all: string[]): string {
	const portedSet = new Set(ported);
	const notPorted = all.filter((s) => !portedSet.has(s));
	const pct = ((ported.length / all.length) * 100).toFixed(1);

	const scraperRow = (name: string, done: boolean) =>
		`<tr class="${done ? "ported" : "not-ported"}">
			<td>${name}</td>
			<td>${done ? "Ported" : "Not ported"}</td>
		</tr>`;

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>recipe-scrapers-ts — Porting Dashboard</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #f8f9fa; color: #1a1a2e; padding: 2rem; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  .subtitle { color: #666; margin-bottom: 1.5rem; font-size: 0.9rem; }
  .stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .stat { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 1rem 1.25rem; min-width: 140px; }
  .stat .number { font-size: 1.75rem; font-weight: 700; }
  .stat .label { font-size: 0.8rem; color: #666; margin-top: 0.2rem; }
  .stat.ported .number { color: #16a34a; }
  .stat.remaining .number { color: #dc2626; }
  .stat.total .number { color: #2563eb; }
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
  tr.ported td:nth-child(2) { color: #16a34a; font-weight: 600; }
  tr.not-ported td:nth-child(2) { color: #94a3b8; }
  tr:last-child td { border-bottom: none; }
  .count { font-size: 0.8rem; color: #666; margin-bottom: 0.5rem; }
  .generated { margin-top: 1.5rem; font-size: 0.75rem; color: #94a3b8; }
</style>
</head>
<body>

<h1>recipe-scrapers-ts</h1>
<p class="subtitle">TypeScript port progress dashboard</p>

<div class="stats">
  <div class="stat ported"><div class="number">${ported.length}</div><div class="label">Ported</div></div>
  <div class="stat remaining"><div class="number">${notPorted.length}</div><div class="label">Remaining</div></div>
  <div class="stat total"><div class="number">${all.length}</div><div class="label">Total (Python)</div></div>
</div>

<div class="progress-bar">
  <div class="fill" style="width: ${pct}%"></div>
  <div class="pct">${pct}%</div>
</div>

<div class="controls">
  <input type="text" id="search" placeholder="Filter scrapers…" autocomplete="off">
  <button class="filter-btn active" data-filter="all">All</button>
  <button class="filter-btn" data-filter="ported">Ported</button>
  <button class="filter-btn" data-filter="not-ported">Not ported</button>
</div>
<div class="count" id="count"></div>

<table>
  <thead><tr><th>Scraper</th><th>Status</th></tr></thead>
  <tbody id="tbody">
    ${ported.map((s) => scraperRow(s, true)).join("\n    ")}
    ${notPorted.map((s) => scraperRow(s, false)).join("\n    ")}
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
      const name = row.children[0].textContent.toLowerCase();
      const status = row.classList.contains("ported") ? "ported" : "not-ported";
      const matchFilter = activeFilter === "all" || status === activeFilter;
      const matchSearch = !q || name.includes(q);
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

const ported = getPortedScrapers();
const all = getPythonScrapers();
const html = generateHtml(ported, all);
writeFileSync(OUTPUT, html);
console.log(`Dashboard written to ${OUTPUT}`);
console.log(`  Ported: ${ported.length} / ${all.length} (${((ported.length / all.length) * 100).toFixed(1)}%)`);
