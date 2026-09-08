#!/usr/bin/env bash
# Restart the learning center in the background. Use this after a git pull or
# after editing the lab's own code; the step exercises need nothing of the kind.
#
#   scripts/restart.sh          stop it, rebuild the page if its sources changed, start it
#   scripts/restart.sh --pull   git pull first
#
# The built page is not in git, so a pull brings new sources and leaves the old
# build in place. scripts/start.sh compares the two and rebuilds when needed,
# which is why a restart is all this has to do.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-4600}"

say()  { printf '\n\033[1m%s\033[0m\n' "$1"; }
tick() { printf '  ✓ %s\n' "$1"; }
info() { printf '  · %s\n' "$1"; }

say "Restarting the learning center"

if [ "${1:-}" = "--pull" ]; then
    info "git pull"
    git pull --ff-only || { printf '\n  git pull failed; nothing was restarted.\n\n' >&2; exit 1; }
fi

# The pid file first, then whatever holds the port: a server started by hand
# has no pid file, and a stale pid file must not stop the shutdown.
if [ -f runs/lab.pid ]; then
    OLD="$(tr -d '[:space:]' < runs/lab.pid || true)"
    if [ -n "$OLD" ] && kill -0 "$OLD" 2>/dev/null; then
        kill "$OLD" 2>/dev/null || true
        info "stopped the learning center (pid $OLD)"
    fi
fi
for pid in $(lsof -a -ti "tcp:$PORT" -sTCP:LISTEN 2>/dev/null || true); do
    if ps -o command= -p "$pid" | grep -q "vibe-studio\|server.main\|start.sh"; then
        kill "$pid" 2>/dev/null || true
        info "stopped what was on port $PORT (pid $pid)"
    fi
done
sleep 1

mkdir -p runs
PORT="$PORT" nohup scripts/start.sh > runs/lab.log 2>&1 &
echo $! > runs/lab.pid

for _ in $(seq 1 90); do
    if curl -s -o /dev/null "http://localhost:$PORT/api/lab/inspector"; then break; fi
    sleep 1
done

if ! curl -s -o /dev/null "http://localhost:$PORT/api/lab/inspector"; then
    printf '\n\033[1m✗ It did not answer on port %s.\033[0m\n\n  Read runs/lab.log for the reason.\n\n' "$PORT" >&2
    exit 1
fi

if [ -n "${WEB_HOST:-}" ]; then
    LAB_URL="https://$PORT-$WEB_HOST"
else
    LAB_URL="http://localhost:$PORT"
fi

tick "running in the background on port $PORT"
printf '\n  %s\n\n' "$LAB_URL"
info "reload the browser tab to pick up the new page"
info "log      runs/lab.log"
info "stop     kill \$(cat runs/lab.pid)"
printf '\n'
