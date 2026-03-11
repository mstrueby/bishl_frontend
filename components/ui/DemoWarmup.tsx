import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const FAST_POLL_INTERVAL = 3000;
const SLOW_POLL_INTERVAL = 10000;
const FAST_POLL_ATTEMPTS = 30;

function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { method: 'GET', signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

async function tryPing(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/health`, 10000);
    if (res.ok) return true;
  } catch {}
  try {
    const res = await fetchWithTimeout(`${baseUrl}/`, 10000);
    return res.ok;
  } catch {
    return false;
  }
}

export default function DemoWarmup() {
  const [backendReady, setBackendReady] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [slow, setSlow] = useState(false);
  const cancelRef = useRef<(() => void) | undefined>(undefined);

  const startPolling = useCallback(() => {
    if (!API_URL) return;
    if (cancelRef.current) cancelRef.current();

    let cancelled = false;
    cancelRef.current = () => { cancelled = true; };
    let attempt = 0;

    async function poll() {
      while (!cancelled) {
        const ok = await tryPing(API_URL!);
        if (ok && !cancelled) {
          setSlow(false);
          setBackendReady(true);
          setFadingOut(true);
          return;
        }
        attempt++;
        if (attempt === FAST_POLL_ATTEMPTS && !cancelled) {
          setSlow(true);
        }
        const interval = attempt < FAST_POLL_ATTEMPTS ? FAST_POLL_INTERVAL : SLOW_POLL_INTERVAL;
        await new Promise((r) => setTimeout(r, interval));
      }
    }

    poll();
  }, []);

  useEffect(() => {
    if (!API_URL) return;
    startPolling();
    return () => { if (cancelRef.current) cancelRef.current(); };
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
          : slow
            ? 'bg-orange-600 text-white'
            : 'bg-amber-500 text-white'
      }`}
    >
      {backendReady ? (
        <span>Server is ready!</span>
      ) : slow ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <span>Server is still starting up, retrying...</span>
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
