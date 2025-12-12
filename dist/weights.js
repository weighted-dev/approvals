"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeightResolver = void 0;
class WeightResolver {
    gh;
    constructor(gh) {
        this.gh = gh;
    }
    async compute(config, approverLogins) {
        const userWeights = {};
        for (const [u, w] of Object.entries(config.weights.users || {})) {
            const n = Number(w);
            if (Number.isFinite(n))
                userWeights[String(u)] = n;
        }
        const teamWeights = [];
        for (const [teamKey, weight] of Object.entries(config.weights.teams || {})) {
            const w = Number(weight);
            if (Number.isFinite(w))
                teamWeights.push({ teamKey, weight: w });
        }
        const perUser = new Map();
        const teamErrors = [];
        for (const login of approverLogins) {
            const userWeight = userWeights[login] || 0;
            let weight = userWeight;
            const matchedTeams = [];
            for (const tw of teamWeights) {
                try {
                    const ok = await this.gh.isUserInTeam(tw.teamKey, login);
                    if (ok) {
                        matchedTeams.push(tw.teamKey);
                        weight = Math.max(weight, tw.weight);
                    }
                }
                catch (e) {
                    teamErrors.push(String(e?.message || e));
                }
            }
            perUser.set(login, { weight, userWeight, matchedTeams });
        }
        return { perUser, teamErrors };
    }
}
exports.WeightResolver = WeightResolver;
