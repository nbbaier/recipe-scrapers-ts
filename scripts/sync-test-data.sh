#!/bin/bash
# Syncs test data from the upstream Python recipe-scrapers repo
# Usage: bash scripts/sync-test-data.sh

set -e

UPSTREAM_REPO="https://github.com/hhursev/recipe-scrapers.git"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
TEST_DATA_DIR="$REPO_ROOT/test_data"
TEMP_DIR=$(mktemp -d)

cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

echo "Syncing test data from upstream recipe-scrapers..."

# Sparse checkout - only tests/test_data
git clone --depth 1 --filter=blob:none --sparse "$UPSTREAM_REPO" "$TEMP_DIR" 2>&1 | grep -v "^remote:"
cd "$TEMP_DIR"
git sparse-checkout set tests/test_data 2>/dev/null
cd "$REPO_ROOT"

# Sync
rm -rf "$TEST_DATA_DIR"
cp -r "$TEMP_DIR/tests/test_data" "$TEST_DATA_DIR"

echo "Test data synced to $TEST_DATA_DIR ($(ls "$TEST_DATA_DIR" | wc -l | tr -d ' ') sites)"
