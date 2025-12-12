#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"
PUSH="${2:-}"

if [[ -z "${VERSION}" ]]; then
  echo "Usage: $0 <version> [--push]"
  exit 2
fi

if [[ ! "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Version must look like X.Y.Z (got: ${VERSION})"
  exit 2
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git not found"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit/stash your changes first."
  git status --porcelain
  exit 1
fi

echo "Bumping version to ${VERSION} (no git tag yet)..."
npm version --no-git-tag-version "${VERSION}"

echo "Building (tsc + ncc) ..."
npm run build:all

echo "Committing release..."
git add package.json package-lock.json dist/index.js
git commit -m "Release v${VERSION}"

echo "Tagging..."
git tag -a "v${VERSION}" -m "v${VERSION}"
MAJOR="${VERSION%%.*}"
git tag -f "v${MAJOR}"

echo ""
echo "Created tags:"
echo "  v${VERSION}"
echo "  v${MAJOR} (moved)"

if [[ "${PUSH}" == "--push" ]]; then
  echo ""
  echo "Pushing commit + tags..."
  git push origin HEAD
  git push origin "v${VERSION}"
  git push -f origin "v${MAJOR}"
  echo "Done."
else
  echo ""
  echo "To publish, run:"
  echo "  git push origin HEAD"
  echo "  git push origin v${VERSION}"
  echo "  git push -f origin v${MAJOR}"
fi


