import type { Category, DetectionResult } from "./detector";

/**
 * Embedded rule templates. We inline them so the API route works on Vercel
 * without needing to read from the filesystem at runtime.
 */
export const TEMPLATES: Record<Category, string> = {
  react: `---
description: React best practices — hooks, effects, server components
globs: **/*.{tsx,jsx}
alwaysApply: false
---

# React

- Do NOT use \`useEffect\` for data fetching. Prefer server components (Next.js App Router), React Query, SWR, or a route loader.
- \`useEffect\` is a synchronization primitive, not a lifecycle hook. If you're reaching for it to "run something on mount", pause and ask if a derived value or an event handler works instead.
- Never derive state from props with \`useState\` + \`useEffect\`. Compute during render or use \`useMemo\`.
- Keep components pure. Side effects go in event handlers, effects, or server actions.
- Prefer composition over \`useContext\` for prop drilling of 2-3 levels. Reach for context only when a value is truly global (theme, auth, i18n).
- Do not memoize everything. \`useMemo\`/\`useCallback\` are for referential stability into memoized children — not perf snake oil.
- Keys must be stable and unique. Never use array index as key for reorderable lists.
- Split components at the seam where props change together. If you're passing \`user\` into 6 layers, split by feature, not by size.
`,

  nextjs: `---
description: Next.js App Router conventions
globs: app/**/*.{ts,tsx}
alwaysApply: false
---

# Next.js (App Router)

- Default to server components. Add \`"use client"\` only when you actually need state, effects, or browser APIs.
- Fetch on the server in server components with \`await fetch(..., { next: { revalidate: N } })\`. Do NOT fetch in a client component with \`useEffect\`.
- Server Actions replace most \`POST /api/*\` endpoints. Reach for a route handler only when you need webhook receivers, streaming, or non-form clients.
- Colocate route-specific components in \`app/<route>/_components/\`. Shared components live in \`components/\`.
- Use \`<Link>\` for internal navigation. Never \`window.location.href\` for in-app routes.
- Metadata goes in \`generateMetadata\` or the exported \`metadata\` const. Not in \`<head>\`.
- Loading + error UI live next to the route: \`loading.tsx\`, \`error.tsx\`, \`not-found.tsx\`.
- Do not import server-only code into client components. Mark server modules with \`import "server-only"\` at the top.
`,

  vue: `---
description: Vue 3 Composition API conventions
globs: **/*.vue
alwaysApply: false
---

# Vue 3

- Composition API + \`<script setup>\` for all new components.
- \`ref\` for primitives, \`reactive\` for objects — but prefer \`ref\` everywhere for consistency.
- Do not destructure a \`reactive()\` object outside a \`toRefs()\` call; you'll lose reactivity.
- Composables (\`useX\`) are the Vue equivalent of hooks. Keep them pure.
- \`defineProps\` + \`withDefaults\` with TS. No PropTypes-style runtime objects.
- Emit events via \`defineEmits\`. Never mutate a prop from a child.
- Pinia > Vuex. Do not add Vuex to a new project.
`,

  svelte: `---
description: Svelte / SvelteKit conventions
globs: **/*.svelte
alwaysApply: false
---

# Svelte / SvelteKit

- Use runes (\`$state\`, \`$derived\`, \`$effect\`) in Svelte 5.
- \`$effect\` is for side effects that cross the reactive graph. Not for derived values — use \`$derived\`.
- Load data in \`+page.server.ts\` (\`load\`) — not in \`onMount\`.
- Form actions handle mutations. Do not build ad-hoc \`POST /api/*\` for form submissions.
- Server-only code lives in \`$lib/server/\`.
`,

  typescript: `---
description: TypeScript strictness and idioms
globs: **/*.{ts,tsx}
alwaysApply: true
---

# TypeScript

- No \`any\`. If you're tempted, use \`unknown\` and narrow.
- Prefer \`type\` over \`interface\` for unions, intersections, and mapped types. Use \`interface\` only when you specifically need declaration merging.
- Strict null checks are on. Handle \`undefined\` at the boundary — don't let it leak into business logic.
- Use \`satisfies\` when you want to constrain a value's shape without widening its inferred type.
- Function signatures: prefer named object arguments once you hit 3+ params.
- No enums. Use \`as const\` object literals or string union types.
- Use discriminated unions for state machines. Do not use nullable data + nullable error.
- Never \`throw\` plain strings. Throw \`Error\` (or a subclass).
`,

  python: `---
description: Python style and idioms
globs: **/*.py
alwaysApply: false
---

# Python

- Type-hint public functions. Private helpers can go bare if the types are obvious.
- Prefer stdlib. Reach for a dependency only when stdlib genuinely doesn't cut it.
- Use \`pathlib.Path\`, not \`os.path.join\`. Use \`subprocess.run(..., check=True)\`, not \`os.system\`.
- No mutable default arguments. \`def f(xs=[])\` is the classic bug — use \`xs: list | None = None\`.
- Context managers for anything with \`close()\`. Not just files — locks, DB cursors, network clients.
- Use \`dataclass\` (or \`pydantic\` if you need validation) for structured data.
- Never catch bare \`Exception\` unless re-raising or at a top-level supervisor.
`,

  "python-testing": `---
description: pytest patterns and test hygiene
globs: **/{test_*,*_test}.py
alwaysApply: false
---

# Python testing (pytest)

- No side effects at import time in test modules.
- Prefer fixtures over module-level globals. Fixtures scope cleanly and tear down.
- Use \`tmp_path\` for anything filesystem. Never write to the repo tree during tests.
- Parametrize instead of loops-inside-a-test.
- Mock at the boundary you own. Don't mock \`requests.get\`; mock your \`client.fetch_user\` wrapper.
- Never \`time.sleep()\` in tests. Use fakes, monkeypatch time, or event-driven waits.
- Name tests after the behavior: \`test_returns_empty_list_when_user_has_no_orders\`.
`,

  "node-testing": `---
description: JS/TS testing patterns (vitest, jest, playwright)
globs: **/*.{test,spec}.{ts,tsx,js,jsx}
alwaysApply: false
---

# Node/TS testing

- Prefer \`vitest\` over \`jest\` for new TS projects.
- No shared mutable state across test files.
- Mock at the module boundary, not at the syscall.
- Playwright: no implicit waits (\`page.waitForTimeout\`). Use locator auto-waiting.
- Snapshot tests are a smell 90% of the time. Assert on the meaningful shape.
- Every \`expect()\` in an async test needs \`await\` if the matcher is async.
- Do not test third-party libraries. Test YOUR usage of them.
`,

  rust: `---
description: Rust idioms and error handling
globs: **/*.rs
alwaysApply: false
---

# Rust

- No \`unwrap()\` in library code. Return \`Result<T, E>\`.
- Use \`thiserror\` for library errors, \`anyhow\` for application errors.
- Prefer \`&str\` in signatures over \`String\`.
- \`clippy\` is not optional. Run with \`-D warnings\` in CI.
- Do not \`clone()\` your way out of a borrow checker fight.
- \`unsafe\` blocks get a \`// SAFETY:\` comment. No exceptions.
`,

  go: `---
description: Go idioms and error handling
globs: **/*.go
alwaysApply: false
---

# Go

- Handle every error. \`_ = err\` is a bug.
- Wrap with \`fmt.Errorf("context: %w", err)\`.
- Small interfaces at the consumer, not the producer.
- No \`init()\` unless you're registering a driver.
- Contexts get passed as the first argument. Never stored in a struct.
- Table-driven tests. \`t.Run(tc.name, ...)\`.
- Do not use panic for control flow.
`,

  monorepo: `---
description: Monorepo hygiene — turbo, nx, pnpm workspaces
globs: **/package.json
alwaysApply: false
---

# Monorepo

- Each package owns its own \`package.json\`. Dependencies belong to the package that uses them, not the root.
- The root \`package.json\` holds only workspace config and dev tooling.
- No cross-package \`../../other-package/src/...\` imports. Import from the public entry point.
- \`turbo.json\` pipeline: every task declares \`dependsOn\` and \`outputs\`.
- \`tsconfig.json\` extends from a shared base. Don't re-declare compiler options per package.
- CI runs \`turbo run build test lint\` from the root.
`,

  general: `---
description: General coding rules — apply to all code in this repo
globs: **/*
alwaysApply: true
---

# General

- Do not add comments that describe what the code does. Comment on WHY.
- Delete dead code. Do not leave commented-out blocks "in case".
- Prefer stdlib / built-in over adding a dependency.
- Small, surgical diffs. Do not reformat unrelated code alongside a feature.
- One responsibility per function. If you can't name it in 5 words, split it.
- No magic numbers. \`if x > 30\` should be \`if x > MAX_RETRIES\`.
- Do not swallow errors. Log with context, re-raise, or handle explicitly.
- Write the test at the same time as the code, not "after".
`,
};

export interface BuiltRule {
  filename: string;
  content: string;
}

/**
 * Build the list of .mdc files for a detection result.
 * Filenames map 1:1 to category ids, sitting under .cursor/rules/.
 */
export function buildRules(detection: DetectionResult): BuiltRule[] {
  const out: BuiltRule[] = [];
  for (const cat of detection.categories) {
    const template = TEMPLATES[cat];
    if (!template) continue;
    out.push({
      filename: `${cat}.mdc`,
      content: template,
    });
  }
  return out;
}

/**
 * A short README that ships inside the ZIP so users know what they got.
 */
export function buildRulesReadme(
  detection: DetectionResult,
  repo: string
): string {
  const { summary } = detection;
  return `# Cursor Rules for ${repo}

Generated by cursor-rules-forge.

## Detected stack
- Language: ${summary.language}
- Framework: ${summary.framework ?? "none"}
- Package manager: ${summary.packageManager ?? "unknown"}
- Monorepo: ${summary.monorepo ?? "no"}
- Tests: ${summary.hasTests ? "yes" : "no"}
- Tags: ${summary.stackTags.join(", ") || "none"}

## Rules emitted
${detection.categories.map((c) => `- ${c}.mdc`).join("\n")}

## Installation
Unzip this file into the root of your repository. You should end up with:

    .cursor/rules/general.mdc
    .cursor/rules/<other>.mdc

Cursor picks these up automatically. Rules with \`alwaysApply: true\` apply to
every request; the rest apply when the \`globs\` pattern matches the files in
the current context.

Rule templates are adapted from and inspired by
https://github.com/PatrickJS/awesome-cursorrules.
`;
}
