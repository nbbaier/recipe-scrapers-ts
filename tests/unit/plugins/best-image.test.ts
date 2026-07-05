/**
 * Characterization tests for BestImagePlugin.
 *
 * These tests pin the CURRENT behavior of the plugin's candidate collection
 * and scoring logic. They do not assert the behavior is "correct" -- only
 * that it is stable, so a later refactor (see #25) has a safety net.
 */

import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import { BestImagePlugin } from "../../../src/plugins/best-image";

function wrapImage(returnValue: unknown) {
  const decorated = function image() {
    return returnValue;
  };
  return BestImagePlugin.run(decorated as never);
}

function makeScraper(overrides: Record<string, unknown> = {}) {
  return {
    bestImageSelection: true,
    schema: undefined,
    $: undefined,
    ...overrides,
  };
}

describe("BestImagePlugin", () => {
  it("returns the decorated value unchanged when bestImageSelection is false", () => {
    const wrapped = wrapImage("https://example.com/original.jpg");
    const result = wrapped.call(makeScraper({ bestImageSelection: false }));
    expect(result).toBe("https://example.com/original.jpg");
  });

  it("returns the primary image unchanged when no candidates are found", () => {
    const wrapped = wrapImage("");
    const result = wrapped.call(makeScraper());
    expect(result).toBe("");
  });

  it("prefers the candidate with the larger area", () => {
    const wrapped = wrapImage("http://example.com/a.jpg");
    const scraper = makeScraper({
      schema: {
        data: {
          image: {
            url: "https://example.com/b.jpg",
            width: 800,
            height: 600,
          },
        },
      },
    });
    const result = wrapped.call(scraper);
    expect(result).toBe("https://example.com/b.jpg");
  });

  it("prefers https over http when areas tie", () => {
    const wrapped = wrapImage("http://example.com/a.jpg");
    const scraper = makeScraper({
      schema: { data: { image: { url: "https://example.com/b.jpg" } } },
    });
    const result = wrapped.call(scraper);
    expect(result).toBe("https://example.com/b.jpg");
  });

  it("prefers the earlier-registered candidate when area and security tie", () => {
    const wrapped = wrapImage("https://example.com/a.jpg");
    const scraper = makeScraper({
      schema: { data: { image: { url: "https://example.com/b.jpg" } } },
    });
    const result = wrapped.call(scraper);
    expect(result).toBe("https://example.com/a.jpg");
  });

  it("parses dimensions embedded in the URL path", () => {
    const wrapped = wrapImage("");
    const scraper = makeScraper({
      schema: {
        data: {
          image: [
            "https://example.com/photo-1200x800.jpg",
            "https://example.com/photo-100x100.jpg",
          ],
        },
      },
    });
    const result = wrapped.call(scraper);
    expect(result).toBe("https://example.com/photo-1200x800.jpg");
  });

  it("parses dimensions from width/height query parameters", () => {
    const wrapped = wrapImage("https://example.com/dimensionless.jpg");
    const scraper = makeScraper({
      schema: { data: { image: "https://example.com/i.jpg?w=1000&h=900" } },
    });
    const result = wrapped.call(scraper);
    expect(result).toBe("https://example.com/i.jpg?w=1000&h=900");
  });

  it("collects OpenGraph image candidates from meta tags", () => {
    const html = `
      <html><head>
        <meta property="og:image" content="https://example.com/og.jpg">
        <meta property="og:image:width" content="2000">
        <meta property="og:image:height" content="1500">
      </head></html>
    `;
    const wrapped = wrapImage("https://example.com/primary.jpg");
    const scraper = makeScraper({ $: load(html) });
    const result = wrapped.call(scraper);
    expect(result).toBe("https://example.com/og.jpg");
  });

  it("merges duplicate URLs across sources, keeping the maximum known dimensions", () => {
    const html = `
      <html><head>
        <meta property="og:image" content="https://example.com/shared.jpg">
        <meta property="og:image:width" content="500">
        <meta property="og:image:height" content="500">
      </head></html>
    `;
    const wrapped = wrapImage("https://example.com/shared.jpg");
    const scraper = makeScraper({
      schema: {
        data: {
          image: {
            url: "https://example.com/small.jpg",
            width: 10,
            height: 10,
          },
        },
      },
      $: load(html),
    });
    const result = wrapped.call(scraper);
    expect(result).toBe("https://example.com/shared.jpg");
  });

  it("parses width/height objects with a value property", () => {
    const wrapped = wrapImage("https://example.com/primary2.jpg");
    const scraper = makeScraper({
      schema: {
        data: {
          image: {
            url: "https://example.com/c.jpg",
            width: { value: "640" },
            height: { value: "480" },
          },
        },
      },
    });
    const result = wrapped.call(scraper);
    expect(result).toBe("https://example.com/c.jpg");
  });
});
