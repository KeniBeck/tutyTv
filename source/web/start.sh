#!/usr/bin/env bash
set -e
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

if ! command -v node >/dev/null 2>&1; then
    echo "No encuentro Node.js. Instala Node.js 18 o superior." >&2
    echo "En Debian/Ubuntu: sudo apt install nodejs" >&2
    exit 1
fi

exec node server.js "$@"
