import type {
  ApproverCondition,
  MaOverride,
  WeightedApprovalsConfig,
} from "./types";
import { GlobMatcher } from "./glob";

export interface ComputedRule {
  paths: string[];
  required_total: number;
  approvers?: ApproverCondition;
}

export interface ComputedResult {
  requiredTotal: number;
  currentTotal: number;
  labelOverride: number | null;
  matchedRules: ComputedRule[];
  maxRules: ComputedRule[];
  countedApprovers: Array<{
    login: string;
    weight: number;
    matchedTeams: string[];
  }>;
  skippedApprovers: string[];
}

export class WeightedApprovalsEngine {
  constructor(private readonly glob: GlobMatcher) {}

  findLabelOverride(labelPrefix: string, prLabels: any[]): number | null {
    if (!labelPrefix) return null;
    const prefix = String(labelPrefix);
    for (const l of prLabels || []) {
      const name = (l && l.name) || "";
      if (typeof name !== "string") continue;
      if (!name.startsWith(prefix)) continue;
      const numStr = name.slice(prefix.length).trim();
      if (/^\d+$/.test(numStr)) return parseInt(numStr, 10);
    }
    return null;
  }

  private ruleMatchesAnyChangedFile(
    rule: ComputedRule,
    changedFiles: string[]
  ): boolean {
    for (const f of changedFiles) {
      if (this.glob.anyMatch(rule.paths || [], f)) return true;
    }
    return false;
  }

  computeRequired(
    rules: ComputedRule[],
    changedFiles: string[]
  ): {
    requiredTotal: number;
    matchedRules: ComputedRule[];
    maxRules: ComputedRule[];
  } {
    const matched: ComputedRule[] = [];
    for (const r of rules || []) {
      if (!r) continue;
      const req = Number(r.required_total);
      if (!Number.isFinite(req)) continue;
      if (this.ruleMatchesAnyChangedFile(r, changedFiles)) matched.push(r);
    }
    if (matched.length === 0)
      return { requiredTotal: 0, matchedRules: [], maxRules: [] };
    let max = 0;
    for (const r of matched) max = Math.max(max, Number(r.required_total));
    const maxRules = matched.filter((r) => Number(r.required_total) === max);
    return { requiredTotal: max, matchedRules: matched, maxRules };
  }

  /**
   * Extract all team requirements from the approvers condition.
   * For 'all' conditions, we need approvals from each team.
   * For 'any' conditions, we don't enforce per-team requirements (just allowed).
   */
  computeRequiredByTeams(maxRules: ComputedRule[]): Record<string, number> {
    const out: Record<string, number> = {};
    for (const r of maxRules || []) {
      if (!r.approvers) continue;
      this.extractRequiredTeams(r.approvers, out);
    }
    return out;
  }

  /**
   * Recursively extract required teams from an approver condition.
   * Only 'all' conditions create hard requirements.
   */
  private extractRequiredTeams(
    condition: ApproverCondition,
    out: Record<string, number>
  ): void {
    if ("all" in condition) {
      const allVal = condition.all;
      if (Array.isArray(allVal)) {
        // Array of nested conditions - each must be satisfied
        for (const nested of allVal) {
          this.extractRequiredTeams(nested, out);
        }
      } else {
        // Map form: { team: count, ... } - all teams required
        for (const [team, count] of Object.entries(allVal)) {
          const n = Number(count);
          if (Number.isFinite(n) && n > 0) {
            out[team] = Math.max(out[team] || 0, n);
          }
        }
      }
    } else if ("any" in condition) {
      // 'any' doesn't create hard requirements, but nested 'all' within 'any' branches don't either
      // since only one branch needs to be satisfied
      // We don't extract from 'any' conditions
    } else if ("teams" in condition || "users" in condition) {
      // Explicit teams/users form - treat teams as requirements if present
      const teams = condition.teams;
      if (teams) {
        for (const [team, count] of Object.entries(teams)) {
          const n = Number(count);
          if (Number.isFinite(n) && n > 0) {
            out[team] = Math.max(out[team] || 0, n);
          }
        }
      }
    }
  }

  computeTeamSatisfaction(args: {
    requiredByTeams: Record<string, number>;
    countedApprovers: Array<{ login: string; matchedTeams: string[] }>;
  }): { ok: boolean; counts: Record<string, number>; missing: string[] } {
    const { requiredByTeams, countedApprovers } = args;
    const counts: Record<string, number> = {};
    for (const team of Object.keys(requiredByTeams || {})) counts[team] = 0;

    for (const a of countedApprovers || []) {
      for (const team of Object.keys(requiredByTeams || {})) {
        if (a.matchedTeams && a.matchedTeams.includes(team))
          counts[team] = (counts[team] || 0) + 1;
      }
    }

    const missing: string[] = [];
    for (const [team, needRaw] of Object.entries(requiredByTeams || {})) {
      const need = Number(needRaw);
      const have = counts[team] || 0;
      if (Number.isFinite(need) && have < need)
        missing.push(`${team} (${have}/${need})`);
    }

    return { ok: missing.length === 0, counts, missing };
  }

  latestReviewsByUser(reviews: any[]): Array<{ login: string; review: any }> {
    const by = new Map<string, { review: any; time: number }>();
    for (const rv of reviews || []) {
      if (!rv || !rv.user || !rv.user.login) continue;
      const login = rv.user.login;
      const t =
        rv.submitted_at ||
        rv.submittedAt ||
        rv.created_at ||
        rv.createdAt ||
        "";
      const time = t ? Date.parse(t) : 0;
      const prev = by.get(login);
      if (!prev) by.set(login, { review: rv, time });
      else if (time >= prev.time) by.set(login, { review: rv, time });
    }
    return Array.from(by.entries()).map(([login, v]) => ({
      login,
      review: v.review,
    }));
  }

  /**
   * Extract all allowed teams/users from an approver condition.
   * This collects all teams/users mentioned anywhere in the condition tree.
   */
  private extractAllowedFromCondition(condition: ApproverCondition): {
    users: Set<string>;
    teams: Set<string>;
  } {
    const users = new Set<string>();
    const teams = new Set<string>();

    const extract = (cond: ApproverCondition) => {
      if ("any" in cond) {
        const anyVal = cond.any;
        if (Array.isArray(anyVal)) {
          for (const nested of anyVal) extract(nested);
        } else {
          // Map form - keys are team names
          for (const team of Object.keys(anyVal)) teams.add(team);
        }
      } else if ("all" in cond) {
        const allVal = cond.all;
        if (Array.isArray(allVal)) {
          for (const nested of allVal) extract(nested);
        } else {
          // Map form - keys are team names
          for (const team of Object.keys(allVal)) teams.add(team);
        }
      } else if ("teams" in cond || "users" in cond) {
        if (cond.teams) {
          for (const team of Object.keys(cond.teams)) teams.add(team);
        }
        if (cond.users) {
          for (const user of Object.keys(cond.users)) users.add(user);
        }
      }
    };

    extract(condition);
    return { users, teams };
  }

  /**
   * Check if an approver is allowed by the rule's approvers condition.
   * Returns true if the user or any of their teams is mentioned in the condition.
   */
  private isApproverAllowedByCondition(
    login: string,
    perUserTeams: string[],
    condition: ApproverCondition
  ): boolean {
    const { users, teams } = this.extractAllowedFromCondition(condition);
    if (users.size === 0 && teams.size === 0) return true;
    if (users.has(login)) return true;
    for (const t of perUserTeams || []) {
      if (teams.has(t)) return true;
    }
    return false;
  }

  isApproverAllowedForMaxRules(
    login: string,
    perUserTeams: string[],
    maxRules: ComputedRule[]
  ): boolean {
    // If no rules have approvers conditions, everyone is allowed
    const rulesWithApprovers = maxRules.filter((r) => r.approvers);
    if (rulesWithApprovers.length === 0) return true;

    // Approver must be allowed by at least one rule with an approvers condition
    for (const rule of rulesWithApprovers) {
      if (
        this.isApproverAllowedByCondition(login, perUserTeams, rule.approvers!)
      ) {
        return true;
      }
    }
    return false;
  }

  applyMaCap(args: {
    maOverride: MaOverride | null;
    userTeams: string[];
    rawWeight: number;
  }): number {
    const { maOverride, userTeams, rawWeight } = args;
    if (!maOverride) return rawWeight;
    if (maOverride.n < 2) return rawWeight;
    if (rawWeight < maOverride.n) return rawWeight;
    const allowSet = new Set(maOverride.allowedTeams || []);
    const inAllowedTeam = (userTeams || []).some((t) => allowSet.has(t));
    if (inAllowedTeam) return rawWeight;
    return Math.min(rawWeight, maOverride.n - 1);
  }

  renderSummary(args: {
    owner: string;
    repo: string;
    pullNumber: number;
    headSha: string;
    configPath: string;
    changedFilesCount: number;
    requiredTotal: number;
    labelOverride: number | null;
    maOverride: MaOverride | null;
    currentTotal: number;
    requiredByTeams: Record<string, number>;
    teamSatisfaction: { ok: boolean; missing: string[] };
    countedApprovers: Array<{
      login: string;
      weight: number;
      matchedTeams: string[];
    }>;
    skippedApprovers: string[];
    matchedRules: ComputedRule[];
    maxRules: ComputedRule[];
    teamErrors: string[];
  }): string {
    const {
      owner,
      repo,
      pullNumber,
      headSha,
      configPath,
      changedFilesCount,
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
    } = args;

    const lines: string[] = [];
    lines.push(`Repo: ${owner}/${repo}`);
    lines.push(`PR: #${pullNumber}`);
    lines.push(`Head SHA: ${headSha}`);
    lines.push(`Changed files: ${changedFilesCount}`);
    lines.push("");
    lines.push(
      `Required total: ${requiredTotal}${
        labelOverride != null ? ` (label override: ${labelOverride})` : ""
      }`
    );
    lines.push(`Current total: ${currentTotal}`);

    const requiredTeamsList = Object.keys(requiredByTeams || {});
    if (requiredTeamsList.length > 0) {
      lines.push("");
      lines.push("Required by team:");
      for (const team of requiredTeamsList) {
        lines.push(`- ${team}: ${requiredByTeams[team]}`);
      }
      if (!teamSatisfaction.ok) {
        lines.push("Missing team approvals:");
        for (const m of teamSatisfaction.missing) lines.push(`- ${m}`);
      }
    }
    if (maOverride) {
      lines.push("");
      lines.push(
        `PR override: only members of [${maOverride.allowedTeams.join(
          ", "
        )}] may contribute weight >= ${maOverride.n} (from comment by ${
          maOverride.commentAuthor
        } / ${maOverride.commentAssociation}).`
      );
      if (maOverride.ignoredTeams && maOverride.ignoredTeams.length > 0)
        lines.push(
          `Ignored teams in directive: ${maOverride.ignoredTeams.join(", ")}`
        );
    }
    lines.push("");
    lines.push("Counted approvers:");
    if (countedApprovers.length === 0) lines.push("- (none)");
    for (const a of countedApprovers) {
      const teams =
        a.matchedTeams && a.matchedTeams.length
          ? ` teams=[${a.matchedTeams.join(", ")}]`
          : "";
      lines.push(`- ${a.login}: +${a.weight}${teams}`);
    }
    if (skippedApprovers.length > 0) {
      lines.push("");
      lines.push(
        "Skipped approvers (not allowed for max-required rules or weight=0):"
      );
      for (const s of skippedApprovers) lines.push(`- ${s}`);
    }
    lines.push("");
    lines.push(`Config: ${configPath}`);
    lines.push("");
    lines.push("Matched rules:");
    if (matchedRules.length === 0) lines.push("- (none)");
    else {
      for (const r of matchedRules) {
        const paths = (r.paths || []).join(", ");
        const req = Number(r.required_total);
        const isMax = maxRules.includes(r);
        lines.push(
          `- required_total=${req}${isMax ? " (max)" : ""} paths=[${paths}]`
        );
      }
    }
    if (teamErrors && teamErrors.length > 0) {
      lines.push("");
      lines.push("Team membership check warnings:");
      const uniq = Array.from(new Set(teamErrors));
      for (const e of uniq.slice(0, 5)) lines.push(`- ${e}`);
      if (uniq.length > 5) lines.push(`- (and ${uniq.length - 5} more)`);
    }
    return lines.join("\n");
  }
}
