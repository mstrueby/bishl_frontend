export const invalidReasonCodeMap: Record<string, string> = {
  MULTIPLE_PRIMARY: "Mehrere Erstpässe vorhanden",
  TOO_MANY_LOAN: "Zu viele Leihpässe vorhanden",
  LOAN_CLUB_CONFLICT: "Leihpasskonflikt",
  AGE_GROUP_VIOLATION: "Altersklasse nicht erlaubt",
  OVERAGE_NOT_ALLOWED: "Over-Age nicht zulässig",
  EXCEEDS_WKO_LIMIT: "WKO-Limit überschritten",
  CONFLICTING_CLUB: "Widersprüchlicher Verein",
  IMPORT_CONFLICT: "Import-Konflikt",
  UNKNOWN_LICENCE_TYPE: "Unbekannter Passtyp",
  HOBBY_PLAYER_CONFLICT: "Hobbyspieler-Konflikt",
  LOAN_AGE_GROUP_CONFLICT: "Leihpass-Altersklassenkonflikt",
  SUSPENDED: "Gesperrt",
  CALLED_LIMIT_EXCEEDED: "Maximales Hochspielen überschritten",
};

export const licenceTypeBadgeColors: Record<string, string> = {
  PRIMARY: "bg-green-50 text-green-700 ring-green-600/20",
  SECONDARY: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  OVERAGE: "bg-pink-50 text-pink-700 ring-pink-600/20",
  LOAN: "bg-blue-50 text-blue-700 ring-blue-600/20",
  DEVELOPMENT: "bg-purple-50 text-purple-700 ring-purple-600/20",
  SPECIAL: "bg-red-50 text-red-700 ring-red-600/20",
};

export const sourceBadgeColors: Record<string, string> = {
  ISHD: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  BISHL: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
};

export const badgeBase = "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset";

export const passNoBadgeClass = `${badgeBase} bg-gray-50 text-gray-600 ring-gray-500/10`;

export const defaultBadgeColors = "bg-gray-50 text-gray-700 ring-gray-600/20";

export function getLicenceTypeBadgeClass(licenseType?: string): string {
  if (licenseType && licenceTypeBadgeColors[licenseType]) {
    return `${badgeBase} ${licenceTypeBadgeColors[licenseType]}`;
  }
  return `${badgeBase} ${defaultBadgeColors}`;
}

export function getSourceBadgeClass(source?: string): string {
  if (source && sourceBadgeColors[source]) {
    return `${badgeBase} ${sourceBadgeColors[source]}`;
  }
  return `${badgeBase} ${defaultBadgeColors}`;
}
