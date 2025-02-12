# Files to XML

This is a simple command-line application that smashes plain-text files in a given directory into a single XML file.
I made this so I could just drag/drop a single file into Claude project for quick reference.
Build the binary, chuck it into your path, and run it.

## Usage

With no arguments, it will read from the current directory and write to `files.xml` in the current directory.
```sh
f2x
```
With a `sourcePath` argument, it will read from that directory.
```sh
f2x --sourcePath ~/Documents/my-project
```

With an `outFile` argument, it will write to that file.
```sh
f2x --outFile deezFiles.xml
```

## Operations

**Building**

To build the package as a (comically large) binary:

```sh
bun run build:bin
```

## TODO

- Add a `f2x --init` command to create a `.f2xignore` file in the current directory with sensible defaults
- Did I hardcode `node_modules`? Should remove that once I have the `f2x --init` command working


```
