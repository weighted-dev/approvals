"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const config_1 = require("./config");
const directives_1 = require("./directives");
const engine_1 = require("./engine");
const glob_1 = require("./glob");
const github_1 = require("./github");
const util_1 = require("./util");
const weights_1 = require("./weights");
const yaml_1 = require("./yaml");
class ActionApp {
    async run() {
        const token = (0, util_1.getInput)("token", { required: true });
        const configPath = (0, util_1.getInput)("config_path", {
            defaultValue: ".github/weighted-approvals.yml",
        });
        const checkName = (0, util_1.getInput)("check_name", {
            defaultValue: "weighted-approvals",
        });
        const labelPrefix = (0, util_1.getInput)("label_prefix", { defaultValue: "wa:+" });
        const commentDirectivePrefix = (0, util_1.getInput)("comment_directive_prefix", {
            defaultValue: "ma:",
        });
        const commentTrustedAssociations = (0, util_1.getInput)("comment_trusted_author_associations", {
            defaultValue: "OWNER,MEMBER,COLLABORATOR",
        });
        const failOnError = (0, util_1.toBool)((0, util_1.getInput)("fail_on_error", { defaultValue: "true" }), true);
        const debug = (0, util_1.toBool)((0, util_1.getInput)("debug", { defaultValue: "false" }), false);
        const eventPath = process.env.GITHUB_EVENT_PATH;
        const repoFull = process.env.GITHUB_REPOSITORY;
        const eventName = process.env.GITHUB_EVENT_NAME;
        if (!eventPath || !node_fs_1.default.existsSync(eventPath))
            throw new Error("GITHUB_EVENT_PATH missing/unreadable");
        if (!repoFull)
            throw new Error("GITHUB_REPOSITORY missing");
        const [owner, repo] = repoFull.split("/");
        const event = (0, util_1.readJsonFile)(eventPath);
        const gh = new github_1.GitHubClient(token, owner, repo, debug);
        const yaml = new yaml_1.YamlParser();
        const configLoader = new config_1.ConfigLoader();
        const engine = new engine_1.WeightedApprovalsEngine(new glob_1.GlobMatcher());
        const directives = new directives_1.DirectiveService();
        const weights = new weights_1.WeightResolver(gh);
        // Resolve PR payload for both PR events and issue_comment events on PRs
        let pr = event.pull_request || null;
        let pullNumber = pr?.number || event.number || null;
        if (!pullNumber && event.issue?.number)
            pullNumber = event.issue.number;
        if (!pullNumber)
            throw new Error(`Not a PR/issue event (missing number). event=${eventName}`);
        if (!pr) {
            const isPullIssue = Boolean(event.issue && event.issue.pull_request);
            if (!isPullIssue)
                throw new Error(`Event is not a PR (issue has no pull_request). event=${eventName}`);
            pr = await gh.getPullRequest(pullNumber);
        }
        const headSha = pr?.head?.sha;
        const baseRef = pr?.base?.ref;
        const baseSha = pr?.base?.sha;
        const prLabels = Array.isArray(pr?.labels) ? pr.labels : [];
        if (!headSha)
            throw new Error("Missing pull_request.head.sha");
        // Load config from base ref (protect against PR modifications)
        const refForConfig = baseSha || baseRef || "main";
        const configText = await gh.fetchRepoFile(configPath, refForConfig);
        const configObj = configLoader.normalize(yaml.parse(configText));
        const changedFiles = await gh.listPullFiles(pullNumber);
        const { requiredTotal: rulesRequired, matchedRules, maxRules, } = engine.computeRequired(configObj.rules, changedFiles);
        const labelOverride = engine.findLabelOverride(labelPrefix, prLabels);
        const requiredTotal = Math.max(rulesRequired, labelOverride ?? 0);
        const reviews = await gh.listPullReviews(pullNumber);
        const latest = engine.latestReviewsByUser(reviews);
        const approvers = latest
            .filter(({ review }) => String(review.state || "").toUpperCase() === "APPROVED")
            .map(({ login }) => login);
        const { perUser, teamErrors } = await weights.compute(configObj, approvers);
        // Optional ma: directive
        let maOverride = null;
        try {
            const comments = await gh.listIssueComments(pullNumber);
            maOverride = directives.findLatestMaOverride({
                commentPrefix: commentDirectivePrefix,
                trustedAssociations: commentTrustedAssociations,
                comments,
                config: configObj,
            });
        }
        catch (e) {
            (0, util_1.debugLog)(debug, "Unable to read PR comments for ma: override:", e?.message || e);
        }
        let currentTotal = 0;
        const countedApprovers = [];
        const skippedApprovers = [];
        for (const login of approvers) {
            const info = perUser.get(login) || {
                weight: 0,
                userWeight: 0,
                matchedTeams: [],
            };
            const allowed = engine.isApproverAllowedForMaxRules(login, info.matchedTeams, maxRules);
            const effectiveWeight = engine.applyMaCap({
                maOverride,
                userTeams: info.matchedTeams,
                rawWeight: info.weight,
            });
            if (!allowed || effectiveWeight <= 0) {
                skippedApprovers.push(`${login}${!allowed ? " (not allowed)" : ""}${effectiveWeight <= 0 ? " (weight=0)" : ""}${maOverride && effectiveWeight < info.weight
                    ? ` (capped_by_${commentDirectivePrefix})`
                    : ""}`);
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
        let existingId = null;
        try {
            const checks = await gh.getCommitCheckRuns(headSha);
            if (checks && Array.isArray(checks.check_runs)) {
                const found = checks.check_runs.find((c) => c && c.name === checkName);
                if (found && found.id)
                    existingId = found.id;
            }
        }
        catch (e) {
            (0, util_1.debugLog)(debug, "Unable to list existing check runs:", e?.message || e);
        }
        if (existingId)
            await gh.updateCheckRun({ id: existingId, conclusion, output });
        else
            await gh.createCheckRun({ name: checkName, headSha, conclusion, output });
        if (!passed) {
            (0, util_1.fail)(`weighted-approvals: required=${requiredTotal} current=${currentTotal}`);
            process.exitCode = 1;
        }
        else {
            (0, util_1.notice)(`weighted-approvals: required=${requiredTotal} current=${currentTotal}`);
        }
    }
}
new ActionApp().run().catch((e) => {
    const msg = e?.message || String(e);
    (0, util_1.fail)(msg);
    const failOnError = (0, util_1.toBool)(process.env.INPUT_FAIL_ON_ERROR || "true", true);
    process.exitCode = failOnError ? 1 : 0;
});
