export class GlobMatcher {
  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private globToRegExp(pattern: string): RegExp {
    let p = String(pattern || "").trim();
    if (p === "") return /^$/;

    const anchored = p.startsWith("/");
    if (anchored) p = p.slice(1);

    let re = "";
    for (let i = 0; i < p.length; i++) {
      const ch = p[i];
      if (ch === "*") {
        const next = p[i + 1];
        if (next === "*") {
          i++;
          if (p[i + 1] === "/") i++;
          re += ".*";
        } else {
          re += "[^/]*";
        }
      } else if (ch === "?") {
        re += "[^/]";
      } else {
        re += this.escapeRegex(ch);
      }
    }

    if (anchored) return new RegExp("^" + re + "$");
    return new RegExp("(^|.*/)" + re + "$");
  }

  anyMatch(patterns: string[], filePath: string): boolean {
    for (const pat of patterns || []) {
      const rx = this.globToRegExp(String(pat));
      if (rx.test(filePath)) return true;
    }
    return false;
  }
}
