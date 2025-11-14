/**
 * URL parsing utilities for recipe scrapers
 */

/**
 * Interface representing the parsed components of a URL
 */
export interface UrlComponents {
  schema?: string;
  user?: string;
  password?: string;
  host: string;
  port?: string;
  path?: string;
  query?: string;
}

/**
 * Parses a URL path into its component parts.
 * Extracts schema, user, password, host, port, path, and query.
 *
 * @param path - The URL to parse
 * @returns Object with URL components, or null if parsing fails
 *
 * @example
 * urlPathToDict("https://www.example.com:8080/path?query=1")
 * // Returns: {
 * //   schema: "https",
 * //   host: "www.example.com",
 * //   port: "8080",
 * //   path: "/path",
 * //   query: "?query=1"
 * // }
 */
export function urlPathToDict(path: string): UrlComponents | null {
  const pattern =
    /^((?<schema>.+?):\/\/)?((?<user>.+?)(:(?<password>.*?))?@)?(?<host>[^:/]+)(:(?<port>\d+?))?(?<path>\/.*?)?(?<query>[?].*?)?$/;

  const match = path.match(pattern);
  if (!match || !match.groups) {
    return null;
  }

  const groups = match.groups;

  return {
    schema: groups.schema,
    user: groups.user,
    password: groups.password,
    host: groups.host,
    port: groups.port,
    path: groups.path,
    query: groups.query,
  };
}

/**
 * Extracts the hostname from a URL, removing 'www.' prefix if present.
 *
 * @param url - The URL to extract hostname from
 * @returns The hostname without 'www.' prefix
 *
 * @example
 * getHostName("https://www.example.com/path")
 * // Returns: "example.com"
 *
 * getHostName("https://subdomain.example.com")
 * // Returns: "subdomain.example.com"
 */
export function getHostName(url: string): string {
  const normalized = url.replace('://www.', '://');
  const parsed = urlPathToDict(normalized);
  return parsed?.host || '';
}

/**
 * Extracts the last segment (slug) from a URL path.
 *
 * @param url - The URL to extract slug from
 * @returns The last path segment
 *
 * @example
 * getUrlSlug("https://example.com/recipes/chocolate-cake")
 * // Returns: "chocolate-cake"
 *
 * getUrlSlug("https://example.com/recipes/")
 * // Returns: ""
 */
export function getUrlSlug(url: string): string {
  const parsed = urlPathToDict(url);
  const path = parsed?.path || '';
  const segments = path.split('/');
  return segments[segments.length - 1] || '';
}
