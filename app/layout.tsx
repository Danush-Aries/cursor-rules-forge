import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "cursor-rules-forge — Tuned .cursor/rules/ for any GitHub repo",
  description:
    "Paste a GitHub URL. Get a downloaded ZIP of .cursor/rules/*.mdc tuned to your stack (React, Vue, monorepo, testing).",
  openGraph: {
    title: "cursor-rules-forge",
    description:
      "Paste a GitHub URL, get a tuned .cursor/rules/ folder — React, monorepo, testing, TS detection built in.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
