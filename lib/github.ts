import { Octokit } from "@octokit/rest";

export interface RepoRef {
  owner: string;
  repo: string;
}

/**
 * Parse a GitHub URL or `owner/repo` shorthand into a RepoRef.
 * Throws on bad input.
 */
export function parseGithubUrl(input: string): RepoRef {
  const trimmed = input.trim().replace(/\.git$/, "").replace(/\/$/, "");

  // Shorthand: owner/repo
  const shortMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2] };
  }

  // Full URL
  const urlMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:\/.*)?$/
  );
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2] };
  }

  throw new Error(
    `Not a GitHub URL: "${input}". Expected github.com/owner/repo or owner/repo.`
  );
}

/** Files we ALWAYS try to fetch — they drive stack classification. */
export const KEY_FILES = [
  "package.json",
  "tsconfig.json",
  ".eslintrc",
  ".eslintrc.json",
  ".eslintrc.js",
  ".eslintrc.cjs",
  "requirements.txt",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "turbo.json",
  "nx.json",
  "lerna.json",
  "pnpm-workspace.yaml",
];

export interface RepoSnapshot {
  ref: RepoRef;
  defaultBranch: string;
  paths: string[];
  files: Record<string, string>;
}

/**
 * Fetch a lightweight snapshot of a public repo: default branch, the file
 * tree, and the contents of a curated list of "key" files.
 * Uses GITHUB_TOKEN if present (raises rate limit from 60 to 5000/hr).
 */
export async function fetchRepoSnapshot(ref: RepoRef): Promise<RepoSnapshot> {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
    userAgent: "cursor-rules-forge",
  });

  const { data: repoData } = await octokit.repos.get({
    owner: ref.owner,
    repo: ref.repo,
  });
  const defaultBranch = repoData.default_branch;

  const { data: tree } = await octokit.git.getTree({
    owner: ref.owner,
    repo: ref.repo,
    tree_sha: defaultBranch,
    recursive: "true",
  });

  const paths = (tree.tree ?? [])
    .filter((n) => n.type === "blob" && n.path)
    .map((n) => n.path as string);

  // Fetch key files at the repo root.
  const files: Record<string, string> = {};
  await Promise.all(
    KEY_FILES.filter((f) => paths.includes(f)).map(async (path) => {
      try {
        const { data } = await octokit.repos.getContent({
          owner: ref.owner,
          repo: ref.repo,
          path,
          ref: defaultBranch,
        });
        // File responses come back with a base64 `content` field.
        if (
          !Array.isArray(data) &&
          "content" in data &&
          typeof data.content === "string"
        ) {
          files[path] = Buffer.from(data.content, "base64").toString("utf8");
        }
      } catch {
        // Missing / unreadable — skip.
      }
    })
  );

  return {
    ref,
    defaultBranch,
    paths,
    files,
  };
}
