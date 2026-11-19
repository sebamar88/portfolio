#!/usr/bin/env bash
# Runs the visual regression project inside the official Playwright image, the only place where
# baselines are generated AND compared (same image locally and in CI => same pixels).
#
#   scripts/visual-docker.sh          compare against committed baselines
#   scripts/visual-docker.sh update   regenerate baselines
#
# Keep IMAGE in sync with the playwright version in package.json and with the CI job.
#
# Dependencies are installed INSIDE the container, at the workspace root (the repo has ONE lockfile):
# node_modules directories and the pnpm store live in named Docker volumes mounted over the host
# ones, so the host node_modules is never touched.
# The container runs as root; generated files are handed back to the host user at the end.
set -euo pipefail

IMAGE="mcr.microsoft.com/playwright:v1.65.1-noble"
PNPM_VERSION="12.4.1"
mode="${1:-compare}"

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo="$(cd "$here/../.." && pwd)"
project="${here#"$repo"/}"   # packages/design-system

case "$mode" in
  compare) vitest_args="" ;;
  update) vitest_args="-u" ;;
  *) echo "usage: $0 [compare|update]" >&2; exit 2 ;;
esac

docker run --rm --ipc=host \
  -e CI=1 -e HOST_UID="$(id -u)" -e HOST_GID="$(id -g)" -e VITEST_ARGS="$vitest_args" \
  -e PNPM_VERSION="$PNPM_VERSION" \
  -v "$repo":/repo \
  -v design-system-visual-root-node-modules:/repo/node_modules \
  -v design-system-visual-node-modules:/repo/"$project"/node_modules \
  -v design-system-visual-pnpm-store:/pnpm-store \
  -e PROJECT="$project" \
  -w /repo \
  "$IMAGE" \
  bash -c '
    set -e
    npm install -g "pnpm@$PNPM_VERSION" >/dev/null
    pnpm config set store-dir /pnpm-store
    pnpm install --frozen-lockfile
    cd "/repo/$PROJECT"
    status=0
    # shellcheck disable=SC2086
    pnpm test:visual:ci $VITEST_ARGS || status=$?
    for d in src/visual .vitest; do
      if [ -e "$d" ]; then chown -R "$HOST_UID:$HOST_GID" "$d" || true; fi
    done
    exit $status
  '
