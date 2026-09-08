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
#
# Nothing here kills a pid it has not identified. A pid file survives a machine
# restart and pids are reused, so a recorded number is a hint, never a licence:
# every candidate has to look like this repo's server, and must not be this
# shell or one of its ancestors.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-4600}"

say()  { printf '\n\033[1m%s\033[0m\n' "$1"; }
tick() { printf '  ✓ %s\n' "$1"; }
info() { printf '  · %s\n' "$1"; }
warn() { printf '  ! %s\n' "$1" >&2; }

# ── who may be killed ───────────────────────────────────────────────────────
is_ancestor() {          # $1 is this shell or one of its parents
    local target="$1" p="$$"
    while [ -n "$p" ] && [ "$p" -gt 1 ] 2>/dev/null; do
        [ "$p" = "$target" ] && return 0
        p="$(ps -o ppid= -p "$p" 2>/dev/null | tr -d '[:space:]' || true)"
    done
    return 1
}

is_our_server() {        # $1 is a live process that is this repo's learning center
    local pid="$1" cmd
    [ -n "$pid" ] || return 1
    case "$pid" in (*[!0-9]*) return 1 ;; esac
    [ "$pid" -gt 1 ] || return 1
    [ "$pid" != "$$" ] || return 1
    is_ancestor "$pid" && return 1
    cmd="$(ps -o command= -p "$pid" 2>/dev/null || true)"
    [ -n "$cmd" ] || return 1
    case "$cmd" in
        *uvicorn*server.main*|*scripts/start.sh*|*python*-m*vibestudio*) return 0 ;;
    esac
    return 1
}

say "Restarting the learning center"

if [ "${1:-}" = "--pull" ]; then
    info "git pull"
    git pull --ff-only || { printf '\n  git pull failed; nothing was restarted.\n\n' >&2; exit 1; }
fi

stopped=0

# The recorded pid, only if it still looks like our server.
if [ -f runs/lab.pid ]; then
    OLD="$(tr -d '[:space:]' < runs/lab.pid 2>/dev/null || true)"
    if is_our_server "$OLD"; then
        kill "$OLD" 2>/dev/null || true
        info "stopped the learning center (pid $OLD)"
        stopped=1
    elif [ -n "$OLD" ]; then
        info "runs/lab.pid holds $OLD, which is not this server any more; ignoring it"
    fi
fi

# Who is listening on the port. lsof is absent from some images (Cloud Shell
# among them); without a fallback nothing is found, nothing is stopped, the new
# server cannot bind, and the old one answers the health check below, so a
# restart that changed nothing looks like it worked.
port_pids() {
    if command -v lsof >/dev/null 2>&1; then
        lsof -a -ti "tcp:$1" -sTCP:LISTEN 2>/dev/null && return 0
    fi
    if command -v ss >/dev/null 2>&1; then
        ss -ltnpH "sport = :$1" 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u && return 0
    fi
    if command -v fuser >/dev/null 2>&1; then
        fuser -n tcp "$1" 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+$' && return 0
    fi
    return 0
}

# A server started by hand has no pid file, and a stale file must not be the
# only way to find it.
for pid in $(port_pids "$PORT"); do
    if is_our_server "$pid"; then
        kill "$pid" 2>/dev/null || true
        info "stopped what was on port $PORT (pid $pid)"
        stopped=1
    else
        warn "port $PORT is held by pid $pid, which is not this repo's server; leaving it alone"
        warn "$(ps -o command= -p "$pid" 2>/dev/null | cut -c1-90)"
    fi
done
[ "$stopped" = 1 ] || info "nothing was running"
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

# Something answers. Whether it is the code in this directory is another
# question: if the old server kept the port, the new one exited on bind and the
# answer above came from the process this restart meant to replace.
HEAD_SHA="$(git rev-parse --short HEAD 2>/dev/null || true)"
SERVING="$(curl -s "http://localhost:$PORT/api/lab/version" 2>/dev/null | sed -n 's/.*"running":"\([^"]*\)".*/\1/p')"
if [ -n "$HEAD_SHA" ] && [ -n "$SERVING" ] && [ "$HEAD_SHA" != "$SERVING" ]; then
    printf '\n\033[1m✗ Port %s is still served by the old code (%s), not this checkout (%s).\033[0m\n\n' "$PORT" "$SERVING" "$HEAD_SHA" >&2
    warn "the process holding the port was not stopped; these are the candidates:"
    for pid in $(port_pids "$PORT"); do
        warn "  pid $pid  $(ps -o command= -p "$pid" 2>/dev/null | cut -c1-70)"
    done
    warn "stop it yourself, then run this again"
    exit 1
fi

if [ -n "${WEB_HOST:-}" ]; then
    LAB_URL="https://$PORT-$WEB_HOST"
else
    LAB_URL="http://localhost:$PORT"
fi

tick "running in the background on port $PORT"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || true)"
[ -n "$COMMIT" ] && info "code     $COMMIT $(git log -1 --format=%s 2>/dev/null | cut -c1-58)"
printf '\n  %s\n\n' "$LAB_URL"
info "reload the browser tab to pick up the new page"
info "log      runs/lab.log"
info "stop     kill \$(cat runs/lab.pid)"
printf '\n'
