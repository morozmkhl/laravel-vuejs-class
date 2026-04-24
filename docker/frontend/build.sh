#!/bin/sh
set -eu
cd /app

need=0
[ ! -f dist/index.html ] && need=1
[ ! -d node_modules ] && need=1
[ -f package-lock.json ] && [ -f dist/index.html ] && [ package-lock.json -nt dist/index.html ] && need=1

# Исходники новее dist — обязательно пересборка (только package-lock недостаточно).
if [ -f dist/index.html ]; then
  if [ -n "$(find src index.html vite.config.js package.json -type f -newer dist/index.html 2>/dev/null || true)" ]; then
    need=1
  fi
fi

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
