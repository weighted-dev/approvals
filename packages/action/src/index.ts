import fs from "node:fs";

import { ConfigLoader } from "./config";
import { DirectiveService } from "./directives";
import { WeightedApprovalsEngine } from "./engine";
import { GlobMatcher } from "./glob";
import { GitHubClient } from "./github";
import { createAIAnalyzer, type AIAnalysisResult } from "./llm";
import type { MaOverride } from "./types";
import { getInput, toBool, readJsonFile, fail, notice, debugLog } from "./util";
import { WeightResolver } from "./weights";
import { parse as parseYaml } from "yaml";

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
    const configObj = configLoader.normalize(parseYaml(configText));

    const changedFiles = await gh.listPullFiles(pullNumber);
    const {
      requiredTotal: rulesRequired,
      matchedRules,
      maxRules,
    } = engine.computeRequired(configObj.rules, changedFiles);
    const labelOverride = engine.findLabelOverride(labelPrefix, prLabels);

    // AI-powered analysis (if enabled)
    let aiResult: AIAnalysisResult | null = null;
    let aiRequiredTotal = 0;
    let aiSuggestedTeams: Record<string, number> = {};

    const aiAnalyzer = createAIAnalyzer(configObj.ai, debug);
    if (aiAnalyzer) {
      try {
        debugLog(debug, "AI analysis enabled, fetching diff...");
        const diff = await gh.getPullDiff(pullNumber);
        const prTitle = pr?.title || "";
        const prDescription = pr?.body || "";

        aiResult = await aiAnalyzer.analyze({
          diff,
          files: changedFiles,
          prTitle,
          prDescription,
        });

        debugLog(
          debug,
          `AI analysis result: criticality=${aiResult.criticality}, teams=${aiResult.suggestedTeams.join(", ")}, reasoning=${aiResult.reasoning}`
        );

        // Map criticality to required approvers
        aiRequiredTotal = aiAnalyzer.mapCriticalityToApprovers(
          aiResult.criticality
        );

        // Build AI-suggested team requirements (each suggested team requires 1 approval)
        for (const team of aiResult.suggestedTeams) {
          aiSuggestedTeams[team] = 1;
        }
      } catch (e: any) {
        // AI errors should not fail the check - fall back to path-based rules
        debugLog(
          debug,
          `AI analysis failed (falling back to path-based rules): ${e?.message || e}`
        );
        console.warn(
          `[AI] Analysis failed: ${e?.message || e}. Using path-based rules only.`
        );
      }
    }

    // Final required total: max of path-based rules, label override, and AI requirement
    const requiredTotal = Math.max(
      rulesRequired,
      labelOverride ?? 0,
      aiRequiredTotal
    );

    // Merge team requirements: path-based + AI-suggested
    const requiredByTeams = engine.computeRequiredByTeams(maxRules);
    for (const [team, count] of Object.entries(aiSuggestedTeams)) {
      requiredByTeams[team] = Math.max(requiredByTeams[team] || 0, count);
    }

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

    const teamSatisfaction = engine.computeTeamSatisfaction({
      requiredByTeams,
      countedApprovers,
    });

    const passedTotal = currentTotal >= requiredTotal;
    const passedTeams = teamSatisfaction.ok;
    const passed = passedTotal && passedTeams;
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
      requiredByTeams,
      teamSatisfaction,
      countedApprovers,
      skippedApprovers,
      matchedRules,
      maxRules,
      teamErrors,
      aiAnalysis: aiResult
        ? {
            criticality: aiResult.criticality,
            suggestedTeams: aiResult.suggestedTeams,
            reasoning: aiResult.reasoning,
            requiredApprovers: aiRequiredTotal,
          }
        : null,
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
