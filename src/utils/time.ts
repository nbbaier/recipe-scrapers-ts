/**
 * Time parsing utilities for recipe scrapers
 */

import { Duration } from 'luxon';
import { extractFractional } from './fractions';

/**
 * Regular expression to match time components in text
 * Matches patterns like: "1 hour 30 minutes", "2h 15m", "45 min", etc.
 */
const TIME_REGEX =
  /(?:\D*(?<days>\d+)\s*(?:days|D))?(?:[^\d¼½¾⅓⅔⅕⅖⅗]*(?<hours>[\d.\s/?¼½¾⅓⅔⅕⅖⅗]+)\s*(?:hours|hrs|hr|h|óra|:))?(?:\D*(?<minutes>\d+(?:\.\d+)?)\s*(?:minutes|mins|min|m|perc|$))?(?:\D*(?<seconds>\d+)\s*(?:seconds|secs|sec|s))?/i;

/**
 * Parses a time element and returns the total time in minutes.
 * Handles ISO 8601 durations (PT1H30M), text formats ("1 hour 30 min"),
 * and numeric values.
 *
 * @param element - Time value as string, number, or HTML element text
 * @returns Total time in minutes, or null if parsing fails or time is 0
 * @throws {Error} If element is null or has unexpected format
 *
 * @example
 * getMinutes("PT1H30M") // Returns: 90
 * getMinutes("1 hour 30 minutes") // Returns: 90
 * getMinutes("45") // Returns: 45
 * getMinutes("2.5 hours") // Returns: 150
 * getMinutes("12-15 minutes") // Returns: 15 (uses max value)
 */
export function getMinutes(
  element: string | number | { text?: string } | null
): number | null {
  if (element === null || element === undefined) {
    throw new Error('Element cannot be null or undefined');
  }

  // Extract text from element if it's an object with a text property
  let timeText: string;
  if (typeof element === 'object' && 'text' in element && element.text) {
    timeText = element.text;
  } else if (typeof element === 'string') {
    timeText = element;
  } else if (typeof element === 'number') {
    // If it's already a number, try to parse it as integer minutes
    try {
      return parseInt(element.toString(), 10);
    } catch {
      throw new Error('Unexpected format for time element');
    }
  } else {
    throw new Error('Unexpected format for time element');
  }

  // Try parsing as integer
  const asInt = parseInt(timeText, 10);
  if (!isNaN(asInt) && asInt.toString() === timeText.trim()) {
    return asInt === 0 ? null : asInt;
  }

  // Handle range formats: "12-15 minutes" or "12 to 15 minutes"
  // Take the maximum value (end of range)
  if (timeText.includes('-')) {
    const parts = timeText.split('-');
    if (parts.length >= 2) {
      timeText = parts[1].trim();
    }
  }
  if (timeText.includes(' to ')) {
    const parts = timeText.split(' to ');
    if (parts.length >= 2) {
      timeText = parts[1].trim();
    }
  }

  if (!timeText) {
    return null;
  }

  // Attempt ISO 8601 duration parsing (e.g., PT1H30M)
  if (timeText.startsWith('P') && timeText.includes('T')) {
    try {
      const duration = Duration.fromISO(timeText);
      if (duration.isValid) {
        const totalMinutes = Math.ceil(duration.as('minutes'));
        return totalMinutes === 0 ? null : totalMinutes;
      }
    } catch {
      // Fall through to text parsing
    }
  }

  // Parse text-based time format
  const match = TIME_REGEX.exec(timeText);
  if (!match?.groups) {
    return null;
  }

  const timeUnits = match.groups;

  // Check if any time units were matched
  if (!Object.values(timeUnits).some((val) => val !== undefined)) {
    return null;
  }

  const daysMatched = timeUnits.days;
  const hoursMatched = timeUnits.hours;
  const minutesMatched = timeUnits.minutes;
  const secondsMatched = timeUnits.seconds;

  const days = daysMatched ? parseFloat(daysMatched) : 0;
  let hours = 0;
  if (hoursMatched && hoursMatched.trim()) {
    try {
      hours = extractFractional(hoursMatched);
    } catch {
      // If extraction fails, try parsing as float
      const parsed = parseFloat(hoursMatched);
      hours = isNaN(parsed) ? 0 : parsed;
    }
  }
  const minutes = minutesMatched ? parseFloat(minutesMatched) : 0;
  const seconds = secondsMatched ? parseFloat(secondsMatched) : 0;

  const totalMinutes = minutes + hours * 60 + days * 24 * 60 + seconds / 60;

  // Round to nearest whole number
  const roundedMinutes = Math.round(totalMinutes);

  return roundedMinutes === 0 ? null : roundedMinutes;
}
