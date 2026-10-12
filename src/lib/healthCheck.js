// Checks whether a URL responds, from the user's own browser.
//
// Limits (see README): the browser can tell that a server answered and how
// long it took, but not the HTTP status code. Internal URLs need VPN, and
// self-signed certificates show as "Down". A server-side monitor removes
// these limits when the project goes live.

const TIMEOUT_MS = 10000;
const CACHE_KEY = "qahub-health-v1";

export async function checkUrl(url) {
  const at = new Date().toISOString();

  // A secure (https) page is not allowed to call http:// addresses
  if (window.location.protocol === "https:" && url.startsWith("http://")) {
    return { status: "unknown", ms: null, at, reason: "Browsers block checks of http:// addresses from a secure page." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = performance.now();
  try {
    await fetch(url, { mode: "no-cors", cache: "no-store", signal: controller.signal });
    return { status: "live", ms: Math.round(performance.now() - start), at };
  } catch (e) {
    return {
      status: "down",
      ms: null,
      at,
      reason: e.name === "AbortError"
        ? `No response within ${TIMEOUT_MS / 1000} seconds.`
        : "Couldn't reach the server. It may be offline, need VPN, or have a certificate problem.",
    };
  } finally {
    clearTimeout(timer);
  }
}

export function loadHealthCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) ?? {};
  } catch {
    return {};
  }
}

export function saveHealthCache(results) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(results));
  } catch { /* storage full: not critical */ }
}
