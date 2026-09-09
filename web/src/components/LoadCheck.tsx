import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api, type LoadedStatus } from "../lib/api";
import { COLORS, tint } from "../steps/colors";

/** Seconds to hold after a successful load, so the dev UI's own reloader has
 *  finished before anyone can run. The check itself imports the app in a fresh
 *  interpreter and is instant; this wait is about adk web, not about the file. */
const SETTLE_S = 20;

/** Before a run: import the app the way adk web will, in a fresh interpreter,
 *  and say whether it loads or what ADK objects to. On success the panel holds
 *  for a moment: a save reaches adk web through its reloader, and a student who
 *  runs immediately can still hit the previous version. A failure is reported
 *  at once, since there is nothing to wait for. */
export function LoadCheck({ app, intro }: { app: string; intro?: string }) {
  const [load, setLoad] = useState<{ ok: boolean; edges?: number | null; tools?: number; error: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [left, setLeft] = useState(0);
  const [loaded, setLoaded] = useState<LoadedStatus | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const run = async () => {
    setLoading(true);
    setLoad(null);
    setLoaded(null);
    if (timer.current) clearInterval(timer.current);
    setLeft(0);
    try {
      const r = await api.labLoad(app);
      setLoad(r);
      if (r.ok) {
        // The file loads. Now the question that matters: does adk web have it?
        // The server compares what it built its Runner from with the files, and
        // puts it right when memory is behind. Verified, not assumed.
        api.loaded(app)
          .then((st) => (st.status === "stale" ? api.refreshLoaded(app) : st))
          .then(setLoaded)
          .catch(() => setLoaded(null));
        setLeft(SETTLE_S);
        timer.current = setInterval(() => {
          setLeft((n) => {
            if (n <= 1 && timer.current) clearInterval(timer.current);
            return n - 1;
          });
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || left > 0;
  const what = load?.ok ? (load.edges == null ? `loads · an agent with ${load.tools ?? 0} tool${load.tools === 1 ? "" : "s"}` : `loads · ${load.edges} edges`) : "";
  const tone = left > 0 ? COLORS.amber : COLORS.green;

  return (
    <section className="rounded-3xl border border-hairline bg-card p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-fg-muted">Before you run</p>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">{intro ?? `Save your edits, then click the button. It loads ${app} the way adk web will and tells you either that it loads or what ADK objects to.`}</p>
        </div>
        <button
          onClick={run}
          disabled={busy}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-hairline bg-overlay px-4 py-2 font-mono text-xs text-fg-muted hover:text-fg disabled:opacity-60"
        >
          <RefreshCw size={13} className={busy ? "animate-spin" : ""} />
          {left > 0 ? `Loading… ${left}s` : "Check the workflow loads"}
        </button>
      </div>
      {load && (
        <div
          className="mt-3 rounded-xl border p-3 font-mono text-[11.5px]"
          style={
            load.ok
              ? { borderColor: tint(tone, 0.4), color: tone, background: tint(tone, 0.06) }
              : { borderColor: tint(COLORS.red, 0.4), color: COLORS.red, background: tint(COLORS.red, 0.06) }
          }
        >
          {!load.ok ? (
            load.error
          ) : left > 0 ? (
            <>
              {what}
              <span className="mt-1 block opacity-90">
                giving adk web {left}s to pick up your save · do not run yet
              </span>
              <span className="mt-2 block h-1 w-full overflow-hidden rounded-full" style={{ background: tint(tone, 0.2) }}>
                <span className="block h-full rounded-full transition-all duration-1000 ease-linear" style={{ width: `${((SETTLE_S - left) / SETTLE_S) * 100}%`, background: tone }} />
              </span>
            </>
          ) : (
            <>
              {what}
              <span className="mt-1 block opacity-90">
                {loaded && (loaded.status === "current" || loaded.status === "fresh")
                  ? `adk web has your save from ${new Date(loaded.saved_at * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · ready to run`
                  : loaded
                    ? `adk web could not take your save · ${loaded.detail}`
                    : "adk web has your save · ready to run"}
              </span>
            </>
          )}
        </div>
      )}
    </section>
  );
}
