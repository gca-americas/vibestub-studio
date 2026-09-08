#!/usr/bin/env bash
# Finding this checkout's learning center in the process table.
# Sourced by restart.sh, stop.sh and setup_codelab.sh. Expects PORT and a
# working directory of the repository root.
# ── finding this checkout's learning center ─────────────────────────────────
# No pid file. A recorded number is a hint that outlives the process it named:
# it survives a machine restart, pids are reused, and a wrapper that is killed
# outright leaves the real server running under a pid nobody wrote down. The
# process table is the only account of what is running now.
is_ancestor() {          # $1 is this shell or one of its parents
    local target="$1" p="$$"
    while [ -n "$p" ] && [ "$p" -gt 1 ] 2>/dev/null; do
        [ "$p" = "$target" ] && return 0
        p="$(ps -o ppid= -p "$p" 2>/dev/null | tr -d '[:space:]' || true)"
    done
    return 1
}

in_this_checkout() {     # $1 runs from this directory (Linux tells us; elsewhere assume yes)
    local pid="$1" cwd
    [ -r "/proc/$pid/cwd" ] || return 0
    cwd="$(readlink -f "/proc/$pid/cwd" 2>/dev/null || true)"
    [ -z "$cwd" ] && return 0
    [ "$cwd" = "$PWD" ]
}

is_our_server() {        # $1 is a live process that is this repo's learning center
    local pid="$1" cmd
    [ -n "$pid" ] || return 1
    case "$pid" in (*[!0-9]*) return 1 ;; esac
    [ "$pid" -gt 1 ] || return 1
    [ "$pid" = "$$" ] && return 1
    is_ancestor "$pid" && return 1
    cmd="$(ps -o command= -p "$pid" 2>/dev/null || true)"
    [ -n "$cmd" ] || return 1
    case "$cmd" in
        *uvicorn*server.main*|*scripts/start.sh*) ;;
        *) return 1 ;;
    esac
    in_this_checkout "$pid"
}

port_pids() {            # who is listening on a port; lsof is absent from some images
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

lab_pids() {             # every live learning center of this checkout, port or not
    {
        port_pids "$PORT"
        ps -eo pid=,command= 2>/dev/null \
            | grep -E 'uvicorn +server\.main:app|scripts/start\.sh' \
            | grep -v grep | awk '{print $1}'
    } | sort -un | while read -r pid; do
        is_our_server "$pid" && echo "$pid"
    done
}
