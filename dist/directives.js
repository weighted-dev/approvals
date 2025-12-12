"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectiveService = void 0;
const util_1 = require("./util");
class DirectiveService {
    parseTrustedAssociations(csv) {
        const s = String(csv || "")
            .split(",")
            .map((x) => x.trim().toUpperCase())
            .filter(Boolean);
        return new Set(s.length ? s : ["OWNER", "MEMBER", "COLLABORATOR"]);
    }
    parseMaDirectivesFromText(prefix, body) {
        const out = [];
        if (!prefix)
            return out;
        const p = String(prefix);
        const text = String(body || "");
        const rx = new RegExp((0, util_1.escapeRegex)(p) + "\\s*@([A-Za-z0-9_.-]+)\\/([A-Za-z0-9_.-]+)\\s*\\+?(\\d+)", "g");
        let m;
        while ((m = rx.exec(text)) !== null) {
            const org = m[1];
            const teamSlug = m[2];
            const n = parseInt(m[3], 10);
            if (Number.isFinite(n))
                out.push({ teamKey: `${org}/${teamSlug}`, n });
        }
        return out;
    }
    findLatestMaOverride(args) {
        const { commentPrefix, trustedAssociations, comments, config } = args;
        if (!commentPrefix)
            return null;
        const trusted = this.parseTrustedAssociations(trustedAssociations);
        const sorted = (comments || [])
            .slice()
            .sort((a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0));
        for (const c of sorted) {
            const assoc = String(c.author_association || "").toUpperCase();
            if (!trusted.has(assoc))
                continue;
            const directives = this.parseMaDirectivesFromText(commentPrefix, c.body || "");
            if (!directives.length)
                continue;
            let maxN = 0;
            for (const d of directives)
                maxN = Math.max(maxN, d.n);
            const allowedTeams = new Set();
            const ignoredTeams = [];
            for (const d of directives) {
                if (d.n !== maxN)
                    continue;
                const w = Number((config.weights.teams || {})[d.teamKey]);
                if (!Number.isFinite(w) || w < maxN) {
                    ignoredTeams.push(`${d.teamKey} (not configured with weight >= ${maxN})`);
                    continue;
                }
                allowedTeams.add(d.teamKey);
            }
            if (maxN >= 2 && allowedTeams.size > 0) {
                return {
                    n: maxN,
                    allowedTeams: Array.from(allowedTeams),
                    commentId: Number(c.id) || 0,
                    commentAuthor: (c.user && c.user.login) || "unknown",
                    commentAssociation: assoc,
                    ignoredTeams,
                };
            }
        }
        return null;
    }
}
exports.DirectiveService = DirectiveService;
