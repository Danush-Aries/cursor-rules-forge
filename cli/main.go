// forge — local CLI that writes .cursor/rules/ for a directory.
// Deterministic stack detection, no network calls.
package main

import (
	"embed"
	"encoding/json"
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

//go:embed templates/*.mdc
var templatesFS embed.FS

type detection struct {
	Language   string
	Framework  string
	Monorepo   string
	HasTests   bool
	Categories []string
}

type pkgJSON struct {
	Dependencies    map[string]string `json:"dependencies"`
	DevDependencies map[string]string `json:"devDependencies"`
	Workspaces      any               `json:"workspaces"`
}

func main() {
	dryRun := flag.Bool("dry-run", false, "Print what would be written; don't touch disk.")
	flag.Parse()

	target := "."
	if flag.NArg() > 0 {
		target = flag.Arg(0)
	}

	abs, err := filepath.Abs(target)
	must(err)

	det := classify(abs)
	fmt.Printf("detected: language=%s framework=%s monorepo=%s tests=%v\n",
		emptyDash(det.Language), emptyDash(det.Framework),
		emptyDash(det.Monorepo), det.HasTests)

	outDir := filepath.Join(abs, ".cursor", "rules")

	if *dryRun {
		fmt.Println("would write:")
	} else {
		must(os.MkdirAll(outDir, 0o755))
		fmt.Println("writing:")
	}

	written := 0
	for _, cat := range det.Categories {
		src := "templates/" + cat + ".mdc"
		content, err := templatesFS.ReadFile(src)
		if err != nil {
			continue
		}
		dst := filepath.Join(outDir, cat+".mdc")
		rel, _ := filepath.Rel(abs, dst)
		fmt.Printf("  %s\n", rel)
		if !*dryRun {
			must(os.WriteFile(dst, content, 0o644))
		}
		written++
	}
	fmt.Printf("done. %d files.\n", written)
}

func classify(root string) detection {
	det := detection{}
	cats := map[string]bool{"general": true}

	paths := walk(root)
	pathSet := make(map[string]bool, len(paths))
	for _, p := range paths {
		pathSet[p] = true
	}

	// package.json → JS/TS + framework
	if raw := readFile(filepath.Join(root, "package.json")); raw != "" {
		det.Language = "javascript"
		var pkg pkgJSON
		if json.Unmarshal([]byte(raw), &pkg) == nil {
			deps := merge(pkg.Dependencies, pkg.DevDependencies)
			if _, ok := deps["next"]; ok {
				det.Framework = "nextjs"
				cats["nextjs"] = true
				cats["react"] = true
			} else if _, ok := deps["react"]; ok {
				det.Framework = "react"
				cats["react"] = true
			} else if _, ok := deps["vue"]; ok {
				det.Framework = "vue"
				cats["vue"] = true
			} else if _, ok := deps["svelte"]; ok {
				det.Framework = "svelte"
				cats["svelte"] = true
			}
			for _, k := range []string{"jest", "vitest", "@playwright/test", "mocha"} {
				if _, ok := deps[k]; ok {
					det.HasTests = true
					cats["node-testing"] = true
					break
				}
			}
			if _, ok := deps["turbo"]; ok {
				det.Monorepo = "turborepo"
			}
			if _, ok := deps["nx"]; ok && det.Monorepo == "" {
				det.Monorepo = "nx"
			}
			if pkg.Workspaces != nil && det.Monorepo == "" {
				det.Monorepo = "workspaces"
			}
		}
	}

	if readFile(filepath.Join(root, "tsconfig.json")) != "" ||
		anyExt(paths, ".ts", ".tsx") {
		det.Language = "typescript"
		cats["typescript"] = true
	}

	if readFile(filepath.Join(root, "requirements.txt")) != "" ||
		readFile(filepath.Join(root, "pyproject.toml")) != "" ||
		anyExt(paths, ".py") {
		if det.Language == "" {
			det.Language = "python"
		}
		cats["python"] = true
		lowerReq := strings.ToLower(readFile(filepath.Join(root, "requirements.txt")))
		lowerToml := strings.ToLower(readFile(filepath.Join(root, "pyproject.toml")))
		if strings.Contains(lowerReq, "pytest") || strings.Contains(lowerToml, "pytest") ||
			hasPyTest(paths) {
			det.HasTests = true
			cats["python-testing"] = true
		}
	}

	if readFile(filepath.Join(root, "Cargo.toml")) != "" {
		if det.Language == "" {
			det.Language = "rust"
		}
		cats["rust"] = true
	}
	if readFile(filepath.Join(root, "go.mod")) != "" {
		if det.Language == "" {
			det.Language = "go"
		}
		cats["go"] = true
	}

	if pathSet["turbo.json"] && det.Monorepo == "" {
		det.Monorepo = "turborepo"
	}
	if pathSet["nx.json"] && det.Monorepo == "" {
		det.Monorepo = "nx"
	}
	if pathSet["pnpm-workspace.yaml"] && det.Monorepo == "" {
		det.Monorepo = "pnpm-workspaces"
	}
	if det.Monorepo != "" {
		cats["monorepo"] = true
	}

	// Emit categories in stable order.
	order := []string{
		"general", "typescript", "react", "nextjs", "vue", "svelte",
		"python", "python-testing", "node-testing", "rust", "go", "monorepo",
	}
	for _, c := range order {
		if cats[c] {
			det.Categories = append(det.Categories, c)
		}
	}
	return det
}

func walk(root string) []string {
	var out []string
	_ = filepath.WalkDir(root, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		name := d.Name()
		if d.IsDir() {
			if name == "node_modules" || name == ".git" || name == ".next" ||
				name == "dist" || name == "build" || name == "target" ||
				name == "__pycache__" {
				return filepath.SkipDir
			}
			return nil
		}
		rel, err := filepath.Rel(root, p)
		if err != nil {
			return nil
		}
		out = append(out, rel)
		return nil
	})
	return out
}

func readFile(p string) string {
	b, err := os.ReadFile(p)
	if err != nil {
		return ""
	}
	return string(b)
}

func merge(a, b map[string]string) map[string]string {
	out := make(map[string]string, len(a)+len(b))
	for k, v := range a {
		out[k] = v
	}
	for k, v := range b {
		out[k] = v
	}
	return out
}

func anyExt(paths []string, exts ...string) bool {
	for _, p := range paths {
		for _, ext := range exts {
			if strings.HasSuffix(p, ext) {
				return true
			}
		}
	}
	return false
}

func hasPyTest(paths []string) bool {
	for _, p := range paths {
		base := filepath.Base(p)
		if strings.HasPrefix(base, "test_") && strings.HasSuffix(base, ".py") {
			return true
		}
		if strings.HasSuffix(base, "_test.py") {
			return true
		}
		if strings.Contains(p, "tests/") {
			return true
		}
	}
	return false
}

func emptyDash(s string) string {
	if s == "" {
		return "none"
	}
	return s
}

func must(err error) {
	if err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}
