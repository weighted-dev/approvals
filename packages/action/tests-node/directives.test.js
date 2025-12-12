const test = require("node:test");
const assert = require("node:assert/strict");

const { DirectiveService } = require("../lib/directives.js");

test("DirectiveService: parses ma:@org/team +2 from text", () => {
  const d = new DirectiveService();
  const out = d.parseMaDirectivesFromText("ma:", "please do this ma:@my-org/platform-reviewers +2 thanks");
  assert.deepEqual(out, [{ teamKey: "my-org/platform-reviewers", n: 2 }]);
});

test("DirectiveService: ignores directives from untrusted associations", () => {
  const d = new DirectiveService();
  const cfg = {
    weights: {
      users: {},
      teams: { "my-org/platform-reviewers": 2 },
      default: 1,
      precedence: "max",
    },
    rules: [],
  };
  const override = d.findLatestMaOverride({
    commentPrefix: "ma:",
    trustedAssociations: "OWNER,MEMBER",
    comments: [
      {
        id: 1,
        created_at: "2025-01-01T00:00:00Z",
        author_association: "CONTRIBUTOR",
        body: "ma:@my-org/platform-reviewers +2",
        user: { login: "someone" },
      },
    ],
    config: cfg,
  });
  assert.equal(override, null);
});

test("DirectiveService: requires team to be configured with weight >= N", () => {
  const d = new DirectiveService();
  const cfg = {
    weights: {
      users: {},
      teams: { "my-org/platform-reviewers": 1 },
      default: 1,
      precedence: "max",
    },
    rules: [],
  };
  const override = d.findLatestMaOverride({
    commentPrefix: "ma:",
    trustedAssociations: "OWNER",
    comments: [
      {
        id: 1,
        created_at: "2025-01-01T00:00:00Z",
        author_association: "OWNER",
        body: "ma:@my-org/platform-reviewers +2",
        user: { login: "owner" },
      },
    ],
    config: cfg,
  });
  assert.equal(override, null);
});


