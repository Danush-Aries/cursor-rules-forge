# forge — CLI (Go)

Local sibling to the web app. Point at a directory, get a `.cursor/rules/`
folder written in place — no ZIP, no upload, no network.

## Status

`main.go` ships a working stub that detects the stack (React / Next.js /
Python / monorepo / testing) and writes rule files from the embedded
templates. Same detection logic as the web app, in Go.

## Build

```bash
cd cli
go build -o forge .
```

## Use

```bash
# Rules for the current directory
./forge .

# Rules for a specific path
./forge ~/Developer/my-project

# Dry run — print what would be written
./forge --dry-run .
```

## Example

```bash
$ ./forge ~/Developer/my-next-app
detected: language=typescript framework=nextjs monorepo=none tests=yes
writing:
  .cursor/rules/general.mdc
  .cursor/rules/typescript.mdc
  .cursor/rules/react.mdc
  .cursor/rules/nextjs.mdc
  .cursor/rules/node-testing.mdc
done. 5 files.
```

## Why Go

Same reason as the [pnt CLI](https://github.com/Danush-Aries): single static
binary, no runtime, works on every OS with a `go build`.
