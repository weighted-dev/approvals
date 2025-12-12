const test = require("node:test");
const assert = require("node:assert/strict");

const { WeightedApprovalsEngine } = require("../lib/engine.js");
const { GlobMatcher } = require("../lib/glob.js");

test("Engine: picks max required_total across matched rules", () => {
  const engine = new WeightedApprovalsEngine(new GlobMatcher());
  const rules = [
    { paths: ["src/**"], required_total: 2 },
    { paths: ["infra/**"], required_total: 3 },
  ];
  const changedFiles = ["src/a.ts", "infra/main.tf"];
  const r = engine.computeRequired(rules, changedFiles);
  assert.equal(r.requiredTotal, 3);
  assert.equal(r.maxRules.length, 1);
  assert.equal(r.maxRules[0].required_total, 3);
});

test("Engine: returns 0 when no rules match", () => {
  const engine = new WeightedApprovalsEngine(new GlobMatcher());
  const rules = [{ paths: ["src/**"], required_total: 2 }];
  const r = engine.computeRequired(rules, ["docs/readme.md"]);
  assert.equal(r.requiredTotal, 0);
  assert.equal(r.maxRules.length, 0);
});

test("Engine: label override parses wa:+N", () => {
  const engine = new WeightedApprovalsEngine(new GlobMatcher());
  const labels = [{ name: "wa:+3" }];
  assert.equal(engine.findLabelOverride("wa:+", labels), 3);
  assert.equal(engine.findLabelOverride("wa:+", [{ name: "wa:+x" }]), null);
});

test("Engine: allowlist on max rule gates contribution", () => {
  const engine = new WeightedApprovalsEngine(new GlobMatcher());
  const maxRules = [
    {
      paths: ["infra/**"],
      required_total: 3,
      allowed: { users: ["alice"], teams: ["org/platform"] },
    },
  ];

  assert.equal(engine.isApproverAllowedForMaxRules("alice", [], maxRules), true);
  assert.equal(engine.isApproverAllowedForMaxRules("bob", ["org/platform"], maxRules), true);
  assert.equal(engine.isApproverAllowedForMaxRules("carol", ["org/other"], maxRules), false);
});

test("Engine: required_by.teams merges across max rules (max per team)", () => {
  const engine = new WeightedApprovalsEngine(new GlobMatcher());
  const maxRules = [
    { paths: ["a/**"], required_total: 2, required_by: { teams: { "org/foundation": 1 } } },
    { paths: ["b/**"], required_total: 2, required_by: { teams: { "org/foundation": 2, "org/consumer": 1 } } },
  ];
  const req = engine.computeRequiredByTeams(maxRules);
  assert.deepEqual(req, { "org/foundation": 2, "org/consumer": 1 });
});

test("Engine: team satisfaction counts approvers by team membership", () => {
  const engine = new WeightedApprovalsEngine(new GlobMatcher());
  const requiredByTeams = { "org/foundation": 1, "org/consumer": 1 };
  const countedApprovers = [
    { login: "a", matchedTeams: ["org/foundation"] },
    { login: "b", matchedTeams: ["org/foundation", "org/consumer"] },
  ];
  const sat = engine.computeTeamSatisfaction({ requiredByTeams, countedApprovers });
  assert.equal(sat.ok, true);
  assert.deepEqual(sat.missing, []);
});

test("Engine: team satisfaction reports missing teams", () => {
  const engine = new WeightedApprovalsEngine(new GlobMatcher());
  const requiredByTeams = { "org/foundation": 1, "org/consumer": 1 };
  const countedApprovers = [{ login: "a", matchedTeams: ["org/foundation"] }];
  const sat = engine.computeTeamSatisfaction({ requiredByTeams, countedApprovers });
  assert.equal(sat.ok, false);
  assert.deepEqual(sat.missing, ["org/consumer (0/1)"]);
});


