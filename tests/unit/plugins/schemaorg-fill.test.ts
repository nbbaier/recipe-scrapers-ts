/**
 * Characterization tests for SchemaOrgFillPlugin.
 *
 * These tests pin the CURRENT behavior of the schema.org fallback wrapper.
 * They do not assert the behavior is "correct" -- only that it is stable, so
 * a later refactor (see #25) has a safety net.
 */

import { describe, expect, it } from "vitest";
import {
  FillPluginException,
  NotImplementedError,
  RecipeSchemaNotFound,
} from "../../../src/exceptions";
import { SchemaOrgFillPlugin } from "../../../src/plugins/schemaorg-fill";

function makeWrapped(fn: (...args: unknown[]) => unknown) {
  return SchemaOrgFillPlugin.run(fn as never);
}

describe("SchemaOrgFillPlugin", () => {
  it("returns the decorated method's value when it succeeds", () => {
    const wrapped = makeWrapped(function title() {
      return "Direct Title";
    });
    const result = wrapped.call({
      schema: undefined,
      url: "https://example.com",
    });
    expect(result).toBe("Direct Title");
  });

  it("falls back to the schema method when NotImplementedError is thrown", () => {
    const wrapped = makeWrapped(function title() {
      throw new NotImplementedError("not implemented");
    });
    const schema = { data: {}, title: () => "From Schema" };
    const result = wrapped.call({ schema, url: "https://example.com" });
    expect(result).toBe("From Schema");
  });

  it("falls back to the schema method when FillPluginException is thrown", () => {
    const wrapped = makeWrapped(function title() {
      throw new FillPluginException("try schema");
    });
    const schema = { data: {}, title: () => "From Schema" };
    const result = wrapped.call({ schema, url: "https://example.com" });
    expect(result).toBe("From Schema");
  });

  it("throws RecipeSchemaNotFound when no schema data exists", () => {
    const wrapped = makeWrapped(function title() {
      throw new NotImplementedError("not implemented");
    });
    expect(() =>
      wrapped.call({ schema: undefined, url: "https://example.com" })
    ).toThrow(RecipeSchemaNotFound);
  });

  it("rethrows unrelated errors without attempting a schema fallback", () => {
    const wrapped = makeWrapped(function title() {
      throw new Error("boom");
    });
    const schema = { data: {}, title: () => "From Schema" };
    expect(() => wrapped.call({ schema, url: "https://example.com" })).toThrow(
      "boom"
    );
  });

  it("rethrows the original error when schema has no matching method", () => {
    const wrapped = makeWrapped(function title() {
      throw new NotImplementedError("not implemented");
    });
    const schema = { data: {} };
    expect(() => wrapped.call({ schema, url: "https://example.com" })).toThrow(
      NotImplementedError
    );
  });
});
