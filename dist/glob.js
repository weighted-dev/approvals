"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobMatcher = void 0;
class GlobMatcher {
    escapeRegex(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    globToRegExp(pattern) {
        let p = String(pattern || "").trim();
        if (p === "")
            return /^$/;
        const anchored = p.startsWith("/");
        if (anchored)
            p = p.slice(1);
        let re = "";
        for (let i = 0; i < p.length; i++) {
            const ch = p[i];
            if (ch === "*") {
                const next = p[i + 1];
                if (next === "*") {
                    i++;
                    if (p[i + 1] === "/")
                        i++;
                    re += ".*";
                }
                else {
                    re += "[^/]*";
                }
            }
            else if (ch === "?") {
                re += "[^/]";
            }
            else {
                re += this.escapeRegex(ch);
            }
        }
        if (anchored)
            return new RegExp("^" + re + "$");
        return new RegExp("(^|.*/)" + re + "$");
    }
    anyMatch(patterns, filePath) {
        for (const pat of patterns || []) {
            const rx = this.globToRegExp(String(pat));
            if (rx.test(filePath))
                return true;
        }
        return false;
    }
}
exports.GlobMatcher = GlobMatcher;
