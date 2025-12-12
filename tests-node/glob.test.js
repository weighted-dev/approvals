const test = require("node:test");
const assert = require("node:assert/strict");

const { GlobMatcher } = require("../lib/glob.js");

test("GlobMatcher: matches ** anywhere", () => {
  const g = new GlobMatcher();
  assert.equal(g.anyMatch(["**"], "src/app/index.ts"), true);
  assert.equal(g.anyMatch(["**"], "README.md"), true);
});

test("GlobMatcher: unanchored patterns match anywhere in path", () => {
  const g = new GlobMatcher();
  assert.equal(g.anyMatch(["src/**"], "src/a.ts"), true);
  assert.equal(g.anyMatch(["src/**"], "foo/src/a.ts"), true);
  assert.equal(g.anyMatch(["src/**"], "foo/bar.ts"), false);
});

test("GlobMatcher: anchored patterns match from repo root only", () => {
  const g = new GlobMatcher();
  assert.equal(g.anyMatch(["/src/**"], "src/a.ts"), true);
  assert.equal(g.anyMatch(["/src/**"], "foo/src/a.ts"), false);
});


