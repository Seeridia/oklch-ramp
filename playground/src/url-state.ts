export function readUrlParam(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  return new URL(window.location.href).searchParams.get(name) ?? fallback;
}

export function updateUrlParams(
  values: Record<string, string | number | null>,
  mode: 'push' | 'replace' = 'push',
) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === '') url.searchParams.delete(key);
    else url.searchParams.set(key, String(value));
  }
  window.history[mode === 'push' ? 'pushState' : 'replaceState']({}, '', url);
}

export function urlWithParams(values: Record<string, string | number | null>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === '') url.searchParams.delete(key);
    else url.searchParams.set(key, String(value));
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
