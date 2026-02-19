/**
 * PinchOfYum scraper
 * https://pinchofyum.com/
 *
 * Minimal scraper - relies on Schema.org structured data via plugins
 */

import { AbstractScraper } from "../abstract";

export class PinchOfYumScraper extends AbstractScraper {
  host(): string {
    return "pinchofyum.com";
  }
}
