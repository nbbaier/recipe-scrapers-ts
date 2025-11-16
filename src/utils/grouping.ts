// @ts-ignore - cheerio is used for type annotations only (cheerio.CheerioAPI, cheerio.Element)
import * as cheerio from 'cheerio';
import type { IngredientGroup } from '../types/recipe';
import { normalizeString } from './strings';


function normalizeFractions(text: string): string {
  const fractionMap: Record<string, string> = {
    '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4', '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5',
    '⅙': '1/6', '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
  };
  let result = text;
  for (const [unicodeFrac, asciiFrac] of Object.entries(fractionMap)) {
    result = result.replace(new RegExp(unicodeFrac, 'g'), asciiFrac);
  }
  return result;
}

const DEFAULT_GROUPINGS: Array<{ name: string; headingSelectors: string[]; elementSelectors: string[]; }> = [
  { name: 'wprm', headingSelectors: ['.wprm-recipe-ingredient-group h4', '.wprm-recipe-group-name'],
    elementSelectors: ['.wprm-recipe-ingredient', '.wprm-recipe-ingredients li'] },
  { name: 'tasty', headingSelectors: ['.tasty-recipes-ingredients-body p strong', '.tasty-recipes-ingredients h4'],
    elementSelectors: ['.tasty-recipes-ingredients-body ul li', '.tasty-recipes-ingredients ul li'] },
];

function scoreSentenceSimilarity(first: string, second: string): number {
  if (first === second) return 1;
  if (first.length < 2 || second.length < 2) return 0;
  const firstBigrams = new Set<string>();
  for (let i = 0; i < first.length - 1; i++) firstBigrams.add(first.slice(i, i + 2));
  const secondBigrams = new Set<string>();
  for (let i = 0; i < second.length - 1; i++) secondBigrams.add(second.slice(i, i + 2));
  let intersection = 0;
  for (const bigram of firstBigrams) if (secondBigrams.has(bigram)) intersection++;
  return (2 * intersection) / (firstBigrams.size + secondBigrams.size);
}

function bestMatch(testString: string, targetStrings: string[]): string {
  const normalizedTest = normalizeFractions(testString);
  const normalizedTargets = targetStrings.map((t) => normalizeFractions(t));
  const scores = normalizedTargets.map((target) => scoreSentenceSimilarity(normalizedTest, target));
  let bestIndex = 0;
  let bestScore = scores[0];
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      bestIndex = i;
    }
  }
  return targetStrings[bestIndex];
}

export function groupIngredients(
  ingredientsList: string[], $: cheerio.CheerioAPI, groupHeading?: string, groupElement?: string
): IngredientGroup[] {
  let heading = groupHeading;
  let element = groupElement;
  if (!heading || !element) {
    for (const { headingSelectors, elementSelectors } of DEFAULT_GROUPINGS) {
      let foundHeading: string | undefined;
      let foundElement: string | undefined;
      for (const headingSel of headingSelectors) {
        for (const elementSel of elementSelectors) {
          if ($(headingSel).length > 0 && $(elementSel).length > 0) {
            foundHeading = headingSel;
            foundElement = elementSel;
            break;
          }
        }
        if (foundHeading && foundElement) break;
      }
      if (foundHeading && foundElement) {
        heading = foundHeading;
        element = foundElement;
        break;
      }
    }
  }
  if (!heading || !element) {
    return [{ purpose: undefined, ingredients: ingredientsList }];
  }
  const foundIngredients = $(element);
  if (foundIngredients.length !== ingredientsList.length) {
    throw new Error(`Found ${foundIngredients.length} grouped ingredients but was expecting to find ${ingredientsList.length}.`);
  }
  const groupings = new Map<string | undefined, string[]>();
  let currentHeading: string | undefined;
  const elements = $(heading + ", " + element);
  elements.each((_idx, elem) => {
    const $elem = $(elem as cheerio.Element);
    const parent = $elem.parent();
    if (parent && parent.find(heading).filter((_i, e) => e === elem).length > 0) {
      const headingText = normalizeString($elem.text());
      currentHeading = headingText || undefined;
      if (!groupings.has(currentHeading)) groupings.set(currentHeading, []);
    } else {
      const ingredientText = normalizeString($elem.text());
      const matchedIngredient = bestMatch(ingredientText, ingredientsList);
      if (!groupings.has(currentHeading)) groupings.set(currentHeading, []);
      groupings.get(currentHeading)?.push(matchedIngredient);
    }
  });
  const result: IngredientGroup[] = [];
  for (const [purpose, ingredients] of groupings.entries()) {
    if (ingredients.length > 0) result.push({ purpose, ingredients });
  }
  return result;
}
