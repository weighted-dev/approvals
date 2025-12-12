import type { WeightedApprovalsConfig } from "./types";
import { GitHubClient } from "./github";

export interface PerUserWeight {
  weight: number;
  userWeight: number;
  matchedTeams: string[];
}

export class WeightResolver {
  constructor(private readonly gh: GitHubClient) {}

  async compute(config: WeightedApprovalsConfig, approverLogins: string[]): Promise<{ perUser: Map<string, PerUserWeight>; teamErrors: string[] }> {
    const defaultWeight = Number.isFinite(Number(config.weights.default)) ? Number(config.weights.default) : 0;
    const precedence = config.weights.precedence || "max";

    const userWeights: Record<string, number> = {};
    for (const [u, w] of Object.entries(config.weights.users || {})) {
      const n = Number(w);
      if (Number.isFinite(n)) userWeights[String(u)] = n;
    }

    const teamWeights: Array<{ teamKey: string; weight: number }> = [];
    for (const [teamKey, weight] of Object.entries(config.weights.teams || {})) {
      const w = Number(weight);
      if (Number.isFinite(w)) teamWeights.push({ teamKey, weight: w });
    }

    const perUser = new Map<string, PerUserWeight>();
    const teamErrors: string[] = [];

    for (const login of approverLogins) {
      const hasExplicitUserWeight = Object.prototype.hasOwnProperty.call(userWeights, login);
      const userWeight = hasExplicitUserWeight ? userWeights[login] : defaultWeight;
      let weight = userWeight;
      const matchedTeams: string[] = [];
      let maxTeamWeight = 0;

      for (const tw of teamWeights) {
        try {
          const ok = await this.gh.isUserInTeam(tw.teamKey, login);
          if (ok) {
            matchedTeams.push(tw.teamKey);
            maxTeamWeight = Math.max(maxTeamWeight, tw.weight);
          }
        } catch (e: any) {
          teamErrors.push(String(e?.message || e));
        }
      }

      if (precedence === "max") {
        weight = Math.max(userWeight, maxTeamWeight);
      } else if (precedence === "user") {
        // Only explicit users override teams; default-weight users still benefit from teams.
        weight = hasExplicitUserWeight ? userWeight : Math.max(userWeight, maxTeamWeight);
      } else if (precedence === "team") {
        weight = maxTeamWeight > 0 ? maxTeamWeight : userWeight;
      } else {
        // Should be unreachable due to config normalization
        weight = Math.max(userWeight, maxTeamWeight);
      }

      perUser.set(login, { weight, userWeight, matchedTeams });
    }

    return { perUser, teamErrors };
  }
}


