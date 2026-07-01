"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Sparkles } from "lucide-react";

interface Result {
  categories: string[];
  language: string;
  framework: string;
  monorepo: string;
  filename: string;
}

export function ForgeForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!url.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(errBody?.error ?? `Request failed (${res.status})`);
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? "cursor-rules.zip";

      // Trigger download.
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);

      setResult({
        categories: (res.headers.get("X-Forge-Categories") ?? "")
          .split(",")
          .filter(Boolean),
        language: res.headers.get("X-Forge-Language") ?? "unknown",
        framework: res.headers.get("X-Forge-Framework") ?? "",
        monorepo: res.headers.get("X-Forge-Monorepo") ?? "",
        filename,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/vercel/next.js"
          className="flex-1 h-14 px-5 rounded-lg bg-muted/50 border border-border text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          disabled={loading}
          autoComplete="off"
          spellCheck={false}
        />
        <Button
          type="submit"
          size="lg"
          disabled={loading || !url.trim()}
          className="whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Forging…
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" /> Forge my rules
            </>
          )}
        </Button>
      </form>

      {error && (
        <div className="mt-6 p-4 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 p-5 rounded-lg border border-primary/40 bg-primary/5">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Download className="w-5 h-5" />
            <span className="font-semibold">
              Downloaded {result.filename}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <dt className="text-foreground">Language</dt>
            <dd>{result.language}</dd>
            {result.framework && (
              <>
                <dt className="text-foreground">Framework</dt>
                <dd>{result.framework}</dd>
              </>
            )}
            {result.monorepo && (
              <>
                <dt className="text-foreground">Monorepo</dt>
                <dd>{result.monorepo}</dd>
              </>
            )}
          </dl>
          <div className="mt-4">
            <div className="text-sm text-foreground mb-2">Rules emitted:</div>
            <div className="flex flex-wrap gap-2">
              {result.categories.map((cat) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 rounded-md bg-muted text-xs font-mono"
                >
                  {cat}.mdc
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
