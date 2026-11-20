#!/usr/bin/env bash
# Runs forge through Docker so no local Foundry install is needed.
# Usage: scripts/forge.sh test -vv   |   scripts/forge.sh fmt --check
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .home
exec docker run --rm --user "$(id -u):$(id -g)" -e HOME=/work/apps/chain/.home \
  -v "$(cd ../.. && pwd)":/work -w /work/apps/chain \
  --entrypoint forge "${FOUNDRY_IMAGE:-ghcr.io/foundry-rs/foundry:stable}" "$@"
