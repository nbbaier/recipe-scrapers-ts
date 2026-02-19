/**
 * Risk policy utilities used by CI policy gates.
 */

export type NormalizedCheckStatus = "success" | "failed" | "pending";

export interface MergePolicyTier {
	requiredChecks: string[];
}

export interface DocsDriftRule {
	triggerPaths: string[];
	requiredDocs: string[];
}

export interface EvidenceRule {
	triggerPaths: string[];
	requiredEvidence: string[];
}

export interface ReviewAgentRule {
	checkName: string;
	requiredForTiers: string[];
	requireCurrentHeadSha?: boolean;
}

export interface RiskPolicyContract {
	version: string;
	riskTierRules: Record<string, string[]>;
	mergePolicy: Record<string, MergePolicyTier>;
	docsDriftRules?: DocsDriftRule;
	evidenceRules?: EvidenceRule;
	reviewAgentRule?: ReviewAgentRule;
}

export interface RiskTierMatch {
	file: string;
	tier: string;
}

export interface RiskTierComputation {
	tier: string;
	tierOrder: string[];
	matches: RiskTierMatch[];
}

export interface RuleEvaluation {
	triggered: boolean;
	passed: boolean;
	matchedRequired: string[];
	message?: string;
}

export interface RequiredChecksEvaluation {
	requiredChecks: string[];
	evaluated: boolean;
	passed: boolean;
	successful: string[];
	missing: string[];
	failed: string[];
	pending: string[];
}

export interface ReviewAgentEvaluation {
	required: boolean;
	passed: boolean;
	checkName?: string;
	status?: NormalizedCheckStatus;
	shaMatchesHead?: boolean;
	message?: string;
}

export interface PolicyGateInput {
	contract: RiskPolicyContract;
	changedFiles: string[];
	checkStatuses?: Record<string, string | boolean | number>;
	headSha?: string;
	reviewAgentHeadSha?: string;
	reviewAgentStatus?: string;
}

export interface PolicyGateResult {
	passed: boolean;
	risk: RiskTierComputation;
	requiredChecks: RequiredChecksEvaluation;
	docsDrift: RuleEvaluation;
	evidence: RuleEvaluation;
	reviewAgent: ReviewAgentEvaluation;
	failures: string[];
}

const compiledGlobCache = new Map<string, RegExp>();

const REGEX_META_CHARS = /[\\^$+?.()|[\]{}]/g;

function normalizePath(path: string): string {
	return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

function escapeRegex(input: string): string {
	return input.replace(REGEX_META_CHARS, "\\$&");
}

export function globToRegExp(pattern: string): RegExp {
	const normalized = normalizePath(pattern);
	const cached = compiledGlobCache.get(normalized);
	if (cached) {
		return cached;
	}

	let regex = "^";
	let index = 0;
	while (index < normalized.length) {
		const char = normalized[index];

		if (char === "*") {
			const next = normalized[index + 1];
			if (next === "*") {
				const after = normalized[index + 2];
				if (after === "/") {
					regex += "(?:.*/)?";
					index += 3;
					continue;
				}
				regex += ".*";
				index += 2;
				continue;
			}
			regex += "[^/]*";
			index += 1;
			continue;
		}

		if (char === "?") {
			regex += "[^/]";
			index += 1;
			continue;
		}

		regex += escapeRegex(char);
		index += 1;
	}

	regex += "$";
	const compiled = new RegExp(regex);
	compiledGlobCache.set(normalized, compiled);
	return compiled;
}

export function pathMatchesGlob(path: string, pattern: string): boolean {
	return globToRegExp(pattern).test(normalizePath(path));
}

export function pathMatchesAny(path: string, patterns: string[]): boolean {
	return patterns.some((pattern) => pathMatchesGlob(path, pattern));
}

function normalizeStatusValue(
	value: string | boolean | number | undefined,
): NormalizedCheckStatus | undefined {
	if (value === undefined) {
		return undefined;
	}

	if (typeof value === "boolean") {
		return value ? "success" : "failed";
	}

	if (typeof value === "number") {
		return value === 0 ? "success" : "failed";
	}

	const normalized = value.trim().toLowerCase();

	if (
		normalized === "success" ||
		normalized === "successful" ||
		normalized === "pass" ||
		normalized === "passed" ||
		normalized === "neutral" ||
		normalized === "skipped"
	) {
		return "success";
	}

	if (
		normalized === "failure" ||
		normalized === "failed" ||
		normalized === "error" ||
		normalized === "cancelled" ||
		normalized === "timed_out" ||
		normalized === "timeout" ||
		normalized === "action_required"
	) {
		return "failed";
	}

	return "pending";
}

export function normalizeCheckStatuses(
	checkStatuses?: Record<string, string | boolean | number>,
): Record<string, NormalizedCheckStatus> {
	const normalized: Record<string, NormalizedCheckStatus> = {};
	if (!checkStatuses) {
		return normalized;
	}

	for (const [checkName, statusValue] of Object.entries(checkStatuses)) {
		const status = normalizeStatusValue(statusValue);
		if (status) {
			normalized[checkName] = status;
		}
	}

	return normalized;
}

export function computeRiskTier(
	changedFiles: string[],
	riskTierRules: Record<string, string[]>,
): RiskTierComputation {
	const tierOrder = Object.keys(riskTierRules);
	if (tierOrder.length === 0) {
		throw new Error("riskTierRules must include at least one tier");
	}

	let highestRiskTierIndex = tierOrder.length - 1;
	const fallbackTier = tierOrder[tierOrder.length - 1];
	const matches: RiskTierMatch[] = [];

	for (const changedFile of changedFiles) {
		const normalizedFile = normalizePath(changedFile);
		let matchedTier = fallbackTier;

		for (let index = 0; index < tierOrder.length; index++) {
			const tierName = tierOrder[index];
			const patterns = riskTierRules[tierName] ?? [];
			if (pathMatchesAny(normalizedFile, patterns)) {
				matchedTier = tierName;
				highestRiskTierIndex = Math.min(highestRiskTierIndex, index);
				break;
			}
		}

		matches.push({ file: normalizedFile, tier: matchedTier });
	}

	return {
		tier: tierOrder[highestRiskTierIndex],
		tierOrder,
		matches,
	};
}

export function evaluateDocsDriftRule(
	changedFiles: string[],
	rule?: DocsDriftRule,
): RuleEvaluation {
	if (!rule) {
		return {
			triggered: false,
			passed: true,
			matchedRequired: [],
		};
	}

	const normalizedFiles = changedFiles.map((file) => normalizePath(file));
	const triggered = normalizedFiles.some((file) =>
		pathMatchesAny(file, rule.triggerPaths),
	);
	if (!triggered) {
		return {
			triggered: false,
			passed: true,
			matchedRequired: [],
		};
	}

	const matchedRequired = normalizedFiles.filter((file) =>
		pathMatchesAny(file, rule.requiredDocs),
	);
	const passed = matchedRequired.length > 0;

	return {
		triggered: true,
		passed,
		matchedRequired,
		message: passed
			? undefined
			: `Control-plane changes require one of: ${rule.requiredDocs.join(", ")}`,
	};
}

export function evaluateEvidenceRule(
	changedFiles: string[],
	rule?: EvidenceRule,
): RuleEvaluation {
	if (!rule) {
		return {
			triggered: false,
			passed: true,
			matchedRequired: [],
		};
	}

	const normalizedFiles = changedFiles.map((file) => normalizePath(file));
	const triggered = normalizedFiles.some((file) =>
		pathMatchesAny(file, rule.triggerPaths),
	);
	if (!triggered) {
		return {
			triggered: false,
			passed: true,
			matchedRequired: [],
		};
	}

	const matchedRequired = normalizedFiles.filter((file) =>
		pathMatchesAny(file, rule.requiredEvidence),
	);
	const passed = matchedRequired.length > 0;

	return {
		triggered: true,
		passed,
		matchedRequired,
		message: passed
			? undefined
			: `Evidence missing. Include one of: ${rule.requiredEvidence.join(", ")}`,
	};
}

export function evaluateRequiredChecks(
	requiredChecks: string[],
	checkStatuses?: Record<string, string | boolean | number>,
): RequiredChecksEvaluation {
	const normalizedStatuses = normalizeCheckStatuses(checkStatuses);
	const hasStatuses = Object.keys(normalizedStatuses).length > 0;

	if (!hasStatuses) {
		return {
			requiredChecks,
			evaluated: false,
			passed: true,
			successful: [],
			missing: [],
			failed: [],
			pending: [],
		};
	}

	const successful: string[] = [];
	const missing: string[] = [];
	const failed: string[] = [];
	const pending: string[] = [];

	for (const checkName of requiredChecks) {
		const status = normalizedStatuses[checkName];
		if (!status) {
			missing.push(checkName);
			continue;
		}

		if (status === "success") {
			successful.push(checkName);
			continue;
		}

		if (status === "pending") {
			pending.push(checkName);
			continue;
		}

		failed.push(checkName);
	}

	return {
		requiredChecks,
		evaluated: true,
		passed: missing.length === 0 && failed.length === 0 && pending.length === 0,
		successful,
		missing,
		failed,
		pending,
	};
}

export function evaluateReviewAgentRule(
	reviewRule: ReviewAgentRule | undefined,
	riskTier: string,
	checkStatuses: Record<string, string | boolean | number> | undefined,
	headSha?: string,
	reviewAgentHeadSha?: string,
	reviewAgentStatus?: string,
): ReviewAgentEvaluation {
	if (!reviewRule) {
		return {
			required: false,
			passed: true,
		};
	}

	const required = reviewRule.requiredForTiers.includes(riskTier);
	if (!required) {
		return {
			required: false,
			passed: true,
			checkName: reviewRule.checkName,
		};
	}

	const statusFromChecks = checkStatuses?.[reviewRule.checkName];
	const resolvedStatus = normalizeStatusValue(
		reviewAgentStatus ?? statusFromChecks,
	);
	if (!resolvedStatus) {
		return {
			required: true,
			passed: false,
			checkName: reviewRule.checkName,
			message: `Required review check "${reviewRule.checkName}" is missing`,
		};
	}

	if (resolvedStatus !== "success") {
		return {
			required: true,
			passed: false,
			checkName: reviewRule.checkName,
			status: resolvedStatus,
			message: `Review check "${reviewRule.checkName}" is ${resolvedStatus}`,
		};
	}

	if (reviewRule.requireCurrentHeadSha) {
		if (!headSha) {
			return {
				required: true,
				passed: false,
				checkName: reviewRule.checkName,
				status: resolvedStatus,
				message:
					"HEAD SHA is required to enforce current-head review discipline",
			};
		}

		if (!reviewAgentHeadSha) {
			return {
				required: true,
				passed: false,
				checkName: reviewRule.checkName,
				status: resolvedStatus,
				message: "Review run SHA is required for current-head validation",
			};
		}

		const shaMatchesHead = headSha === reviewAgentHeadSha;
		if (!shaMatchesHead) {
			return {
				required: true,
				passed: false,
				checkName: reviewRule.checkName,
				status: resolvedStatus,
				shaMatchesHead,
				message: `Review SHA (${reviewAgentHeadSha}) does not match head SHA (${headSha})`,
			};
		}

		return {
			required: true,
			passed: true,
			checkName: reviewRule.checkName,
			status: resolvedStatus,
			shaMatchesHead: true,
		};
	}

	return {
		required: true,
		passed: true,
		checkName: reviewRule.checkName,
		status: resolvedStatus,
	};
}

export function evaluatePolicyGate(input: PolicyGateInput): PolicyGateResult {
	const risk = computeRiskTier(
		input.changedFiles,
		input.contract.riskTierRules,
	);
	const mergePolicy = input.contract.mergePolicy[risk.tier];
	if (!mergePolicy) {
		throw new Error(`mergePolicy is missing tier "${risk.tier}"`);
	}

	const requiredChecks = evaluateRequiredChecks(
		mergePolicy.requiredChecks,
		input.checkStatuses,
	);
	const docsDrift = evaluateDocsDriftRule(
		input.changedFiles,
		input.contract.docsDriftRules,
	);
	const evidence = evaluateEvidenceRule(
		input.changedFiles,
		input.contract.evidenceRules,
	);
	const reviewAgent = evaluateReviewAgentRule(
		input.contract.reviewAgentRule,
		risk.tier,
		input.checkStatuses,
		input.headSha,
		input.reviewAgentHeadSha,
		input.reviewAgentStatus,
	);

	const failures: string[] = [];

	if (!docsDrift.passed && docsDrift.message) {
		failures.push(docsDrift.message);
	}
	if (!evidence.passed && evidence.message) {
		failures.push(evidence.message);
	}
	if (!requiredChecks.passed) {
		if (requiredChecks.missing.length > 0) {
			failures.push(
				`Missing required checks: ${requiredChecks.missing.join(", ")}`,
			);
		}
		if (requiredChecks.pending.length > 0) {
			failures.push(
				`Pending required checks: ${requiredChecks.pending.join(", ")}`,
			);
		}
		if (requiredChecks.failed.length > 0) {
			failures.push(
				`Failed required checks: ${requiredChecks.failed.join(", ")}`,
			);
		}
	}
	if (!reviewAgent.passed && reviewAgent.message) {
		failures.push(reviewAgent.message);
	}

	return {
		passed:
			docsDrift.passed &&
			evidence.passed &&
			requiredChecks.passed &&
			reviewAgent.passed,
		risk,
		requiredChecks,
		docsDrift,
		evidence,
		reviewAgent,
		failures,
	};
}
