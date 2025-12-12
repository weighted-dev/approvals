import { escapeRegex } from "./util";

// Minimal YAML subset parser, intentionally dependency-free.
// Supports mappings + arrays + scalar values; no anchors, no multiline blocks.
export class YamlParser {
  private stripComment(line: string): string {
    let out = "";
    let inS = false;
    let inD = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === "'" && !inD) inS = !inS;
      else if (ch === '"' && !inS) inD = !inD;
      if (ch === "#" && !inS && !inD) break;
      out += ch;
    }
    return out;
  }

  private parseScalar(raw: string): any {
    const s = raw.trim();
    if (s === "") return "";
    if (
      (s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))
    ) {
      const inner = s.slice(1, -1);
      if (s.startsWith('"')) {
        return inner
          .replace(/\\"/g, '"')
          .replace(/\\n/g, "\n")
          .replace(/\\t/g, "\t")
          .replace(/\\\\/g, "\\");
      }
      return inner;
    }
    if (s === "null" || s === "~") return null;
    if (s === "true") return true;
    if (s === "false") return false;
    if (/^[+-]?\d+$/.test(s)) return parseInt(s, 10);
    if (/^[+-]?\d+\.\d+$/.test(s)) return parseFloat(s);
    return s;
  }

  parse(text: string): any {
    const lines = text
      .split(/\r?\n/)
      .map((l) => this.stripComment(l).replace(/\t/g, "    "))
      .filter((l) => l.trim() !== "");

    const root: any = {};
    type Ctx = {
      indent: number;
      type: "map" | "array" | "pending";
      value: any;
      parent: Ctx | null;
      key: string | null;
    };
    const stack: Ctx[] = [
      { indent: -1, type: "map", value: root, parent: null, key: null },
    ];

    const current = () => stack[stack.length - 1];
    const popToIndent = (indent: number) => {
      while (stack.length > 1 && current().indent >= indent) stack.pop();
    };

    const ensurePendingResolvedToArray = (ctx: Ctx): Ctx => {
      if (ctx.type !== "pending") return ctx;
      const arr: any[] = [];
      if (!ctx.parent || ctx.parent.type !== "map" || !ctx.key)
        throw new Error("YAML parse error: invalid pending context");
      ctx.parent.value[ctx.key] = arr;
      ctx.type = "array";
      ctx.value = arr;
      return ctx;
    };

    const ensurePendingResolvedToMap = (ctx: Ctx): Ctx => {
      if (ctx.type !== "pending") return ctx;
      const obj: any = {};
      if (!ctx.parent || ctx.parent.type !== "map" || !ctx.key)
        throw new Error("YAML parse error: invalid pending context");
      ctx.parent.value[ctx.key] = obj;
      ctx.type = "map";
      ctx.value = obj;
      return ctx;
    };

    const push = (
      indent: number,
      type: Ctx["type"],
      value: any,
      parent: Ctx | null,
      key: string | null
    ) => {
      stack.push({ indent, type, value, parent, key });
    };

    for (const rawLine of lines) {
      const indent = rawLine.match(/^ */)![0].length;
      const line = rawLine.trim();

      popToIndent(indent);
      let ctx = current();

      if (line.startsWith("- ")) {
        const itemStr = line.slice(2).trim();
        if (ctx.type === "pending") ctx = ensurePendingResolvedToArray(ctx);
        if (ctx.type !== "array")
          throw new Error("YAML parse error: array item in non-array context");

        if (itemStr.includes(":")) {
          const idx = itemStr.indexOf(":");
          const k = itemStr.slice(0, idx).trim();
          const rest = itemStr.slice(idx + 1).trim();
          const obj: any = {};
          if (rest !== "") obj[k] = this.parseScalar(rest);
          ctx.value.push(obj);
          push(indent + 2, "map", obj, null, null);
        } else {
          ctx.value.push(this.parseScalar(itemStr));
        }
        continue;
      }

      const colonIdx = line.indexOf(":");
      if (colonIdx === -1)
        throw new Error(`YAML parse error: expected ':' in line: ${line}`);
      const key = line.slice(0, colonIdx).trim();
      const rest = line.slice(colonIdx + 1).trim();

      if (ctx.type === "pending") ctx = ensurePendingResolvedToMap(ctx);
      if (ctx.type !== "map")
        throw new Error("YAML parse error: key/value in non-map context");

      if (rest === "") {
        push(indent, "pending", null, ctx, key);
      } else if (rest === "[]") {
        const arr: any[] = [];
        ctx.value[key] = arr;
        push(indent, "array", arr, null, null);
      } else if (rest === "{}") {
        const obj: any = {};
        ctx.value[key] = obj;
        push(indent, "map", obj, null, null);
      } else {
        ctx.value[key] = this.parseScalar(rest);
      }
    }

    return root;
  }
}
