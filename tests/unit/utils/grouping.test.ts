/**
 * Characterization tests for groupIngredients.
 *
 * These tests pin the CURRENT behavior of ingredient grouping (default
 * selector probing, count-mismatch errors, and fuzzy text matching). They do
 * not assert the behavior is "correct" -- only that it is stable, so a later
 * refactor (see #25) has a safety net.
 */

import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import { groupIngredients } from "../../../src/utils/grouping";

const COUNT_MISMATCH_PATTERN =
  /Found 3 grouped ingredients but was expecting to find 2\./;

describe("groupIngredients", () => {
  it("returns a single ungrouped entry when no default selectors match", () => {
    const $ = load("<html><body><p>hello</p></body></html>");
    const list = ["one", "two"];
    const result = groupIngredients(list, $);
    expect(result).toEqual([{ purpose: null, ingredients: list }]);
  });

  it("returns an empty ungrouped entry for an empty ingredients list", () => {
    const $ = load("<div/>");
    const result = groupIngredients([], $);
    expect(result).toEqual([{ purpose: null, ingredients: [] }]);
  });

  it("groups ingredients using the default wprm selectors", () => {
    const html = `
      <div class="wprm-recipe-ingredient-group"><h4>Sauce</h4></div>
      <ul>
        <li class="wprm-recipe-ingredient">1/2 cup soy sauce</li>
        <li class="wprm-recipe-ingredient">1 tbsp honey</li>
      </ul>
    `;
    const $ = load(html);
    const list = ["1/2 cup soy sauce", "1 tbsp honey"];
    const result = groupIngredients(list, $);
    expect(result).toEqual([{ purpose: "Sauce", ingredients: list }]);
  });

  it("throws when the grouped element count does not match the ingredients list", () => {
    const html = `
      <div class="wprm-recipe-ingredient-group"><h4>Sauce</h4></div>
      <ul>
        <li class="wprm-recipe-ingredient">a</li>
        <li class="wprm-recipe-ingredient">b</li>
        <li class="wprm-recipe-ingredient">c</li>
      </ul>
    `;
    const $ = load(html);
    expect(() => groupIngredients(["a", "b"], $)).toThrow(
      COUNT_MISMATCH_PATTERN
    );
  });

  it("groups ingredients using explicitly provided selectors", () => {
    const html = `
      <div class="custom-group"><span class="custom-heading">Dressing</span></div>
      <ul>
        <li class="custom-item">olive oil</li>
        <li class="custom-item">vinegar</li>
      </ul>
    `;
    const $ = load(html);
    const list = ["olive oil", "vinegar"];
    const result = groupIngredients(
      list,
      $,
      ".custom-group .custom-heading",
      ".custom-item"
    );
    expect(result).toEqual([{ purpose: "Dressing", ingredients: list }]);
  });

  it("matches unicode fraction glyphs in DOM text to their ascii-fraction list entries", () => {
    const html = `
      <div class="custom-group"><span class="custom-heading">Sugar</span></div>
      <ul><li class="custom-item">½ cup sugar</li></ul>
    `;
    const $ = load(html);
    const list = ["1/2 cup sugar"];
    const result = groupIngredients(
      list,
      $,
      ".custom-group .custom-heading",
      ".custom-item"
    );
    expect(result).toEqual([
      { purpose: "Sugar", ingredients: ["1/2 cup sugar"] },
    ]);
  });
});
