#!/usr/bin/env bash

set -euo pipefail

echo "==> Running tests"
pnpm exec vitest run

echo "==> Running TypeScript"
pnpm exec tsc --noEmit

echo "==> Running lint"
pnpm lint

echo "==> Running production build"
pnpm build

echo "==> Checking Git diff"
git diff --check

echo
echo "✓ Validation completed successfully."