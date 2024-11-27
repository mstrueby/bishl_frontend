/**
 * Returns a human-readable "fuzzy" date description.
 * @param {Date} pastDate - The past date to compare with the current date.
 * @returns {string} - A string describing the time difference.
 */

export function getFuzzyDate(pastDate: Date | string): string {
  // Convert to Date object if pastDate is a string and ensure UTC handling
  const utcPastDate = typeof pastDate === 'string'
    ? new Date(pastDate)
    : pastDate;
  // Ensure pastDate is a Date object
  if (!(utcPastDate instanceof Date) || isNaN(utcPastDate.getTime())) {
    throw new Error('Invalid date');
  }
  // Use UTC timestamps for comparison to avoid timezone issues
  const now = new Date();
  const diffInSeconds = Math.floor(
    (now.getTime() - utcPastDate.getTime()) / 1000
  );

  if (diffInSeconds < 60) {
    return 'gerade eben';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `vor ${diffInMinutes} Minute${diffInMinutes > 1 ? 'n' : ''}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `vor ${diffInHours} Stunde${diffInHours > 1 ? 'n' : ''}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `vor ${diffInDays} Tag${diffInDays > 1 ? 'en' : ''}`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `vor ${diffInMonths} Monat${diffInMonths > 1 ? 'en' : ''}`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `vor ${diffInYears} Jahr${diffInYears > 1 ? 'en' : ''}`;
}