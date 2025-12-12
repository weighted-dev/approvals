/* eslint-disable no-console */
/**
 * Validate that repo examples match what the action supports.
 *
 * Checks:
 * - Example workflows only pass supported `with:` inputs (derived from action.yml)
 * - Example config parses and uses supported weight options
 */

const fs = require("fs");
const path = require("path");
const YAML = require("yaml");

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadYamlFile(p) {
  const txt = readText(p);
  return YAML.parse(txt);
}

function isObject(x) {
  return x && typeof x === "object" && !Array.isArray(x);
}

function collectActionInputs(actionYmlPath) {
  const doc = loadYamlFile(actionYmlPath);
  assert(isObject(doc), `action.yml must be a mapping`);
  assert(isObject(doc.inputs), `action.yml missing inputs`);
  return new Set(Object.keys(doc.inputs));
}

function findSteps(node) {
  const steps = [];
  function walk(x) {
    if (Array.isArray(x)) {
      for (const v of x) walk(v);
      return;
    }
    if (!isObject(x)) return;
    if (Array.isArray(x.steps)) steps.push(...x.steps);
    for (const v of Object.values(x)) walk(v);
  }
  walk(node);
  return steps.filter(isObject);
}

function validateWorkflowInputs(workflowPath, allowedInputs) {
  const doc = loadYamlFile(workflowPath);
  const steps = findSteps(doc);

  for (const s of steps) {
    if (!s.uses || !s.with) continue;
    if (!isObject(s.with)) continue;
    for (const k of Object.keys(s.with)) {
      assert(allowedInputs.has(k), `${path.relative(process.cwd(), workflowPath)} passes unsupported input '${k}'`);
    }
    // Ensure colon-containing defaults are strings in YAML
    if (Object.prototype.hasOwnProperty.call(s.with, "label_prefix")) {
      assert(typeof s.with.label_prefix === "string", `${path.relative(process.cwd(), workflowPath)}: label_prefix must be a string`);
    }
    if (Object.prototype.hasOwnProperty.call(s.with, "comment_directive_prefix")) {
      assert(
        typeof s.with.comment_directive_prefix === "string",
        `${path.relative(process.cwd(), workflowPath)}: comment_directive_prefix must be a string`
      );
    }
  }
}

function listFilesRecursive(rootDir) {
  const out = [];
  const stack = [rootDir];
  while (stack.length) {
    const d = stack.pop();
    if (!d) continue;
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (ent.isFile()) out.push(p);
    }
  }
  return out;
}

function validateConfig(configPath) {
  const cfg = loadYamlFile(configPath);
  assert(isObject(cfg), `${path.relative(process.cwd(), configPath)} must be a mapping`);
  assert(isObject(cfg.weights), `${path.relative(process.cwd(), configPath)} missing weights`);
  assert(Array.isArray(cfg.rules), `${path.relative(process.cwd(), configPath)} missing rules array`);

  const prec = cfg.weights.precedence;
  if (prec !== undefined) {
    assert(["max", "user", "team"].includes(prec), `${path.relative(process.cwd(), configPath)}: weights.precedence must be max|user|team`);
  }
  if (cfg.weights.default !== undefined) {
    assert(typeof cfg.weights.default === "number", `${path.relative(process.cwd(), configPath)}: weights.default must be a number`);
  }

  for (const r of cfg.rules) {
    assert(isObject(r), `${path.relative(process.cwd(), configPath)}: each rule must be an object`);
    assert(Array.isArray(r.paths), `${path.relative(process.cwd(), configPath)}: rule.paths must be an array`);
    assert(typeof r.required_total === "number", `${path.relative(process.cwd(), configPath)}: rule.required_total must be a number`);
  }
}

function main() {
  const repoRoot = process.cwd();
  const actionInputs = collectActionInputs(path.join(repoRoot, "action.yml"));

  // Validate all workflows under repo .github/workflows and examples/**/.github/workflows
  const workflowPaths = [
    path.join(repoRoot, ".github/workflows/wa-test.yml"),
    ...listFilesRecursive(path.join(repoRoot, "examples"))
      .filter((p) => p.includes(`${path.sep}.github${path.sep}workflows${path.sep}`))
      .filter((p) => p.endsWith(".yml") || p.endsWith(".yaml")),
  ].filter((p) => fs.existsSync(p));

  for (const wf of workflowPaths) validateWorkflowInputs(wf, actionInputs);

  // Validate all configs named weighted-approvals.yml under examples/**/.github and the repo self-test config.
  const configPaths = [
    path.join(repoRoot, ".github/weighted-approvals.yml"),
    ...listFilesRecursive(path.join(repoRoot, "examples"))
      .filter((p) => p.endsWith(`${path.sep}weighted-approvals.yml`) || p.endsWith(`${path.sep}weighted-approvals.yaml`))
      .filter((p) => p.includes(`${path.sep}.github${path.sep}`)),
  ].filter((p) => fs.existsSync(p));

  for (const c of configPaths) {
    // Don't treat workflow files as configs (some workflows may be named weighted-approvals.yml).
    if (c.includes(`${path.sep}.github${path.sep}workflows${path.sep}`)) continue;
    validateConfig(c);
  }

  console.log("examples validation: OK");
}

main();


