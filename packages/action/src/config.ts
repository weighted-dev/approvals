import type { AIConfig, ApproverCondition, WeightedApprovalsConfig } from "./types";

export class ConfigLoader {
  normalize(raw: any): WeightedApprovalsConfig {
    if (!raw || typeof raw !== "object")
      throw new Error("Config must be a YAML mapping/object.");

    const weights =
      raw.weights && typeof raw.weights === "object" ? raw.weights : {};
    const users =
      (weights.users && typeof weights.users === "object"
        ? weights.users
        : {}) || {};
    const teams =
      (weights.teams && typeof weights.teams === "object"
        ? weights.teams
        : {}) || {};
    const defaultWeightRaw = (weights as any).default;
    const precedenceRaw = (weights as any).precedence;
    const rules = Array.isArray(raw.rules) ? raw.rules : [];

    const normUsers: Record<string, number> = {};
    for (const [k, v] of Object.entries(users)) {
      const n = Number(v as any);
      if (Number.isFinite(n)) normUsers[String(k)] = n;
    }

    const normTeams: Record<string, number> = {};
    for (const [k, v] of Object.entries(teams)) {
      const n = Number(v as any);
      if (Number.isFinite(n)) normTeams[String(k)] = n;
    }

    const defaultWeight = Number(defaultWeightRaw);
    const precedence =
      precedenceRaw === "user" ||
      precedenceRaw === "team" ||
      precedenceRaw === "max"
        ? precedenceRaw
        : "max";

    const normRules: WeightedApprovalsConfig["rules"] = [];
    for (const r of rules) {
      if (!r || typeof r !== "object") continue;
      const paths = Array.isArray((r as any).paths)
        ? (r as any).paths.map(String)
        : [];
      const req = Number((r as any).required_total);
      if (!Number.isFinite(req)) continue;

      // Parse new approvers syntax
      const approversRaw = (r as any).approvers;
      const approvers = this.parseApproverCondition(approversRaw);

      normRules.push({ paths, required_total: req, approvers });
    }

    // Parse AI config
    const ai = this.parseAIConfig(raw.ai);

    return {
      weights: {
        users: normUsers,
        teams: normTeams,
        default: Number.isFinite(defaultWeight) ? defaultWeight : 1,
        precedence,
      },
      rules: normRules,
      labels:
        raw.labels && typeof raw.labels === "object" ? raw.labels : undefined,
      ai,
    };
  }

  /**
   * Parse AI configuration block.
   */
  private parseAIConfig(raw: any): AIConfig | undefined {
    if (!raw || typeof raw !== "object") return undefined;

    const enabled = raw.enabled === true;
    if (!enabled) return undefined;

    const provider = raw.provider;
    if (provider !== "openai" && provider !== "anthropic") {
      return undefined;
    }

    // api_key_env is required
    const apiKeyEnv = typeof raw.api_key_env === "string" ? raw.api_key_env : undefined;
    if (!apiKeyEnv) {
      return undefined;
    }

    // Parse criticality_range
    const criticalityRangeRaw = raw.criticality_range;
    let criticalityRange = { min: 1, max: 3 };
    if (criticalityRangeRaw && typeof criticalityRangeRaw === "object") {
      const min = Number(criticalityRangeRaw.min);
      const max = Number(criticalityRangeRaw.max);
      if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max >= min) {
        criticalityRange = { min, max };
      }
    }

    // Parse teams array
    const teams: string[] = [];
    if (Array.isArray(raw.teams)) {
      for (const t of raw.teams) {
        if (typeof t === "string" && t.trim()) {
          teams.push(t.trim());
        }
      }
    }

    // Parse team_descriptions
    let teamDescriptions: Record<string, string> | undefined;
    if (raw.team_descriptions && typeof raw.team_descriptions === "object") {
      teamDescriptions = {};
      for (const [k, v] of Object.entries(raw.team_descriptions)) {
        if (typeof v === "string") {
          teamDescriptions[String(k)] = v;
        }
      }
      if (Object.keys(teamDescriptions).length === 0) {
        teamDescriptions = undefined;
      }
    }

    // Parse optional model
    const model = typeof raw.model === "string" ? raw.model : undefined;

    return {
      enabled: true,
      provider,
      apiKeyEnv,
      model,
      criticalityRange,
      teams,
      teamDescriptions,
    };
  }

  /**
   * Parse an approver condition recursively.
   * Supports:
   *   - { any: { team: count, ... } } or { any: [ condition, ... ] }
   *   - { all: { team: count, ... } } or { all: [ condition, ... ] }
   *   - { teams: { team: count }, users: { user: count } }
   */
  private parseApproverCondition(raw: any): ApproverCondition | undefined {
    if (!raw || typeof raw !== "object") return undefined;

    // Check for 'any' key (OR logic)
    if ("any" in raw) {
      const anyRaw = raw.any;
      if (Array.isArray(anyRaw)) {
        // Array of nested conditions
        const conditions: ApproverCondition[] = [];
        for (const item of anyRaw) {
          const parsed = this.parseApproverCondition(item);
          if (parsed) conditions.push(parsed);
        }
        if (conditions.length === 0) return undefined;
        return { any: conditions };
      } else if (anyRaw && typeof anyRaw === "object") {
        // Map form: { team: count, ... }
        const map = this.parseCountMap(anyRaw);
        if (Object.keys(map).length === 0) return undefined;
        return { any: map };
      }
      return undefined;
    }

    // Check for 'all' key (AND logic)
    if ("all" in raw) {
      const allRaw = raw.all;
      if (Array.isArray(allRaw)) {
        // Array of nested conditions
        const conditions: ApproverCondition[] = [];
        for (const item of allRaw) {
          const parsed = this.parseApproverCondition(item);
          if (parsed) conditions.push(parsed);
        }
        if (conditions.length === 0) return undefined;
        return { all: conditions };
      } else if (allRaw && typeof allRaw === "object") {
        // Map form: { team: count, ... }
        const map = this.parseCountMap(allRaw);
        if (Object.keys(map).length === 0) return undefined;
        return { all: map };
      }
      return undefined;
    }

    // Check for explicit teams/users form
    if ("teams" in raw || "users" in raw) {
      const teams =
        raw.teams && typeof raw.teams === "object"
          ? this.parseCountMap(raw.teams)
          : undefined;
      const users =
        raw.users && typeof raw.users === "object"
          ? this.parseCountMap(raw.users)
          : undefined;
      if (
        (!teams || Object.keys(teams).length === 0) &&
        (!users || Object.keys(users).length === 0)
      ) {
        return undefined;
      }
      return {
        teams: teams && Object.keys(teams).length > 0 ? teams : undefined,
        users: users && Object.keys(users).length > 0 ? users : undefined,
      };
    }

    return undefined;
  }

  /**
   * Parse a map of string -> number (e.g., team/user -> count)
   */
  private parseCountMap(raw: any): Record<string, number> {
    const result: Record<string, number> = {};
    if (!raw || typeof raw !== "object") return result;
    for (const [k, v] of Object.entries(raw)) {
      const n = Number(v as any);
      if (Number.isFinite(n) && n > 0) {
        result[String(k)] = n;
      }
    }
    return result;
  }
}
