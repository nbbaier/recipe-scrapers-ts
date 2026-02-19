/**
 * Utility functions for recipe scrapers
 *
 * This module provides various utility functions for parsing and processing
 * recipe data, including string normalization, time parsing, yield parsing,
 * URL handling, and more.
 */

// Fraction utilities
export { extractFractional, FRACTIONS } from "./fractions";
// Grouping utilities
export { groupIngredients } from "./grouping";
// Helper utilities
export {
	changeKeys,
	getEquipment,
	NUTRITION_KEYS,
	type NutritionKey,
} from "./helpers";
// Risk policy utilities
export {
	computeRiskTier,
	type DocsDriftRule,
	type EvidenceRule,
	evaluateDocsDriftRule,
	evaluateEvidenceRule,
	evaluatePolicyGate,
	evaluateRequiredChecks,
	evaluateReviewAgentRule,
	globToRegExp,
	type MergePolicyTier,
	normalizeCheckStatuses,
	type PolicyGateInput,
	type PolicyGateResult,
	pathMatchesAny,
	pathMatchesGlob,
	type RequiredChecksEvaluation,
	type ReviewAgentEvaluation,
	type ReviewAgentRule,
	type RiskPolicyContract,
	type RiskTierComputation,
	type RuleEvaluation,
} from "./risk-policy";
// String utilities
export { csvToTags, formatDietName, normalizeString } from "./strings";
// Time utilities
export { getMinutes } from "./time";
// URL utilities
export {
	getHostName,
	getUrlSlug,
	type UrlComponents,
	urlPathToDict,
} from "./url";
// Yield utilities
export { getYields, RECIPE_YIELD_TYPES } from "./yields";
