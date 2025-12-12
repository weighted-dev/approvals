"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubClient = void 0;
const util_1 = require("./util");
class GitHubClient {
    token;
    owner;
    repo;
    debug;
    constructor(token, owner, repo, debug) {
        this.token = token;
        this.owner = owner;
        this.repo = repo;
        this.debug = debug;
    }
    apiUrl(p) {
        return `https://api.github.com/repos/${this.owner}/${this.repo}${p}`;
    }
    async request(opts) {
        const headers = {
            Accept: opts.accept || "application/vnd.github+json",
            Authorization: `Bearer ${this.token}`,
            "X-GitHub-Api-Version": "2022-11-28",
        };
        if (opts.body !== undefined)
            headers["Content-Type"] = "application/json";
        const res = await fetch(opts.url, { method: opts.method, headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined });
        const text = await res.text();
        let json = null;
        try {
            json = text ? JSON.parse(text) : null;
        }
        catch {
            json = null;
        }
        return { ok: res.ok, status: res.status, json, text };
    }
    async fetchRepoFile(filePath, ref) {
        const safePath = String(filePath)
            .split("/")
            .map((seg) => encodeURIComponent(seg))
            .join("/");
        const url = this.apiUrl(`/contents/${safePath}`) + (ref ? `?ref=${encodeURIComponent(ref)}` : "");
        (0, util_1.debugLog)(this.debug, "Fetch config", url);
        const r = await this.request({ method: "GET", url });
        if (!r.ok)
            throw new Error(`Failed to fetch ${filePath} at ref ${ref || "default"}: ${r.status} ${r.text}`);
        if (!r.json || r.json.type !== "file" || typeof r.json.content !== "string")
            throw new Error(`Unexpected contents response for ${filePath}`);
        const buff = Buffer.from(r.json.content, r.json.encoding || "base64");
        return buff.toString("utf8");
    }
    async listPullFiles(pullNumber) {
        const files = [];
        for (let page = 1; page < 50; page++) {
            const url = this.apiUrl(`/pulls/${pullNumber}/files?per_page=100&page=${page}`);
            (0, util_1.debugLog)(this.debug, "List PR files", url);
            const r = await this.request({ method: "GET", url });
            if (!r.ok)
                throw new Error(`Failed to list PR files: ${r.status} ${r.text}`);
            if (!Array.isArray(r.json))
                throw new Error("Unexpected PR files response");
            files.push(...r.json);
            if (r.json.length < 100)
                break;
        }
        return files.map((f) => f.filename).filter(Boolean);
    }
    async listPullReviews(pullNumber) {
        const reviews = [];
        for (let page = 1; page < 50; page++) {
            const url = this.apiUrl(`/pulls/${pullNumber}/reviews?per_page=100&page=${page}`);
            (0, util_1.debugLog)(this.debug, "List PR reviews", url);
            const r = await this.request({ method: "GET", url });
            if (!r.ok)
                throw new Error(`Failed to list PR reviews: ${r.status} ${r.text}`);
            if (!Array.isArray(r.json))
                throw new Error("Unexpected PR reviews response");
            reviews.push(...r.json);
            if (r.json.length < 100)
                break;
        }
        return reviews;
    }
    async listIssueComments(issueNumber) {
        const comments = [];
        for (let page = 1; page < 50; page++) {
            const url = this.apiUrl(`/issues/${issueNumber}/comments?per_page=100&page=${page}`);
            (0, util_1.debugLog)(this.debug, "List issue comments", url);
            const r = await this.request({ method: "GET", url });
            if (!r.ok)
                throw new Error(`Failed to list issue comments: ${r.status} ${r.text}`);
            if (!Array.isArray(r.json))
                throw new Error("Unexpected issue comments response");
            comments.push(...r.json);
            if (r.json.length < 100)
                break;
        }
        return comments;
    }
    async getPullRequest(pullNumber) {
        const url = this.apiUrl(`/pulls/${pullNumber}`);
        (0, util_1.debugLog)(this.debug, "Get PR", url);
        const r = await this.request({ method: "GET", url });
        if (!r.ok)
            throw new Error(`Failed to get PR: ${r.status} ${r.text}`);
        return r.json;
    }
    async getCommitCheckRuns(headSha) {
        const url = this.apiUrl(`/commits/${encodeURIComponent(headSha)}/check-runs`);
        (0, util_1.debugLog)(this.debug, "Get check-runs", url);
        const r = await this.request({ method: "GET", url, accept: "application/vnd.github+json" });
        if (!r.ok)
            throw new Error(`Failed to list check-runs: ${r.status} ${r.text}`);
        return r.json;
    }
    async createCheckRun(args) {
        const url = this.apiUrl(`/check-runs`);
        (0, util_1.debugLog)(this.debug, "Create check-run", url);
        const r = await this.request({
            method: "POST",
            url,
            accept: "application/vnd.github+json",
            body: { name: args.name, head_sha: args.headSha, status: "completed", conclusion: args.conclusion, output: args.output },
        });
        if (!r.ok)
            throw new Error(`Failed to create check-run: ${r.status} ${r.text}`);
        return r.json;
    }
    async updateCheckRun(args) {
        const url = this.apiUrl(`/check-runs/${args.id}`);
        (0, util_1.debugLog)(this.debug, "Update check-run", url);
        const r = await this.request({
            method: "PATCH",
            url,
            accept: "application/vnd.github+json",
            body: { status: "completed", conclusion: args.conclusion, output: args.output },
        });
        if (!r.ok)
            throw new Error(`Failed to update check-run: ${r.status} ${r.text}`);
        return r.json;
    }
    async isUserInTeam(teamKey, username) {
        const idx = teamKey.indexOf("/");
        if (idx === -1)
            return false;
        const org = teamKey.slice(0, idx);
        const teamSlug = teamKey.slice(idx + 1);
        const url = `https://api.github.com/orgs/${encodeURIComponent(org)}/teams/${encodeURIComponent(teamSlug)}/memberships/${encodeURIComponent(username)}`;
        (0, util_1.debugLog)(this.debug, "Team membership", url);
        const r = await this.request({ method: "GET", url });
        if (r.status === 404)
            return false;
        if (r.status === 403)
            throw new Error(`Forbidden checking team membership for ${org}/${teamSlug}. Token likely lacks read:org.`);
        if (!r.ok)
            throw new Error(`Failed team membership check: ${r.status} ${r.text}`);
        return r.json?.state === "active";
    }
}
exports.GitHubClient = GitHubClient;
