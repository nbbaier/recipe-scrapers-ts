/**
 * Tests for OpenGraph parser
 */

import { OpenGraph } from '../../../src/parsers/opengraph';
import { OpenGraphException } from '../../../src/exceptions';

describe('OpenGraph Parser', () => {
  describe('Site Name Extraction', () => {
    it('should extract site name from property attribute', () => {
      const html = `
        <html>
          <head>
            <meta property="og:site_name" content="Test Recipe Site" />
          </head>
        </html>
      `;

      const og = new OpenGraph(html);
      expect(og.siteName()).toBe('Test Recipe Site');
    });

    it('should extract site name from name attribute as fallback', () => {
      const html = `
        <html>
          <head>
            <meta name="og:site_name" content="Test Recipe Site" />
          </head>
        </html>
      `;

      const og = new OpenGraph(html);
      expect(og.siteName()).toBe('Test Recipe Site');
    });

    it('should prefer property attribute over name attribute', () => {
      const html = `
        <html>
          <head>
            <meta name="og:site_name" content="From Name" />
            <meta property="og:site_name" content="From Property" />
          </head>
        </html>
      `;

      const og = new OpenGraph(html);
      expect(og.siteName()).toBe('From Property');
    });

    it('should throw OpenGraphException when site name is not found', () => {
      const html = '<html><head></head></html>';
      const og = new OpenGraph(html);

      expect(() => og.siteName()).toThrow(OpenGraphException);
      expect(() => og.siteName()).toThrow('Site name not found in OpenGraph metadata.');
    });

    it('should throw OpenGraphException when site name meta tag has no content', () => {
      const html = `
        <html>
          <head>
            <meta property="og:site_name" />
          </head>
        </html>
      `;

      const og = new OpenGraph(html);
      expect(() => og.siteName()).toThrow(OpenGraphException);
    });

    it('should throw OpenGraphException when content attribute is empty', () => {
      const html = `
        <html>
          <head>
            <meta property="og:site_name" content="" />
          </head>
        </html>
      `;

      const og = new OpenGraph(html);
      expect(() => og.siteName()).toThrow(OpenGraphException);
    });
  });

  describe('Image Extraction', () => {
    it('should extract image URL from og:image meta tag', () => {
      const html = `
        <html>
          <head>
            <meta property="og:image" content="https://example.com/image.jpg" />
          </head>
        </html>
      `;

      const og = new OpenGraph(html);
      expect(og.image()).toBe('https://example.com/image.jpg');
    });

    it('should handle multiple og:image tags and return first', () => {
      const html = `
        <html>
          <head>
            <meta property="og:image" content="https://example.com/first.jpg" />
            <meta property="og:image" content="https://example.com/second.jpg" />
          </head>
        </html>
      `;

      const og = new OpenGraph(html);
      expect(og.image()).toBe('https://example.com/first.jpg');
    });

    it('should throw OpenGraphException when image is not found', () => {
      const html = '<html><head></head></html>';
      const og = new OpenGraph(html);

      expect(() => og.image()).toThrow(OpenGraphException);
      expect(() => og.image()).toThrow('Image not found in OpenGraph metadata.');
    });

    it('should throw OpenGraphException when image meta tag has no content', () => {
      const html = `
        <html>
          <head>
            <meta property="og:image" />
          </head>
        </html>
      `;

      const og = new OpenGraph(html);
      expect(() => og.image()).toThrow(OpenGraphException);
    });

    it('should throw OpenGraphException when content attribute is empty', () => {
      const html = `
        <html>
          <head>
            <meta property="og:image" content="" />
          </head>
        </html>
      `;

      const og = new OpenGraph(html);
      expect(() => og.image()).toThrow(OpenGraphException);
    });

    it('should handle relative image URLs', () => {
      const html = `
        <html>
          <head>
            <meta property="og:image" content="/images/recipe.jpg" />
          </head>
        </html>
      `;

      const og = new OpenGraph(html);
      expect(og.image()).toBe('/images/recipe.jpg');
    });

    it('should handle data URIs', () => {
      const html = `
        <html>
          <head>
            <meta property="og:image" content="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" />
          </head>
        </html>
      `;

      const og = new OpenGraph(html);
      expect(og.image()).toContain('data:image/png;base64');
    });
  });

  describe('Complex HTML Scenarios', () => {
    it('should handle HTML with many meta tags', () => {
      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width" />
            <meta property="og:title" content="Recipe Title" />
            <meta property="og:site_name" content="Cooking Site" />
            <meta property="og:description" content="A delicious recipe" />
            <meta property="og:image" content="https://example.com/recipe.jpg" />
            <meta property="og:url" content="https://example.com/recipe" />
            <meta name="twitter:card" content="summary_large_image" />
          </head>
        </html>
      `;

      const og = new OpenGraph(html);
      expect(og.siteName()).toBe('Cooking Site');
      expect(og.image()).toBe('https://example.com/recipe.jpg');
    });

    it('should handle malformed HTML gracefully', () => {
      const html = `
        <html>
          <meta property="og:site_name" content="Test Site">
          <meta property="og:image" content="https://example.com/image.jpg">
        </html>
      `;

      const og = new OpenGraph(html);
      expect(og.siteName()).toBe('Test Site');
      expect(og.image()).toBe('https://example.com/image.jpg');
    });

    it('should handle empty HTML', () => {
      const og = new OpenGraph('');
      expect(() => og.siteName()).toThrow(OpenGraphException);
      expect(() => og.image()).toThrow(OpenGraphException);
    });

    it('should handle HTML with only body content', () => {
      const html = '<html><body><p>No meta tags here</p></body></html>';
      const og = new OpenGraph(html);

      expect(() => og.siteName()).toThrow(OpenGraphException);
      expect(() => og.image()).toThrow(OpenGraphException);
    });
  });

  describe('Special Characters and Encoding', () => {
    it('should handle site names with special characters', () => {
      const html = `
        <html>
          <head>
            <meta property="og:site_name" content="Chef's Kitchen & Bakery" />
          </head>
        </html>
      `;

      const og = new OpenGraph(html);
      expect(og.siteName()).toBe("Chef's Kitchen & Bakery");
    });

    it('should handle HTML entities in content', () => {
      const html = `
        <html>
          <head>
            <meta property="og:site_name" content="Mom&apos;s Recipe Box" />
          </head>
        </html>
      `;

      const og = new OpenGraph(html);
      expect(og.siteName()).toBe("Mom's Recipe Box");
    });

    it('should handle unicode characters', () => {
      const html = `
        <html>
          <head>
            <meta property="og:site_name" content="Café Français 🍰" />
          </head>
        </html>
      `;

      const og = new OpenGraph(html);
      expect(og.siteName()).toBe('Café Français 🍰');
    });
  });
});
