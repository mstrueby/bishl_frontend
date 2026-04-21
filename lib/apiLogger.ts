function formatLogLine(route: string, status?: number, message?: string): string {
  const parts: string[] = [`[${route}]`];
  if (status !== undefined) {
    parts.push(`HTTP ${status}`);
  }
  if (message) {
    parts.push(message);
  }
  return parts.join(' - ');
}

export function logApiError(route: string, status?: number, message?: string): void {
  console.error(formatLogLine(route, status, message));
}

export function logApiWarn(route: string, status?: number, message?: string): void {
  console.warn(formatLogLine(route, status, message));
}

export function logApiInfo(route: string, status?: number, message?: string): void {
  console.info(formatLogLine(route, status, message));
}
