import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { parseGithubUrl, fetchRepoSnapshot } from "@/lib/github";
import { detect } from "@/lib/detector";
import { buildRules, buildRulesReadme } from "@/lib/rules-builder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ForgeRequestBody {
  url?: string;
}

export async function POST(req: NextRequest) {
  let body: ForgeRequestBody;
  try {
    body = (await req.json()) as ForgeRequestBody;
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  if (!body.url || typeof body.url !== "string") {
    return NextResponse.json(
      { error: "Missing `url` string in request body." },
      { status: 400 }
    );
  }

  let ref;
  try {
    ref = parseGithubUrl(body.url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid URL.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let snapshot;
  try {
    snapshot = await fetchRepoSnapshot(ref);
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Failed to fetch repo from GitHub.";
    // A missing/private repo shows up as a 404 from Octokit.
    const status =
      e instanceof Error && /Not Found/i.test(e.message) ? 404 : 502;
    return NextResponse.json({ error: msg }, { status });
  }

  const detection = detect({ paths: snapshot.paths, files: snapshot.files });
  const rules = buildRules(detection);
  const readme = buildRulesReadme(detection, `${ref.owner}/${ref.repo}`);

  const zip = new JSZip();
  const rulesDir = zip.folder(".cursor/rules");
  if (!rulesDir) {
    return NextResponse.json(
      { error: "Failed to build ZIP." },
      { status: 500 }
    );
  }
  for (const rule of rules) {
    rulesDir.file(rule.filename, rule.content);
  }
  zip.file(".cursor/README.md", readme);

  const buffer = await zip.generateAsync({ type: "uint8array" });
  const blob = new Blob([buffer as BlobPart], { type: "application/zip" });

  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${ref.repo}-cursor-rules.zip"`,
      "X-Forge-Categories": detection.categories.join(","),
      "X-Forge-Language": detection.summary.language,
      "X-Forge-Framework": detection.summary.framework ?? "",
      "X-Forge-Monorepo": detection.summary.monorepo ?? "",
    },
  });
}

export function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "POST /api/forge",
    body: { url: "https://github.com/owner/repo" },
  });
}
