import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const POLL_INTERVAL = 3000;
const MAX_ATTEMPTS = 30;

function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { method: 'GET', signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

export default function DemoWarmup() {
  const [backendReady, setBackendReady] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const pingBackend = useCallback(async (): Promise<boolean> => {
    if (!API_URL) return false;
    try {
      const res = await fetchWithTimeout(`${API_URL}/health`, 10000);
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const startPolling = useCallback(() => {
    let cancelled = false;
    let attempt = 0;

    async function poll() {
      while (!cancelled && attempt < MAX_ATTEMPTS) {
        const ok = await pingBackend();
        if (ok) {
          if (!cancelled) {
            setTimedOut(false);
            setBackendReady(true);
            setFadingOut(true);
          }
          return;
        }
        attempt++;
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      }
      if (!cancelled) {
        setTimedOut(true);
      }
    }

    poll();
    return () => { cancelled = true; };
  }, [pingBackend]);

  useEffect(() => {
    if (!API_URL) return;
    return startPolling();
  }, [startPolling]);

  useEffect(() => {
    if (fadingOut) {
      const timer = setTimeout(() => setDismissed(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [fadingOut]);

  if (dismissed || !API_URL) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 px-4 py-2 text-sm transition-all duration-700 ${
        fadingOut
          ? 'opacity-0 -translate-y-full'
          : 'opacity-100 translate-y-0'
      } ${
        backendReady
          ? 'bg-green-600 text-white'
          : timedOut
            ? 'bg-red-600 text-white'
            : 'bg-amber-500 text-white'
      }`}
    >
      {backendReady ? (
        <span>Server is ready!</span>
      ) : timedOut ? (
        <>
          <span>Server is still starting up.</span>
          <button
            onClick={() => {
              setTimedOut(false);
              startPolling();
            }}
            className="ml-1 underline hover:no-underline"
          >
            Retry
          </button>
        </>
      ) : (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <span>Demo server is waking up, please wait...</span>
        </>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 rounded px-1.5 py-0.5 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}
