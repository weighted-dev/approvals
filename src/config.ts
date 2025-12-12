import type { WeightedApprovalsConfig } from "./types";

export class ConfigLoader {
  normalize(raw: any): WeightedApprovalsConfig {
    if (!raw || typeof raw !== "object") throw new Error("Config must be a YAML mapping/object.");

    const weights = raw.weights && typeof raw.weights === "object" ? raw.weights : {};
    const users = (weights.users && typeof weights.users === "object" ? weights.users : {}) || {};
    const teams = (weights.teams && typeof weights.teams === "object" ? weights.teams : {}) || {};
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

    const normRules: WeightedApprovalsConfig["rules"] = [];
    for (const r of rules) {
      if (!r || typeof r !== "object") continue;
      const paths = Array.isArray((r as any).paths) ? (r as any).paths.map(String) : [];
      const req = Number((r as any).required_total);
      if (!Number.isFinite(req)) continue;
      const allowedRaw = (r as any).allowed;
      const allowed =
        allowedRaw && typeof allowedRaw === "object"
          ? {
              users: Array.isArray(allowedRaw.users) ? allowedRaw.users.map(String) : undefined,
              teams: Array.isArray(allowedRaw.teams) ? allowedRaw.teams.map(String) : undefined,
            }
          : undefined;

      normRules.push({ paths, required_total: req, allowed });
    }

    return {
      weights: { users: normUsers, teams: normTeams },
      rules: normRules,
      labels: raw.labels && typeof raw.labels === "object" ? raw.labels : undefined,
    };
  }
}


