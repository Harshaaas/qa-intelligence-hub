import { useCallback, useEffect, useRef, useState } from "react";
import { checkUrl, loadHealthCache, saveHealthCache } from "../lib/healthCheck.js";

const INTERVAL_MS = 60000;

// Checks the given URLs now and every minute, but only while `active` is true
export function useHealthChecks(urls, active) {
  const [results, setResults] = useState(loadHealthCache);
  const [checking, setChecking] = useState(false);
  const [, setTick] = useState(0);
  const key = urls.join("|");
  const running = useRef(false);

  const checkAll = useCallback(async () => {
    if (running.current || urls.length === 0) return;
    running.current = true;
    setChecking(true);
    setResults((prev) => ({ ...prev, ...Object.fromEntries(urls.map((u) => [u, { ...prev[u], checking: true }])) }));

    const fresh = await Promise.all(urls.map(async (u) => [u, await checkUrl(u)]));
    setResults((prev) => {
      const next = { ...prev, ...Object.fromEntries(fresh) };
      saveHealthCache(next);
      return next;
    });
    running.current = false;
    setChecking(false);
  }, [key]);

  useEffect(() => {
    if (!active) return;
    checkAll();
    const every = setInterval(checkAll, INTERVAL_MS);
    const clock = setInterval(() => setTick((t) => t + 1), 15000); // refresh "x min ago"
    return () => { clearInterval(every); clearInterval(clock); };
  }, [active, checkAll]);

  return { results, checking, checkNow: checkAll };
}
