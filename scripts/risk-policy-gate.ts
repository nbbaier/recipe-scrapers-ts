#!/usr/bin/env bun

/**
 * Deterministic risk policy gate.
 *
 * Usage examples:
 *   bun scripts/risk-policy-gate.ts
 *   bun scripts/risk-policy-gate.ts --changed "src/factory.ts,README.md"
 *   bun scripts/risk-policy-gate.ts --base <base_sha> --head <head_sha>
 *   bun scripts/risk-policy-gate.ts --strict-checks
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
	evaluatePolicyGate,
	type RiskPolicyContract,
} from "../src/utils/risk-policy";

interface CliArgs {
	contractPath?: string;
	changedInput?: string;
	baseSha?: string;
	headSha?: string;
	completedChecksInput?: string;
	checkStatusesJson?: string;
	reviewAgentHeadSha?: string;
	reviewAgentStatus?: string;
	jsonOutput: boolean;
	strictChecks: boolean;
}

function printHelp(): void {
	console.log(`risk-policy-gate

Options:
  --contract <path>            Path to policy contract JSON
  --changed <list>             Changed files (comma or newline separated)
  --base <sha>                 Base SHA for git diff
  --head <sha>                 Head SHA for git diff and head validation
  --checks <list>              Completed/successful checks (comma separated)
  --check-statuses-json <json> JSON object of check statuses
  --review-sha <sha>           SHA associated with review-agent run
  --review-status <status>     Status for review-agent check
  --json                       Print full JSON result
  --strict-checks              Fail when required checks cannot be evaluated
  --help                       Show help
`);
}

function splitListInput(input: string): string[] {
	return input
		.split(/[\n,]/)
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
}

function parseArgs(argv: string[]): CliArgs {
	const args: CliArgs = {
		jsonOutput: false,
		strictChecks: false,
	};

	for (let index = 0; index < argv.length; index++) {
		const token = argv[index];
		const nextValue = argv[index + 1];

		switch (token) {
			case "--contract":
				if (!nextValue) {
					throw new Error("--contract requires a value");
				}
				args.contractPath = nextValue;
				index++;
				break;
			case "--changed":
				if (!nextValue) {
					throw new Error("--changed requires a value");
				}
				args.changedInput = nextValue;
				index++;
				break;
			case "--base":
				if (!nextValue) {
					throw new Error("--base requires a value");
				}
				args.baseSha = nextValue;
				index++;
				break;
			case "--head":
				if (!nextValue) {
					throw new Error("--head requires a value");
				}
				args.headSha = nextValue;
				index++;
				break;
			case "--checks":
				if (!nextValue) {
					throw new Error("--checks requires a value");
				}
				args.completedChecksInput = nextValue;
				index++;
				break;
			case "--check-statuses-json":
				if (!nextValue) {
					throw new Error("--check-statuses-json requires a value");
				}
				args.checkStatusesJson = nextValue;
				index++;
				break;
			case "--review-sha":
				if (!nextValue) {
					throw new Error("--review-sha requires a value");
				}
				args.reviewAgentHeadSha = nextValue;
				index++;
				break;
			case "--review-status":
				if (!nextValue) {
					throw new Error("--review-status requires a value");
				}
				args.reviewAgentStatus = nextValue;
				index++;
				break;
			case "--json":
				args.jsonOutput = true;
				break;
			case "--strict-checks":
				args.strictChecks = true;
				break;
			case "--help":
			case "-h":
				printHelp();
				process.exit(0);
				return;
			default:
				throw new Error(`Unknown argument: ${token}`);
		}
	}

	return args;
}

function readPolicyContract(contractPath: string): RiskPolicyContract {
	const raw = readFileSync(contractPath, "utf-8");
	return JSON.parse(raw) as RiskPolicyContract;
}

function getChangedFilesFromGit(baseSha: string, headSha: string): string[] {
	const command = `git diff --name-only ${baseSha}...${headSha}`;
	const output = execSync(command, {
		encoding: "utf-8",
		stdio: ["ignore", "pipe", "pipe"],
	});
	return splitListInput(output);
}

function resolveChangedFiles(args: CliArgs): string[] {
	const changedInput = args.changedInput ?? process.env.CHANGED_FILES;
	if (changedInput) {
		return splitListInput(changedInput);
	}

	const baseSha =
		args.baseSha ?? process.env.BASE_SHA ?? process.env.GITHUB_BASE_SHA;
	const headSha =
		args.headSha ??
		process.env.HEAD_SHA ??
		process.env.GITHUB_HEAD_SHA ??
		process.env.GITHUB_SHA;
	if (baseSha && headSha) {
		return getChangedFilesFromGit(baseSha, headSha);
	}

	try {
		return splitListInput(
			execSync("git diff --name-only HEAD~1...HEAD", {
				encoding: "utf-8",
				stdio: ["ignore", "pipe", "pipe"],
			}),
		);
	} catch {
		return [];
	}
}

function parseCheckStatuses(
	args: CliArgs,
): Record<string, string | boolean | number> {
	const checkStatuses: Record<string, string | boolean | number> = {};

	const statusesJson =
		args.checkStatusesJson ?? process.env.CHECK_STATUSES_JSON;
	if (statusesJson) {
		const parsed = JSON.parse(statusesJson) as Record<
			string,
			string | boolean | number
		>;
		for (const [name, status] of Object.entries(parsed)) {
			checkStatuses[name] = status;
		}
	}

	const completedChecksInput =
		args.completedChecksInput ?? process.env.COMPLETED_CHECKS;
	if (completedChecksInput) {
		for (const checkName of splitListInput(completedChecksInput)) {
			checkStatuses[checkName] = "success";
		}
	}

	return checkStatuses;
}

function formatArray(items: string[]): string {
	return items.length > 0 ? items.join(", ") : "(none)";
}

function main(): void {
	const args = parseArgs(process.argv.slice(2));
	const contractPath = resolve(
		process.cwd(),
		args.contractPath ?? "policy/risk-policy.contract.json",
	);
	const contract = readPolicyContract(contractPath);
	const changedFiles = resolveChangedFiles(args);
	const checkStatuses = parseCheckStatuses(args);
	const headSha =
		args.headSha ??
		process.env.HEAD_SHA ??
		process.env.GITHUB_HEAD_SHA ??
		process.env.GITHUB_SHA;
	const reviewAgentHeadSha =
		args.reviewAgentHeadSha ?? process.env.REVIEW_AGENT_HEAD_SHA;
	const reviewAgentStatus =
		args.reviewAgentStatus ?? process.env.REVIEW_AGENT_STATUS;

	const result = evaluatePolicyGate({
		contract,
		changedFiles,
		checkStatuses,
		headSha,
		reviewAgentHeadSha,
		reviewAgentStatus,
	});

	let passed = result.passed;
	const strictChecksTriggered =
		args.strictChecks && !result.requiredChecks.evaluated;
	if (strictChecksTriggered) {
		passed = false;
	}

	if (args.jsonOutput) {
		console.log(
			JSON.stringify(
				{
					contractPath,
					changedFiles,
					strictChecks: args.strictChecks,
					strictChecksTriggered,
					...result,
					passed,
				},
				null,
				2,
			),
		);
	}

	console.log("Risk Policy Gate");
	console.log(`- Contract: ${contractPath}`);
	console.log(`- Changed files: ${changedFiles.length}`);
	console.log(`- Selected risk tier: ${result.risk.tier}`);
	console.log(
		`- Required checks: ${formatArray(result.requiredChecks.requiredChecks)}`,
	);
	console.log(`- Docs drift: ${result.docsDrift.passed ? "pass" : "fail"}`);
	console.log(`- Evidence: ${result.evidence.passed ? "pass" : "fail"}`);
	console.log(
		`- Required checks status evaluation: ${
			result.requiredChecks.evaluated ? "evaluated" : "not-evaluated"
		}`,
	);
	if (result.reviewAgent.required) {
		console.log(
			`- Review agent (${result.reviewAgent.checkName ?? "unknown"}): ${
				result.reviewAgent.passed ? "pass" : "fail"
			}`,
		);
	}
	if (strictChecksTriggered) {
		console.log(
			"- Strict check mode failed: required checks could not be evaluated",
		);
	}

	if (!passed) {
		for (const failure of result.failures) {
			console.log(`- Failure: ${failure}`);
		}
		process.exit(1);
	}

	console.log("Policy gate passed");
}

try {
	main();
} catch (error: unknown) {
	const message = error instanceof Error ? error.message : "Unknown error";
	console.error(`risk-policy-gate failed: ${message}`);
	process.exit(1);
}
