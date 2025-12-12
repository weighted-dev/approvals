import { debugLog } from "./util";

export interface GitHubRequestOpts {
  method: "GET" | "POST" | "PATCH";
  url: string;
  accept?: string;
  body?: unknown;
}

export class GitHubClient {
  constructor(
    private readonly token: string,
    private readonly owner: string,
    private readonly repo: string,
    private readonly debug: boolean
  ) {}

  private apiUrl(p: string): string {
    return `https://api.github.com/repos/${this.owner}/${this.repo}${p}`;
  }

  async request<T = any>(opts: GitHubRequestOpts): Promise<{ ok: boolean; status: number; json: T | null; text: string }> {
    const headers: Record<string, string> = {
      Accept: opts.accept || "application/vnd.github+json",
      Authorization: `Bearer ${this.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";
    const res = await fetch(opts.url, { method: opts.method, headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined });
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json, text };
  }

  async fetchRepoFile(filePath: string, ref: string): Promise<string> {
    const safePath = String(filePath)
      .split("/")
      .map((seg) => encodeURIComponent(seg))
      .join("/");
    const url = this.apiUrl(`/contents/${safePath}`) + (ref ? `?ref=${encodeURIComponent(ref)}` : "");
    debugLog(this.debug, "Fetch config", url);
    const r = await this.request<any>({ method: "GET", url });
    if (!r.ok) throw new Error(`Failed to fetch ${filePath} at ref ${ref || "default"}: ${r.status} ${r.text}`);
    if (!r.json || (r.json as any).type !== "file" || typeof (r.json as any).content !== "string") throw new Error(`Unexpected contents response for ${filePath}`);
    const buff = Buffer.from((r.json as any).content, (r.json as any).encoding || "base64");
    return buff.toString("utf8");
  }

  async listPullFiles(pullNumber: number): Promise<string[]> {
    const files: any[] = [];
    for (let page = 1; page < 50; page++) {
      const url = this.apiUrl(`/pulls/${pullNumber}/files?per_page=100&page=${page}`);
      debugLog(this.debug, "List PR files", url);
      const r = await this.request<any[]>({ method: "GET", url });
      if (!r.ok) throw new Error(`Failed to list PR files: ${r.status} ${r.text}`);
      if (!Array.isArray(r.json)) throw new Error("Unexpected PR files response");
      files.push(...r.json);
      if (r.json.length < 100) break;
    }
    return files.map((f) => f.filename).filter(Boolean);
  }

  async listPullReviews(pullNumber: number): Promise<any[]> {
    const reviews: any[] = [];
    for (let page = 1; page < 50; page++) {
      const url = this.apiUrl(`/pulls/${pullNumber}/reviews?per_page=100&page=${page}`);
      debugLog(this.debug, "List PR reviews", url);
      const r = await this.request<any[]>({ method: "GET", url });
      if (!r.ok) throw new Error(`Failed to list PR reviews: ${r.status} ${r.text}`);
      if (!Array.isArray(r.json)) throw new Error("Unexpected PR reviews response");
      reviews.push(...r.json);
      if (r.json.length < 100) break;
    }
    return reviews;
  }

  async listIssueComments(issueNumber: number): Promise<any[]> {
    const comments: any[] = [];
    for (let page = 1; page < 50; page++) {
      const url = this.apiUrl(`/issues/${issueNumber}/comments?per_page=100&page=${page}`);
      debugLog(this.debug, "List issue comments", url);
      const r = await this.request<any[]>({ method: "GET", url });
      if (!r.ok) throw new Error(`Failed to list issue comments: ${r.status} ${r.text}`);
      if (!Array.isArray(r.json)) throw new Error("Unexpected issue comments response");
      comments.push(...r.json);
      if (r.json.length < 100) break;
    }
    return comments;
  }

  async getPullRequest(pullNumber: number): Promise<any> {
    const url = this.apiUrl(`/pulls/${pullNumber}`);
    debugLog(this.debug, "Get PR", url);
    const r = await this.request<any>({ method: "GET", url });
    if (!r.ok) throw new Error(`Failed to get PR: ${r.status} ${r.text}`);
    return r.json;
  }

  async getCommitCheckRuns(headSha: string): Promise<any> {
    const url = this.apiUrl(`/commits/${encodeURIComponent(headSha)}/check-runs`);
    debugLog(this.debug, "Get check-runs", url);
    const r = await this.request<any>({ method: "GET", url, accept: "application/vnd.github+json" });
    if (!r.ok) throw new Error(`Failed to list check-runs: ${r.status} ${r.text}`);
    return r.json;
  }

  async createCheckRun(args: { name: string; headSha: string; conclusion: string; output: any }): Promise<any> {
    const url = this.apiUrl(`/check-runs`);
    debugLog(this.debug, "Create check-run", url);
    const r = await this.request<any>({
      method: "POST",
      url,
      accept: "application/vnd.github+json",
      body: { name: args.name, head_sha: args.headSha, status: "completed", conclusion: args.conclusion, output: args.output },
    });
    if (!r.ok) throw new Error(`Failed to create check-run: ${r.status} ${r.text}`);
    return r.json;
  }

  async updateCheckRun(args: { id: number; conclusion: string; output: any }): Promise<any> {
    const url = this.apiUrl(`/check-runs/${args.id}`);
    debugLog(this.debug, "Update check-run", url);
    const r = await this.request<any>({
      method: "PATCH",
      url,
      accept: "application/vnd.github+json",
      body: { status: "completed", conclusion: args.conclusion, output: args.output },
    });
    if (!r.ok) throw new Error(`Failed to update check-run: ${r.status} ${r.text}`);
    return r.json;
  }

  async isUserInTeam(teamKey: string, username: string): Promise<boolean> {
    const idx = teamKey.indexOf("/");
    if (idx === -1) return false;
    const org = teamKey.slice(0, idx);
    const teamSlug = teamKey.slice(idx + 1);
    const url = `https://api.github.com/orgs/${encodeURIComponent(org)}/teams/${encodeURIComponent(teamSlug)}/memberships/${encodeURIComponent(username)}`;
    debugLog(this.debug, "Team membership", url);
    const r = await this.request<any>({ method: "GET", url });
    if (r.status === 404) return false;
    if (r.status === 403) throw new Error(`Forbidden checking team membership for ${org}/${teamSlug}. Token likely lacks read:org.`);
    if (!r.ok) throw new Error(`Failed team membership check: ${r.status} ${r.text}`);
    return (r.json as any)?.state === "active";
  }

  /**
   * Fetch the unified diff for a pull request.
   */
  async getPullDiff(pullNumber: number): Promise<string> {
    const url = this.apiUrl(`/pulls/${pullNumber}`);
    debugLog(this.debug, "Get PR diff", url);
    const r = await this.request<string>({
      method: "GET",
      url,
      accept: "application/vnd.github.v3.diff",
    });
    if (!r.ok) throw new Error(`Failed to get PR diff: ${r.status} ${r.text}`);
    return r.text;
  }
}


