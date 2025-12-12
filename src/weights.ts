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
      const userWeight = userWeights[login] || 0;
      let weight = userWeight;
      const matchedTeams: string[] = [];

      for (const tw of teamWeights) {
        try {
          const ok = await this.gh.isUserInTeam(tw.teamKey, login);
          if (ok) {
            matchedTeams.push(tw.teamKey);
            weight = Math.max(weight, tw.weight);
          }
        } catch (e: any) {
          teamErrors.push(String(e?.message || e));
        }
      }

      perUser.set(login, { weight, userWeight, matchedTeams });
    }

    return { perUser, teamErrors };
  }
}


