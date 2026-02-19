import { describe, expect, it } from "vitest";
import {
  computeRiskTier,
  evaluateDocsDriftRule,
  evaluatePolicyGate,
  evaluateRequiredChecks,
  evaluateReviewAgentRule,
  pathMatchesGlob,
  type RiskPolicyContract,
} from "../../../src/utils/risk-policy";

const baseContract: RiskPolicyContract = {
  version: "1",
  riskTierRules: {
    high: ["src/parsers/**", "policy/**"],
    medium: ["src/utils/**", "tests/**"],
    low: ["**"],
  },
  mergePolicy: {
    high: {
      requiredChecks: ["risk-policy-gate", "test", "code-review-agent"],
    },
    medium: {
      requiredChecks: ["risk-policy-gate", "test"],
    },
    low: {
      requiredChecks: ["risk-policy-gate"],
    },
  },
  docsDriftRules: {
    triggerPaths: ["policy/**", "scripts/risk-policy-gate.ts"],
    requiredDocs: ["docs/control-plane.md"],
  },
  evidenceRules: {
    triggerPaths: ["dashboard.html"],
    requiredEvidence: ["artifacts/browser-evidence/manifest.json"],
  },
  reviewAgentRule: {
    checkName: "code-review-agent",
    requiredForTiers: ["high"],
    requireCurrentHeadSha: true,
  },
};

describe("pathMatchesGlob", () => {
  it("matches recursive patterns", () => {
    expect(pathMatchesGlob("src/parsers/schema-org.ts", "src/parsers/**")).toBe(
      true,
    );
    expect(pathMatchesGlob("src/utils/url.ts", "src/parsers/**")).toBe(false);
  });

  it("matches single-segment wildcard patterns", () => {
    expect(pathMatchesGlob("src/utils/url.ts", "src/utils/*.ts")).toBe(true);
    expect(pathMatchesGlob("src/utils/nested/url.ts", "src/utils/*.ts")).toBe(
      false,
    );
  });
});

describe("computeRiskTier", () => {
  it("selects the highest risk tier touched by changed files", () => {
    const result = computeRiskTier(
      ["README.md", "src/parsers/schema-org.ts"],
      baseContract.riskTierRules,
    );
    expect(result.tier).toBe("high");
  });

  it("falls back to lower tiers when no high-risk file is present", () => {
    const result = computeRiskTier(
      ["src/utils/url.ts"],
      baseContract.riskTierRules,
    );
    expect(result.tier).toBe("medium");
  });
});

describe("evaluateDocsDriftRule", () => {
  it("fails when control-plane files change without docs updates", () => {
    const result = evaluateDocsDriftRule(
      ["policy/risk-policy.contract.json"],
      baseContract.docsDriftRules,
    );
    expect(result.triggered).toBe(true);
    expect(result.passed).toBe(false);
  });

  it("passes when required docs are included", () => {
    const result = evaluateDocsDriftRule(
      ["policy/risk-policy.contract.json", "docs/control-plane.md"],
      baseContract.docsDriftRules,
    );
    expect(result.triggered).toBe(true);
    expect(result.passed).toBe(true);
  });
});

describe("evaluateRequiredChecks", () => {
  it("marks missing and failed checks correctly", () => {
    const result = evaluateRequiredChecks(
      ["risk-policy-gate", "test", "lint"],
      {
        "risk-policy-gate": "success",
        test: "failure",
      },
    );
    expect(result.evaluated).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.successful).toEqual(["risk-policy-gate"]);
    expect(result.failed).toEqual(["test"]);
    expect(result.missing).toEqual(["lint"]);
  });

  it("is permissive when no check statuses are provided", () => {
    const result = evaluateRequiredChecks(["risk-policy-gate"]);
    expect(result.evaluated).toBe(false);
    expect(result.passed).toBe(true);
  });
});

describe("evaluateReviewAgentRule", () => {
  it("enforces current-head SHA for required tiers", () => {
    const result = evaluateReviewAgentRule(
      baseContract.reviewAgentRule,
      "high",
      { "code-review-agent": "success" },
      "head-sha",
      "old-sha",
    );
    expect(result.required).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.shaMatchesHead).toBe(false);
  });

  it("passes when review status is clean and SHA matches", () => {
    const result = evaluateReviewAgentRule(
      baseContract.reviewAgentRule,
      "high",
      { "code-review-agent": "success" },
      "head-sha",
      "head-sha",
    );
    expect(result.passed).toBe(true);
  });
});

describe("evaluatePolicyGate", () => {
  it("fails when multiple policy constraints are violated", () => {
    const result = evaluatePolicyGate({
      contract: baseContract,
      changedFiles: ["policy/risk-policy.contract.json", "dashboard.html"],
      checkStatuses: {
        "risk-policy-gate": "success",
        test: "failure",
        "code-review-agent": "success",
      },
      headSha: "head",
      reviewAgentHeadSha: "head",
    });

    expect(result.passed).toBe(false);
    expect(result.docsDrift.passed).toBe(false);
    expect(result.evidence.passed).toBe(false);
    expect(result.requiredChecks.failed).toContain("test");
  });

  it("passes when all required constraints are satisfied", () => {
    const result = evaluatePolicyGate({
      contract: baseContract,
      changedFiles: [
        "policy/risk-policy.contract.json",
        "docs/control-plane.md",
      ],
      checkStatuses: {
        "risk-policy-gate": "success",
        test: "success",
        "code-review-agent": "success",
      },
      headSha: "head",
      reviewAgentHeadSha: "head",
    });

    expect(result.passed).toBe(true);
    expect(result.failures).toEqual([]);
  });
});
