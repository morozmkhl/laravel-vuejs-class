#!/bin/sh
set -eu
cd /app

need=0
[ ! -f dist/index.html ] && need=1
[ ! -d node_modules ] && need=1
[ -f package-lock.json ] && [ -f dist/index.html ] && [ package-lock.json -nt dist/index.html ] && need=1

if [ "$need" -eq 1 ]; then
  echo "Installing frontend dependencies and building..."
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
  npm run build
  [ -f dist/index.html ] || {
    echo "ERROR: vite did not produce dist/index.html" >&2
    exit 1
  }
else
  echo "Frontend dist and node_modules look up to date; skipping npm ci and build."
fi
