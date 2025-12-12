import fs from "node:fs";

export function getInput(name: string, opts: { required?: boolean; defaultValue?: string } = {}): string {
  const key = `INPUT_${name.replace(/ /g, "_").toUpperCase()}`;
  const v = process.env[key];
  if (v == null || v === "") {
    if (opts.defaultValue !== undefined) return opts.defaultValue;
    if (opts.required) throw new Error(`Missing required input: ${name}`);
    return "";
  }
  return v.trim();
}

export function toBool(s: string | undefined | null, def = false): boolean {
  if (s == null || s === "") return def;
  return ["1", "true", "yes", "y", "on"].includes(String(s).toLowerCase());
}

export function debugLog(enabled: boolean, ...args: unknown[]) {
  if (enabled) console.log("[debug]", ...args);
}

export function notice(...args: string[]) {
  console.log("::notice::" + args.join(" "));
}

export function warn(...args: string[]) {
  console.log("::warning::" + args.join(" "));
}

export function fail(message: string) {
  console.log("::error::" + message);
}

export function readJsonFile<T = any>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf8")) as T;
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


