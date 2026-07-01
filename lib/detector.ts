/**
 * Deterministic stack detector.
 * Given a set of key files fetched from a repo, classifies the stack
 * and returns a set of rule categories to emit. No LLM calls.
 */

export type Category =
  | "react"
  | "nextjs"
  | "vue"
  | "svelte"
  | "typescript"
  | "python"
  | "python-testing"
  | "node-testing"
  | "rust"
  | "go"
  | "monorepo"
  | "general";

export interface DetectionInput {
  /** Flat list of paths in the repo (relative, e.g. "src/app/page.tsx"). */
  paths: string[];
  /** Map of file path -> file contents for key files we fetched. */
  files: Record<string, string>;
}

export interface DetectionResult {
  categories: Category[];
  summary: {
    language: string;
    framework: string | null;
    packageManager: string | null;
    monorepo: string | null;
    hasTests: boolean;
    stackTags: string[];
  };
}

/** Safe JSON parse: returns null on failure. */
function tryJson<T = unknown>(raw: string | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

interface PkgJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  workspaces?: string[] | { packages?: string[] };
  scripts?: Record<string, string>;
}

function allDeps(pkg: PkgJson | null): Record<string, string> {
  if (!pkg) return {};
  return {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
    ...(pkg.peerDependencies ?? {}),
  };
}

export function detect(input: DetectionInput): DetectionResult {
  const { paths, files } = input;
  const pathSet = new Set(paths);
  const categories = new Set<Category>();
  const stackTags: string[] = [];

  const pkg = tryJson<PkgJson>(files["package.json"]);
  const deps = allDeps(pkg);
  const hasDep = (name: string) => Object.prototype.hasOwnProperty.call(deps, name);

  // --- Language ---
  let language = "unknown";
  if (files["package.json"]) language = "javascript";
  if (files["tsconfig.json"] || paths.some((p) => p.endsWith(".ts") || p.endsWith(".tsx"))) {
    language = "typescript";
    categories.add("typescript");
    stackTags.push("typescript");
  }
  if (files["requirements.txt"] || files["pyproject.toml"] || paths.some((p) => p.endsWith(".py"))) {
    language = language === "unknown" ? "python" : language;
    categories.add("python");
    stackTags.push("python");
  }
  if (files["Cargo.toml"]) {
    language = language === "unknown" ? "rust" : language;
    categories.add("rust");
    stackTags.push("rust");
  }
  if (files["go.mod"]) {
    language = language === "unknown" ? "go" : language;
    categories.add("go");
    stackTags.push("go");
  }

  // --- Framework ---
  let framework: string | null = null;
  if (hasDep("next")) {
    framework = "nextjs";
    categories.add("nextjs");
    categories.add("react");
    stackTags.push("nextjs", "react");
  } else if (hasDep("react")) {
    framework = "react";
    categories.add("react");
    stackTags.push("react");
  } else if (hasDep("vue")) {
    framework = "vue";
    categories.add("vue");
    stackTags.push("vue");
  } else if (hasDep("svelte") || hasDep("@sveltejs/kit")) {
    framework = "svelte";
    categories.add("svelte");
    stackTags.push("svelte");
  }

  // --- Package manager ---
  let packageManager: string | null = null;
  if (pathSet.has("pnpm-lock.yaml")) packageManager = "pnpm";
  else if (pathSet.has("yarn.lock")) packageManager = "yarn";
  else if (pathSet.has("package-lock.json")) packageManager = "npm";
  else if (pathSet.has("bun.lockb")) packageManager = "bun";

  // --- Monorepo ---
  let monorepo: string | null = null;
  if (files["turbo.json"] || hasDep("turbo")) monorepo = "turborepo";
  else if (files["nx.json"] || hasDep("nx")) monorepo = "nx";
  else if (files["lerna.json"]) monorepo = "lerna";
  else if (files["pnpm-workspace.yaml"]) monorepo = "pnpm-workspaces";
  else if (pkg?.workspaces) monorepo = "workspaces";
  if (monorepo) {
    categories.add("monorepo");
    stackTags.push(`monorepo:${monorepo}`);
  }

  // --- Tests ---
  const hasPytest =
    (files["requirements.txt"] ?? "").toLowerCase().includes("pytest") ||
    (files["pyproject.toml"] ?? "").toLowerCase().includes("pytest") ||
    paths.some((p) => p.includes("tests/") || p.startsWith("test_") || p.endsWith("_test.py"));
  const hasJsTests =
    hasDep("jest") ||
    hasDep("vitest") ||
    hasDep("@playwright/test") ||
    hasDep("mocha") ||
    paths.some((p) => /\.(test|spec)\.(t|j)sx?$/.test(p));

  const hasTests = hasPytest || hasJsTests;
  if (hasPytest) {
    categories.add("python-testing");
    stackTags.push("pytest");
  }
  if (hasJsTests) {
    categories.add("node-testing");
    if (hasDep("vitest")) stackTags.push("vitest");
    if (hasDep("jest")) stackTags.push("jest");
    if (hasDep("@playwright/test")) stackTags.push("playwright");
  }

  // Always emit general rules.
  categories.add("general");

  return {
    categories: Array.from(categories),
    summary: {
      language,
      framework,
      packageManager,
      monorepo,
      hasTests,
      stackTags,
    },
  };
}
