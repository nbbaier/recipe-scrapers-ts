/**
 * OpenGraph parser for extracting metadata from og: meta tags
 *
 * This parser provides fallback functionality when Schema.org data is not available.
 * It extracts basic metadata like site name and images from OpenGraph meta tags.
 */

import * as cheerio from 'cheerio';
import { OpenGraphException } from '../exceptions';

/**
 * OpenGraph metadata parser
 */
export class OpenGraph {
  private readonly $: cheerio.CheerioAPI;

  /**
   * Creates a new OpenGraph parser instance
   *
   * @param html - HTML content of the page
   */
  constructor(html: string) {
    this.$ = cheerio.load(html) as cheerio.CheerioAPI;
  }

  /**
   * Extracts site name from OpenGraph metadata
   *
   * @returns Site name from og:site_name meta tag
   * @throws {OpenGraphException} If site name is not found
   */
  siteName(): string {
    // Try property attribute first
    let meta = this.$('meta[property="og:site_name"]');

    // Fall back to name attribute
    if (meta.length === 0) {
      meta = this.$('meta[name="og:site_name"]');
    }

    if (meta.length === 0) {
      throw new OpenGraphException('Site name not found in OpenGraph metadata.');
    }

    const content = meta.attr('content');
    if (!content) {
      throw new OpenGraphException('Site name not found in OpenGraph metadata.');
    }

    return content;
  }

  /**
   * Extracts image URL from OpenGraph metadata
   *
   * @returns Image URL from og:image meta tag
   * @throws {OpenGraphException} If image is not found
   */
  image(): string {
    const meta = this.$('meta[property="og:image"][content]');

    if (meta.length === 0) {
      throw new OpenGraphException('Image not found in OpenGraph metadata.');
    }

    const content = meta.attr('content');
    if (!content) {
      throw new OpenGraphException('Image not found in OpenGraph metadata.');
    }

    return content;
  }
}
