"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigLoader = void 0;
class ConfigLoader {
    normalize(raw) {
        if (!raw || typeof raw !== "object")
            throw new Error("Config must be a YAML mapping/object.");
        const weights = raw.weights && typeof raw.weights === "object" ? raw.weights : {};
        const users = (weights.users && typeof weights.users === "object" ? weights.users : {}) || {};
        const teams = (weights.teams && typeof weights.teams === "object" ? weights.teams : {}) || {};
        const rules = Array.isArray(raw.rules) ? raw.rules : [];
        const normUsers = {};
        for (const [k, v] of Object.entries(users)) {
            const n = Number(v);
            if (Number.isFinite(n))
                normUsers[String(k)] = n;
        }
        const normTeams = {};
        for (const [k, v] of Object.entries(teams)) {
            const n = Number(v);
            if (Number.isFinite(n))
                normTeams[String(k)] = n;
        }
        const normRules = [];
        for (const r of rules) {
            if (!r || typeof r !== "object")
                continue;
            const paths = Array.isArray(r.paths) ? r.paths.map(String) : [];
            const req = Number(r.required_total);
            if (!Number.isFinite(req))
                continue;
            const allowedRaw = r.allowed;
            const allowed = allowedRaw && typeof allowedRaw === "object"
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
exports.ConfigLoader = ConfigLoader;
