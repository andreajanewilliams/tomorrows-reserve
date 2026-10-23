#!/bin/zsh
set -eu
cd "${0:A:h}"
if ! command -v node >/dev/null 2>&1; then
  if [ -s "$HOME/.nvm/nvm.sh" ]; then source "$HOME/.nvm/nvm.sh"; fi
fi
if ! command -v node >/dev/null 2>&1; then
  echo 'Node.js 20 or later is required.'
  read -r '?Press Return to close.'
  exit 1
fi
if [ ! -d node_modules ]; then
  echo 'Run npm ci in this directory once to install dependencies.'
  read -r '?Press Return to close.'
  exit 1
fi
echo 'Open http://127.0.0.1:4317 in your chosen personal browser.'
echo 'Keep this window open. Press Ctrl-C to stop PumpProof.'
node src/server.mjs
