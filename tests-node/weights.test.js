const test = require("node:test");
const assert = require("node:assert/strict");

const { WeightResolver } = require("../lib/weights.js");

class FakeGitHubClient {
  constructor(memberships) {
    this.memberships = memberships;
  }
  async isUserInTeam(teamKey, username) {
    return Boolean(this.memberships[teamKey] && this.memberships[teamKey].has(username));
  }
}

test("WeightResolver precedence=max uses higher of user/default and team", async () => {
  const gh = new FakeGitHubClient({ "org/team": new Set(["alice"]) });
  const wr = new WeightResolver(gh);
  const cfg = {
    weights: { default: 1, precedence: "max", users: { alice: 2 }, teams: { "org/team": 3 } },
    rules: [],
  };
  const { perUser } = await wr.compute(cfg, ["alice"]);
  assert.equal(perUser.get("alice").weight, 3);
});

test("WeightResolver precedence=user uses explicit user weight even if team is higher", async () => {
  const gh = new FakeGitHubClient({ "org/team": new Set(["alice"]) });
  const wr = new WeightResolver(gh);
  const cfg = {
    weights: { default: 1, precedence: "user", users: { alice: 2 }, teams: { "org/team": 3 } },
    rules: [],
  };
  const { perUser } = await wr.compute(cfg, ["alice"]);
  assert.equal(perUser.get("alice").weight, 2);
});

test("WeightResolver precedence=user allows teams to raise default-weight users", async () => {
  const gh = new FakeGitHubClient({ "org/team": new Set(["bob"]) });
  const wr = new WeightResolver(gh);
  const cfg = {
    weights: { default: 1, precedence: "user", users: {}, teams: { "org/team": 3 } },
    rules: [],
  };
  const { perUser } = await wr.compute(cfg, ["bob"]);
  assert.equal(perUser.get("bob").weight, 3);
});

test("WeightResolver precedence=team uses team weight when present else user/default", async () => {
  const gh = new FakeGitHubClient({ "org/team": new Set(["alice"]) });
  const wr = new WeightResolver(gh);
  const cfg = {
    weights: { default: 1, precedence: "team", users: { alice: 2, carol: 2 }, teams: { "org/team": 3 } },
    rules: [],
  };
  const { perUser } = await wr.compute(cfg, ["alice", "carol"]);
  assert.equal(perUser.get("alice").weight, 3);
  assert.equal(perUser.get("carol").weight, 2);
});


