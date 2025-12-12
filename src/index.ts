import fs from "node:fs";

import { ConfigLoader } from "./config";
import { DirectiveService } from "./directives";
import { WeightedApprovalsEngine } from "./engine";
import { GlobMatcher } from "./glob";
import { GitHubClient } from "./github";
import type { MaOverride } from "./types";
import { getInput, toBool, readJsonFile, fail, notice, debugLog } from "./util";
import { WeightResolver } from "./weights";
import { YamlParser } from "./yaml";

class ActionApp {
  async run(): Promise<void> {
    const token = getInput("token", { required: true });
    const configPath = getInput("config_path", {
      defaultValue: ".github/weighted-approvals.yml",
    });
    const checkName = getInput("check_name", {
      defaultValue: "weighted-approvals",
    });
    const labelPrefix = getInput("label_prefix", { defaultValue: "wa:+" });
    const commentDirectivePrefix = getInput("comment_directive_prefix", {
      defaultValue: "ma:",
    });
    const commentTrustedAssociations = getInput(
      "comment_trusted_author_associations",
      {
        defaultValue: "OWNER,MEMBER,COLLABORATOR",
      }
    );
    const failOnError = toBool(
      getInput("fail_on_error", { defaultValue: "true" }),
      true
    );
    const debug = toBool(getInput("debug", { defaultValue: "false" }), false);

    const eventPath = process.env.GITHUB_EVENT_PATH;
    const repoFull = process.env.GITHUB_REPOSITORY;
    const eventName = process.env.GITHUB_EVENT_NAME;
    if (!eventPath || !fs.existsSync(eventPath))
      throw new Error("GITHUB_EVENT_PATH missing/unreadable");
    if (!repoFull) throw new Error("GITHUB_REPOSITORY missing");

    const [owner, repo] = repoFull.split("/");
    const event = readJsonFile<any>(eventPath);

    const gh = new GitHubClient(token, owner, repo, debug);
    const yaml = new YamlParser();
    const configLoader = new ConfigLoader();
    const engine = new WeightedApprovalsEngine(new GlobMatcher());
    const directives = new DirectiveService();
    const weights = new WeightResolver(gh);

    // Resolve PR payload for both PR events and issue_comment events on PRs
    let pr = event.pull_request || null;
    let pullNumber: number | null = pr?.number || event.number || null;
    if (!pullNumber && event.issue?.number) pullNumber = event.issue.number;
    if (!pullNumber)
      throw new Error(
        `Not a PR/issue event (missing number). event=${eventName}`
      );

    if (!pr) {
      const isPullIssue = Boolean(event.issue && event.issue.pull_request);
      if (!isPullIssue)
        throw new Error(
          `Event is not a PR (issue has no pull_request). event=${eventName}`
        );
      pr = await gh.getPullRequest(pullNumber);
    }

    const headSha = pr?.head?.sha;
    const baseRef = pr?.base?.ref;
    const baseSha = pr?.base?.sha;
    const prLabels = Array.isArray(pr?.labels) ? pr.labels : [];
    if (!headSha) throw new Error("Missing pull_request.head.sha");

    // Load config from base ref (protect against PR modifications)
    const refForConfig = baseSha || baseRef || "main";
    const configText = await gh.fetchRepoFile(configPath, refForConfig);
    const configObj = configLoader.normalize(yaml.parse(configText));

    const changedFiles = await gh.listPullFiles(pullNumber);
    const {
      requiredTotal: rulesRequired,
      matchedRules,
      maxRules,
    } = engine.computeRequired(configObj.rules, changedFiles);
    const labelOverride = engine.findLabelOverride(labelPrefix, prLabels);
    const requiredTotal = Math.max(rulesRequired, labelOverride ?? 0);

    const reviews = await gh.listPullReviews(pullNumber);
    const latest = engine.latestReviewsByUser(reviews);
    const approvers = latest
      .filter(
        ({ review }) => String(review.state || "").toUpperCase() === "APPROVED"
      )
      .map(({ login }) => login);

    const { perUser, teamErrors } = await weights.compute(configObj, approvers);

    // Optional ma: directive
    let maOverride: MaOverride | null = null;
    try {
      const comments = await gh.listIssueComments(pullNumber);
      maOverride = directives.findLatestMaOverride({
        commentPrefix: commentDirectivePrefix,
        trustedAssociations: commentTrustedAssociations,
        comments,
        config: configObj,
      });
    } catch (e: any) {
      debugLog(
        debug,
        "Unable to read PR comments for ma: override:",
        e?.message || e
      );
    }

    let currentTotal = 0;
    const countedApprovers: Array<{
      login: string;
      weight: number;
      matchedTeams: string[];
    }> = [];
    const skippedApprovers: string[] = [];

    for (const login of approvers) {
      const info = perUser.get(login) || {
        weight: 0,
        userWeight: 0,
        matchedTeams: [],
      };
      const allowed = engine.isApproverAllowedForMaxRules(
        login,
        info.matchedTeams,
        maxRules
      );

      const effectiveWeight = engine.applyMaCap({
        maOverride,
        userTeams: info.matchedTeams,
        rawWeight: info.weight,
      });
      if (!allowed || effectiveWeight <= 0) {
        skippedApprovers.push(
          `${login}${!allowed ? " (not allowed)" : ""}${
            effectiveWeight <= 0 ? " (weight=0)" : ""
          }${
            maOverride && effectiveWeight < info.weight
              ? ` (capped_by_${commentDirectivePrefix})`
              : ""
          }`
        );
        continue;
      }
      currentTotal += effectiveWeight;
      countedApprovers.push({
        login,
        weight: effectiveWeight,
        matchedTeams: info.matchedTeams,
      });
    }

    const passed = currentTotal >= requiredTotal;
    const conclusion = passed ? "success" : "failure";
    const title = passed
      ? "Weighted approvals satisfied"
      : "Weighted approvals missing";

    const summary = engine.renderSummary({
      owner,
      repo,
      pullNumber,
      headSha,
      configPath,
      changedFilesCount: changedFiles.length,
      requiredTotal,
      labelOverride,
      maOverride,
      currentTotal,
      countedApprovers,
      skippedApprovers,
      matchedRules,
      maxRules,
      teamErrors,
    });

    const output = { title, summary, text: summary };

    // Upsert check run
    let existingId: number | null = null;
    try {
      const checks = await gh.getCommitCheckRuns(headSha);
      if (checks && Array.isArray(checks.check_runs)) {
        const found = checks.check_runs.find(
          (c: any) => c && c.name === checkName
        );
        if (found && found.id) existingId = found.id;
      }
    } catch (e: any) {
      debugLog(debug, "Unable to list existing check runs:", e?.message || e);
    }

    if (existingId)
      await gh.updateCheckRun({ id: existingId, conclusion, output });
    else
      await gh.createCheckRun({ name: checkName, headSha, conclusion, output });

    if (!passed) {
      fail(
        `weighted-approvals: required=${requiredTotal} current=${currentTotal}`
      );
      process.exitCode = 1;
    } else {
      notice(
        `weighted-approvals: required=${requiredTotal} current=${currentTotal}`
      );
    }
  }
}

new ActionApp().run().catch((e: any) => {
  const msg = e?.message || String(e);
  fail(msg);
  const failOnError = toBool(process.env.INPUT_FAIL_ON_ERROR || "true", true);
  process.exitCode = failOnError ? 1 : 0;
});
