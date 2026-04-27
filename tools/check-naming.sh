#!/usr/bin/env bash
# Fails if the misspelling "akama" (without the "Ok" prefix) appears anywhere
# in the repo. The brand is OkamaOS / OkamaLabs only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Look for standalone "akama" not preceded by "Ok" or "ok".
# Use grep with PCRE: negative lookbehind. Fall back to grep -E if -P missing.
PATTERN='(?<![Oo])akama'

EXCLUDES=(
    --exclude-dir=.git
    --exclude-dir=buildroot
    --exclude-dir=output
    --exclude-dir=build
    --exclude-dir=node_modules
    --exclude-dir=.venv
    --exclude=check-naming.sh
)

# Lines where 'akama' only appears inside quotes/backticks are meta-references
# in documentation about the naming policy itself — not real misspellings.
# We skip those lines and only flag bare unquoted usage such as:
#   AkamaOS, AkamaLabs, akama-shell, akama-cli, etc.
SKIP_QUOTED='(["`'"'"'])[^"`'"'"']*akama[^"`'"'"']*\1'

if grep -P --version >/dev/null 2>&1; then
    HITS=$(grep -RPIn "${EXCLUDES[@]}" "$PATTERN" "$ROOT" \
           | grep -Pv "$SKIP_QUOTED" || true)
else
    HITS=$(grep -REIn "${EXCLUDES[@]}" "akama" "$ROOT" \
           | grep -Ev "(Okama|okama)" \
           | grep -Ev '(["`'"'"'])[^"`'"'"']*akama' || true)
fi

if [ -n "$HITS" ]; then
    echo "$HITS"
    echo ""
    echo "FAIL: forbidden spelling 'akama' found above. Use 'OkamaOS' / 'OkamaLabs'."
    exit 1
fi

echo "naming-check: OK (no forbidden 'akama' spellings found)"
