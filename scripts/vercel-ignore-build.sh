#!/usr/bin/env bash
# Vercel ignoreCommand: exit 0 = skip the build, exit 1 = build.
# Builds only main, and skips commits that touch nothing but docs.
# See DECISIONS.md, "Builds: main only, docs-only commits skipped".
set -u

# No git metadata (a CLI deploy): someone asked for this build by hand.
REF="${VERCEL_GIT_COMMIT_REF:-}"
if [ -z "$REF" ]; then
  exit 1
fi

if [ "$REF" != "main" ]; then
  echo "Skipping: branch '$REF' is not main."
  exit 0
fi

# No previous build to diff against (first deploy, shallow clone): build.
if ! git rev-parse --quiet --verify HEAD^ >/dev/null 2>&1; then
  exit 1
fi

if git diff --quiet HEAD^ HEAD -- . ':(exclude)*.md' ':(exclude)docs/**' ':(exclude)_revamp-evidence/**' ':(exclude)LICENSE'; then
  echo "Skipping: docs-only commit."
  exit 0
fi
exit 1
