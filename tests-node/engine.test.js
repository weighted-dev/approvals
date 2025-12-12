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

// New approvers syntax tests

test("Engine: approvers.any (OR) - allows users from any listed team", () => {
  const engine = new WeightedApprovalsEngine(new GlobMatcher());
  const maxRules = [
    {
      paths: ["infra/**"],
      required_total: 3,
      approvers: { any: { "org/platform": 1, "org/infra": 1 } },
    },
  ];

  // User in one of the allowed teams
  assert.equal(
    engine.isApproverAllowedForMaxRules("bob", ["org/platform"], maxRules),
    true
  );
  assert.equal(
    engine.isApproverAllowedForMaxRules("carol", ["org/infra"], maxRules),
    true
  );
  // User not in any allowed team
  assert.equal(
    engine.isApproverAllowedForMaxRules("dave", ["org/other"], maxRules),
    false
  );
});

test("Engine: approvers.all (AND) - allows users from any listed team but requires all teams", () => {
  const engine = new WeightedApprovalsEngine(new GlobMatcher());
  const maxRules = [
    {
      paths: ["apps/**"],
      required_total: 2,
      approvers: { all: { "org/consumer": 1, "org/foundation": 1 } },
    },
  ];

  // User in one of the required teams - allowed to approve
  assert.equal(
    engine.isApproverAllowedForMaxRules("alice", ["org/consumer"], maxRules),
    true
  );
  assert.equal(
    engine.isApproverAllowedForMaxRules("bob", ["org/foundation"], maxRules),
    true
  );
  // User not in any required team
  assert.equal(
    engine.isApproverAllowedForMaxRules("carol", ["org/other"], maxRules),
    false
  );
});

test("Engine: approvers.all extracts required teams", () => {
  const engine = new WeightedApprovalsEngine(new GlobMatcher());
  const maxRules = [
    {
      paths: ["a/**"],
      required_total: 2,
      approvers: { all: { "org/foundation": 1, "org/consumer": 1 } },
    },
  ];
  const req = engine.computeRequiredByTeams(maxRules);
  assert.deepEqual(req, { "org/foundation": 1, "org/consumer": 1 });
});

test("Engine: approvers.all merges across max rules (max per team)", () => {
  const engine = new WeightedApprovalsEngine(new GlobMatcher());
  const maxRules = [
    {
      paths: ["a/**"],
      required_total: 2,
      approvers: { all: { "org/foundation": 1 } },
    },
    {
      paths: ["b/**"],
      required_total: 2,
      approvers: { all: { "org/foundation": 2, "org/consumer": 1 } },
    },
  ];
  const req = engine.computeRequiredByTeams(maxRules);
  assert.deepEqual(req, { "org/foundation": 2, "org/consumer": 1 });
});

test("Engine: approvers.any does not create team requirements", () => {
  const engine = new WeightedApprovalsEngine(new GlobMatcher());
  const maxRules = [
    {
      paths: ["a/**"],
      required_total: 2,
      approvers: { any: { "org/foundation": 1, "org/consumer": 1 } },
    },
  ];
  const req = engine.computeRequiredByTeams(maxRules);
  assert.deepEqual(req, {}); // any = OR, no hard requirements
});

test("Engine: nested approvers (any containing all)", () => {
  const engine = new WeightedApprovalsEngine(new GlobMatcher());
  const maxRules = [
    {
      paths: ["critical/**"],
      required_total: 2,
      approvers: {
        any: [
          { all: { "org/consumer": 1, "org/foundation": 1 } },
          { all: { "org/admin": 2 } },
        ],
      },
    },
  ];

  // Users from any of the nested conditions are allowed
  assert.equal(
    engine.isApproverAllowedForMaxRules("alice", ["org/consumer"], maxRules),
    true
  );
  assert.equal(
    engine.isApproverAllowedForMaxRules("bob", ["org/foundation"], maxRules),
    true
  );
  assert.equal(
    engine.isApproverAllowedForMaxRules("admin", ["org/admin"], maxRules),
    true
  );
  // User not in any condition
  assert.equal(
    engine.isApproverAllowedForMaxRules("carol", ["org/other"], maxRules),
    false
  );
});

test("Engine: approvers with explicit users", () => {
  const engine = new WeightedApprovalsEngine(new GlobMatcher());
  const maxRules = [
    {
      paths: ["infra/**"],
      required_total: 3,
      approvers: {
        all: [{ teams: { "org/platform": 1 }, users: { alice: 1 } }],
      },
    },
  ];

  // Explicit user is allowed
  assert.equal(
    engine.isApproverAllowedForMaxRules("alice", [], maxRules),
    true
  );
  // User in allowed team is allowed
  assert.equal(
    engine.isApproverAllowedForMaxRules("bob", ["org/platform"], maxRules),
    true
  );
  // User not in condition
  assert.equal(
    engine.isApproverAllowedForMaxRules("carol", ["org/other"], maxRules),
    false
  );
});

test("Engine: no approvers means anyone can approve", () => {
  const engine = new WeightedApprovalsEngine(new GlobMatcher());
  const maxRules = [{ paths: ["**"], required_total: 1 }];

  assert.equal(
    engine.isApproverAllowedForMaxRules("anyone", [], maxRules),
    true
  );
  assert.equal(
    engine.isApproverAllowedForMaxRules("someone", ["random/team"], maxRules),
    true
  );
});

test("Engine: team satisfaction counts approvers by team membership", () => {
  const engine = new WeightedApprovalsEngine(new GlobMatcher());
  const requiredByTeams = { "org/foundation": 1, "org/consumer": 1 };
  const countedApprovers = [
    { login: "a", matchedTeams: ["org/foundation"] },
    { login: "b", matchedTeams: ["org/foundation", "org/consumer"] },
  ];
  const sat = engine.computeTeamSatisfaction({
    requiredByTeams,
    countedApprovers,
  });
  assert.equal(sat.ok, true);
  assert.deepEqual(sat.missing, []);
});

test("Engine: team satisfaction reports missing teams", () => {
  const engine = new WeightedApprovalsEngine(new GlobMatcher());
  const requiredByTeams = { "org/foundation": 1, "org/consumer": 1 };
  const countedApprovers = [{ login: "a", matchedTeams: ["org/foundation"] }];
  const sat = engine.computeTeamSatisfaction({
    requiredByTeams,
    countedApprovers,
  });
  assert.equal(sat.ok, false);
  assert.deepEqual(sat.missing, ["org/consumer (0/1)"]);
});
