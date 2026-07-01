import { ForgeForm } from "@/components/forge-form";
import { TryExamples } from "@/components/try-examples";
import { Github, Zap, FileCode, Package } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <nav className="w-full px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2 font-semibold">
          <Zap className="w-5 h-5 text-primary" />
          <span>cursor-rules-forge</span>
        </div>
        <a
          href="https://github.com/Danush-Aries/cursor-rules-forge"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          <Github className="w-4 h-4" /> GitHub
        </a>
      </nav>

      <section className="max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/40 text-xs text-muted-foreground mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Deterministic. Zero LLM calls on the primary path.
        </div>

        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6">
          <span className="gradient-text">.cursor/rules/</span>
          <br />
          for any repo.
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
          Paste a GitHub URL. We detect your stack (React, Next.js, Vue,
          monorepo, testing setup) and hand back a tuned{" "}
          <code className="text-foreground text-base font-mono px-1.5 py-0.5 rounded bg-muted">
            .cursor/rules/
          </code>{" "}
          folder as a ZIP.
        </p>

        <ForgeForm />
        <TryExamples />
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-semibold text-center mb-12">
          How it works
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <Step
            icon={<Github className="w-6 h-6" />}
            n={1}
            title="Fetch"
            desc="Octokit pulls your repo tree + key files: package.json, tsconfig, requirements.txt, turbo.json, and friends."
          />
          <Step
            icon={<FileCode className="w-6 h-6" />}
            n={2}
            title="Detect"
            desc="Deterministic classifier parses dependencies, checks lockfiles, spots monorepo tooling. No LLM guesswork."
          />
          <Step
            icon={<Package className="w-6 h-6" />}
            n={3}
            title="Forge"
            desc="Emit 3-5 curated .mdc rule files zipped as .cursor/rules/. Drop into your repo. Done."
          />
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-6 py-10 text-center text-sm text-muted-foreground border-t border-border">
        Rule templates adapted from{" "}
        <a
          href="https://github.com/PatrickJS/awesome-cursorrules"
          className="underline hover:text-foreground"
          target="_blank"
          rel="noreferrer"
        >
          PatrickJS/awesome-cursorrules
        </a>
        . Built by{" "}
        <a
          href="https://github.com/Danush-Aries"
          className="underline hover:text-foreground"
          target="_blank"
          rel="noreferrer"
        >
          @Danush-Aries
        </a>
        .
      </footer>
    </main>
  );
}

function Step({
  n,
  icon,
  title,
  desc,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-border bg-muted/20 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          STEP {n}
        </span>
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
