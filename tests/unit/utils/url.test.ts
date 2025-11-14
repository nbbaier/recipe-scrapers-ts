/**
 * Tests for URL parsing utilities
 */

import {
  urlPathToDict,
  getHostName,
  getUrlSlug,
} from '../../../src/utils/url';

describe('urlPathToDict', () => {
  it('should parse complete URLs', () => {
    const result = urlPathToDict('https://www.example.com:8080/path?query=1');
    expect(result).toEqual({
      schema: 'https',
      user: undefined,
      password: undefined,
      host: 'www.example.com',
      port: '8080',
      path: '/path',
      query: '?query=1',
    });
  });

  it('should parse URLs without schema', () => {
    const result = urlPathToDict('example.com/path');
    expect(result?.host).toBe('example.com');
    expect(result?.path).toBe('/path');
    expect(result?.schema).toBeUndefined();
  });

  it('should parse URLs without port', () => {
    const result = urlPathToDict('https://example.com/path');
    expect(result?.host).toBe('example.com');
    expect(result?.port).toBeUndefined();
  });

  it('should parse URLs without path', () => {
    const result = urlPathToDict('https://example.com');
    expect(result?.host).toBe('example.com');
    expect(result?.path).toBeUndefined();
  });

  it('should parse URLs without query string', () => {
    const result = urlPathToDict('https://example.com/path');
    expect(result?.host).toBe('example.com');
    expect(result?.path).toBe('/path');
    expect(result?.query).toBeUndefined();
  });

  it('should parse URLs with user credentials', () => {
    const result = urlPathToDict('https://user:pass@example.com/path');
    expect(result?.user).toBe('user');
    expect(result?.password).toBe('pass');
    expect(result?.host).toBe('example.com');
  });

  it('should parse URLs with user but no password', () => {
    const result = urlPathToDict('https://user@example.com/path');
    expect(result?.user).toBe('user');
    expect(result?.password).toBeUndefined();
    expect(result?.host).toBe('example.com');
  });

  it('should handle http and https', () => {
    const https = urlPathToDict('https://example.com');
    expect(https?.schema).toBe('https');

    const http = urlPathToDict('http://example.com');
    expect(http?.schema).toBe('http');
  });

  it('should handle subdomains', () => {
    const result = urlPathToDict('https://subdomain.example.com/path');
    expect(result?.host).toBe('subdomain.example.com');
  });

  it('should handle complex paths', () => {
    const result = urlPathToDict('https://example.com/path/to/resource');
    expect(result?.path).toBe('/path/to/resource');
  });

  it('should handle complex query strings', () => {
    const result = urlPathToDict('https://example.com/path?foo=bar&baz=qux');
    expect(result?.query).toBe('?foo=bar&baz=qux');
  });

  it('should handle simple hostnames', () => {
    // Simple hostnames without schema are valid
    const result = urlPathToDict('example');
    expect(result?.host).toBe('example');
  });

  it('should handle recipe website URLs', () => {
    const result = urlPathToDict(
      'https://www.allrecipes.com/recipe/12345/chocolate-cake/'
    );
    expect(result?.schema).toBe('https');
    expect(result?.host).toBe('www.allrecipes.com');
    expect(result?.path).toBe('/recipe/12345/chocolate-cake/');
  });
});

describe('getHostName', () => {
  it('should extract hostname from URL', () => {
    expect(getHostName('https://example.com/path')).toBe('example.com');
    expect(getHostName('http://example.com')).toBe('example.com');
  });

  it('should remove www prefix', () => {
    expect(getHostName('https://www.example.com/path')).toBe('example.com');
    expect(getHostName('http://www.example.com')).toBe('example.com');
  });

  it('should preserve subdomains that are not www', () => {
    expect(getHostName('https://subdomain.example.com')).toBe(
      'subdomain.example.com'
    );
    expect(getHostName('https://api.example.com')).toBe('api.example.com');
  });

  it('should handle URLs with ports', () => {
    expect(getHostName('https://example.com:8080/path')).toBe('example.com');
    expect(getHostName('https://www.example.com:443')).toBe('example.com');
  });

  it('should handle recipe website URLs', () => {
    expect(getHostName('https://www.allrecipes.com/recipe/12345/')).toBe(
      'allrecipes.com'
    );
    expect(getHostName('https://www.foodnetwork.com/recipes')).toBe(
      'foodnetwork.com'
    );
    expect(getHostName('https://cooking.nytimes.com/recipes/12345')).toBe(
      'cooking.nytimes.com'
    );
  });

  it('should handle simple hostnames', () => {
    // Simple hostnames are valid
    expect(getHostName('localhost')).toBe('localhost');
  });
});

describe('getUrlSlug', () => {
  it('should extract last path segment', () => {
    expect(getUrlSlug('https://example.com/recipes/chocolate-cake')).toBe(
      'chocolate-cake'
    );
    expect(getUrlSlug('https://example.com/path/to/resource')).toBe('resource');
  });

  it('should handle URLs with trailing slashes', () => {
    expect(getUrlSlug('https://example.com/recipes/chocolate-cake/')).toBe('');
    expect(getUrlSlug('https://example.com/recipes/')).toBe('');
  });

  it('should handle URLs without paths', () => {
    expect(getUrlSlug('https://example.com')).toBe('');
    expect(getUrlSlug('https://example.com/')).toBe('');
  });

  it('should ignore query strings', () => {
    expect(getUrlSlug('https://example.com/path/slug?query=1')).toBe('slug');
  });

  it('should handle recipe URLs', () => {
    expect(
      getUrlSlug('https://www.allrecipes.com/recipe/12345/chocolate-cake')
    ).toBe('chocolate-cake');
    expect(getUrlSlug('https://example.com/recipes/vanilla-cupcakes')).toBe(
      'vanilla-cupcakes'
    );
  });

  it('should handle single-segment paths', () => {
    expect(getUrlSlug('https://example.com/recipes')).toBe('recipes');
  });

  it('should return empty string for URLs without paths', () => {
    expect(getUrlSlug('')).toBe('');
    expect(getUrlSlug('example.com')).toBe('');
  });
});
