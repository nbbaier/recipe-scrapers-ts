/**
 * BestImagePlugin
 *
 * Selects the best available recipe image when requested.
 * Analyzes multiple image sources and chooses based on dimensions, security, and order.
 */

import { settings } from '../settings';
import { PluginInterface } from './interface';

interface ImageCandidate {
  url: string;
  width: number | null;
  height: number | null;
  sources?: Set<string>;
  order?: number;
}

export class BestImagePlugin extends PluginInterface {
  static override runOnHosts = ['*'];
  static override runOnMethods = ['image'];

  private static readonly DIMENSION_PATTERN =
    /(?:^|[^0-9])(?<width>\d{3,5})[xX](?<height>\d{3,5})(?:[^0-9]|$)/;
  private static readonly QUERY_WIDTH_PATTERN = /[?&](?:w|width)=(\d{3,5})/i;
  private static readonly QUERY_HEIGHT_PATTERN = /[?&](?:h|height)=(\d{3,5})/i;

  static override run<T extends (...args: any[]) => any>(decorated: T): T {
    const wrapper = function (this: any, ...args: any[]) {
      if (settings.LOG_LEVEL <= 0) {
        // debug level
        const className = this.constructor.name;
        const methodName = decorated.name;
        console.debug(
          `Decorating: ${className}.${methodName}() with BestImagePlugin`
        );
      }

      const image = decorated.apply(this, args);

      if (!this.bestImageSelection) {
        return image;
      }

      const candidates = BestImagePlugin._collectCandidates(this, image);
      if (!candidates || candidates.length === 0) {
        return image;
      }

      const best = BestImagePlugin._selectBestCandidate(candidates);
      return best || image;
    };

    Object.defineProperty(wrapper, 'name', { value: decorated.name });
    return wrapper as T;
  }

  private static _collectCandidates(scraper: any, image: any): ImageCandidate[] {
    const candidates: Map<string, ImageCandidate> = new Map();

    const register = (entry: any, source: string): void => {
      for (const normalized of this._normalizeEntries(entry)) {
        this._mergeCandidate(candidates, normalized, source);
      }
    };

    register(image, 'primary');

    // Get schema images
    const schemaData = scraper.schema?.data;
    if (schemaData && typeof schemaData === 'object') {
      register(schemaData.image, 'schema');
    }

    // Collect OpenGraph candidates
    this._collectOpenGraphCandidates(scraper, candidates);

    return Array.from(candidates.values());
  }

  private static *_normalizeEntries(entry: any): Generator<ImageCandidate> {
    if (!entry) {
      return;
    }

    if (Array.isArray(entry)) {
      for (const item of entry) {
        yield* this._normalizeEntries(item);
      }
      return;
    }

    if (typeof entry === 'object' && !(entry instanceof Set)) {
      const url =
        entry.url || entry['@id'] || entry.contentUrl || entry.contentURL;
      let urlString: string | undefined;

      if (Array.isArray(url)) {
        urlString = url[0];
      } else if (url) {
        urlString = String(url);
      }

      if (!urlString) {
        return;
      }

      const width = this._parseDimension(
        entry.width || entry.pixelWidth || entry.contentWidth
      );
      const height = this._parseDimension(
        entry.height || entry.pixelHeight || entry.contentHeight
      );

      yield {
        url: urlString.trim(),
        width,
        height,
      };
      return;
    }

    if (typeof entry === 'string') {
      const trimmed = entry.trim();
      if (trimmed) {
        yield { url: trimmed, width: null, height: null };
      }
      return;
    }
  }

  private static _collectOpenGraphCandidates(
    scraper: any,
    candidates: Map<string, ImageCandidate>
  ): void {
    const $ = scraper.$;
    if (!$) {
      return;
    }

    const images: Map<string, ImageCandidate> = new Map();
    let currentUrl: string | null = null;

    const metas = $('meta').toArray();
    for (const meta of metas) {
      const $meta = $(meta);
      const prop = (
        $meta.attr('property') ||
        $meta.attr('name') ||
        ''
      ).toLowerCase();
      const content = $meta.attr('content');

      if (!content) {
        continue;
      }

      if (
        prop === 'og:image' ||
        prop === 'og:image:url' ||
        prop === 'og:image:secure_url'
      ) {
        const url = String(content).trim();
        currentUrl = url;
        if (!images.has(url)) {
          images.set(url, { url, width: null, height: null });
        }
        const current = images.get(url)!;
        this._mergeCandidate(candidates, current, 'opengraph');
      } else if (prop === 'og:image:width' && currentUrl && images.has(currentUrl)) {
        const candidate = images.get(currentUrl)!;
        candidate.width = this._parseDimension(content);
        this._mergeCandidate(candidates, candidate, 'opengraph');
      } else if (prop === 'og:image:height' && currentUrl && images.has(currentUrl)) {
        const candidate = images.get(currentUrl)!;
        candidate.height = this._parseDimension(content);
        this._mergeCandidate(candidates, candidate, 'opengraph');
      }
    }
  }

  private static _mergeCandidate(
    candidates: Map<string, ImageCandidate>,
    candidate: ImageCandidate | null,
    source: string
  ): void {
    if (!candidate) {
      return;
    }

    const url = candidate.url?.trim();
    if (!url) {
      return;
    }

    const width = this._parseDimension(candidate.width);
    const height = this._parseDimension(candidate.height);

    const existing = candidates.get(url);
    if (!existing) {
      candidates.set(url, {
        url,
        width,
        height,
        sources: new Set([source]),
        order: candidates.size,
      });
      return;
    }

    if (width !== null) {
      existing.width = this._maxDimension(existing.width, width);
    }
    if (height !== null) {
      existing.height = this._maxDimension(existing.height, height);
    }
    existing.sources = existing.sources || new Set();
    existing.sources.add(source);
  }

  private static _maxDimension(
    current: number | null,
    newVal: number | null
  ): number | null {
    if (current === null) return newVal;
    if (newVal === null) return current;
    return Math.max(current, newVal);
  }

  private static _parseDimension(value: any): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return Math.floor(value);
    }

    if (typeof value === 'string') {
      const match = value.match(/\d+/);
      if (match) {
        const parsed = parseInt(match[0], 10);
        return isNaN(parsed) ? null : parsed;
      }
      return null;
    }

    if (typeof value === 'object') {
      for (const key of ['value', 'maxValue', 'minValue']) {
        if (key in value) {
          const parsed = this._parseDimension(value[key]);
          if (parsed !== null) {
            return parsed;
          }
        }
      }
    }

    return null;
  }

  private static _selectBestCandidate(
    candidates: ImageCandidate[]
  ): string | null {
    let bestCandidate: ImageCandidate | null = null;
    let bestScore: [number, number, number] = [-1, 0, 0];

    for (const candidate of candidates) {
      const score = this._scoreCandidate(candidate);
      if (
        score[0] > bestScore[0] ||
        (score[0] === bestScore[0] && score[1] > bestScore[1]) ||
        (score[0] === bestScore[0] &&
          score[1] === bestScore[1] &&
          score[2] > bestScore[2])
      ) {
        bestCandidate = candidate;
        bestScore = score;
      }
    }

    return bestCandidate?.url || null;
  }

  private static _scoreCandidate(
    candidate: ImageCandidate
  ): [number, number, number] {
    const [width, height] = this._ensureDimensions(candidate);

    let area = 0;
    if (width && height) {
      area = width * height;
    } else if (width || height) {
      const side = width || height;
      if (side) {
        area = side * side;
      }
    }

    const secure = candidate.url?.startsWith('https://') ? 1 : 0;
    // Negate order so that lower (earlier) order values are preferred when area and security are equal.
    const order = -(candidate.order ?? 0);

    return [area, secure, order];
  }

  private static _ensureDimensions(
    candidate: ImageCandidate
  ): [number | null, number | null] {
    let { width, height } = candidate;

    if (width && height) {
      return [width, height];
    }

    const dims = this._extractDimensionsFromUrl(candidate.url);
    if (dims) {
      width = width ?? dims[0];
      height = height ?? dims[1];
      candidate.width = width;
      candidate.height = height;
    }

    return [width, height];
  }

  private static _extractDimensionsFromUrl(
    url: string
  ): [number, number] | null {
    if (!url) {
      return null;
    }

    const match = url.match(this.DIMENSION_PATTERN);
    if (match?.groups) {
      const width = parseInt(match.groups.width, 10);
      const height = parseInt(match.groups.height, 10);
      if (!isNaN(width) && !isNaN(height)) {
        return [width, height];
      }
    }

    const widthMatch = url.match(this.QUERY_WIDTH_PATTERN);
    const heightMatch = url.match(this.QUERY_HEIGHT_PATTERN);

    if (widthMatch && heightMatch) {
      const width = parseInt(widthMatch[1], 10);
      const height = parseInt(heightMatch[1], 10);
      if (!isNaN(width) && !isNaN(height)) {
        return [width, height];
      }
    }

    return null;
  }
}
