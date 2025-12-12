"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInput = getInput;
exports.toBool = toBool;
exports.debugLog = debugLog;
exports.notice = notice;
exports.warn = warn;
exports.fail = fail;
exports.readJsonFile = readJsonFile;
exports.escapeRegex = escapeRegex;
const node_fs_1 = __importDefault(require("node:fs"));
function getInput(name, opts = {}) {
    const key = `INPUT_${name.replace(/ /g, "_").toUpperCase()}`;
    const v = process.env[key];
    if (v == null || v === "") {
        if (opts.defaultValue !== undefined)
            return opts.defaultValue;
        if (opts.required)
            throw new Error(`Missing required input: ${name}`);
        return "";
    }
    return v.trim();
}
function toBool(s, def = false) {
    if (s == null || s === "")
        return def;
    return ["1", "true", "yes", "y", "on"].includes(String(s).toLowerCase());
}
function debugLog(enabled, ...args) {
    if (enabled)
        console.log("[debug]", ...args);
}
function notice(...args) {
    console.log("::notice::" + args.join(" "));
}
function warn(...args) {
    console.log("::warning::" + args.join(" "));
}
function fail(message) {
    console.log("::error::" + message);
}
function readJsonFile(p) {
    return JSON.parse(node_fs_1.default.readFileSync(p, "utf8"));
}
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
