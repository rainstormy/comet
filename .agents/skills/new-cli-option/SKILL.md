---
name: new-cli-option
description: Add, modify, or document command-line options of the Comet CLI. Use when working on `src/programs/CommandLineProgram.ts`, argument parsing, the help text, CLI usage in the README, or reviewing changes to any of these.
---

# New CLI option

This document describes how to add an option to the Comet CLI, which involves declaring and parsing the option, implementing its behaviour, documenting it for end users, and testing it.

It uses `--message-file <path>` as an example.

## Step 1: Clarify intent

Define the name, the arguments, and the behaviour of the option.
Read `COMMAND_LINE_OPTION_SCHEMA` and `commandLineProgram` in `src/programs/CommandLineProgram.ts` and decide if an existing option or a configuration setting in `comet.json` already covers the intent.

The existing behaviour of the CLI without the option, the exit codes, and the GitHub Actions entrypoint must not change. New options are additive and ship in a minor release.
Decide how the option interacts with the other options (e.g. `--message-file` ignores `--default-branch`) and document the interaction.

## Step 2: Declare and parse the option

Add the option to `COMMAND_LINE_OPTION_SCHEMA` with `args: { min, max }` constraints, for example:

```ts
"--message-file": { args: { min: 1, max: 1 } },
```

`parseArgs` in `src/utilities/Args.ts` has these properties, which constrain the design:

- Every argument that starts with `-` begins a new option. All following arguments without a leading dash belong to the most recent option.
- `--option=value` is not supported and fails with `Unknown option`.
- Unknown options and violated `min`/`max` constraints throw a `TypeError`, which the CLI reports with exit code 2.
- Tools such as pre-commit.com append file paths to the end of the command. An option that takes a path must therefore work as the last option.
  An option with `max: undefined` (such as `--config`) swallows the appended path if it comes before it. Mention this in the documentation of such options.

Read the parsed value in `commandLineProgram` and branch to a small named function (e.g. `checkPendingCommit`, `checkBranchCommits`) instead of growing the `try` block.
Keep Node.js access (file system, environment variables, child processes) in adapters under `src/utilities/`, which are mocked in tests (see `Testing` in `AGENTS.md`).

## Step 3: Document the option

Update all of these places:

- The help text in `getHelpText`. Options are listed in alphabetical order (including `--help` and `--version`) and no line may exceed 80 characters. Unit tests enforce both.
- The usage synopsis in `README.md`: the `comet \` block in the Node.js section and the `deno run` block in the Deno section. Mention extra Deno permissions that the option needs (e.g. `--allow-read` for a path).
- The introduction of the CLI section in `README.md` if the option changes what Comet checks.
- `CHANGELOG.md` under `## [Unreleased]` > `### Added`.

Do not change the version references in README examples. They are bumped at release time.

## Step 4: Test the option

Add tests to `src/programs/CommandLineProgram.tests.ts` (grep for `describe(`, the file is large):

- Invalid argument counts in the table of invalid args, including an option followed by another option (e.g. `["--message-file", "--config", "comet.json"]` fails with `got 0`).
- Combinations with the other options, in both orders.
- The success path: exit code, that the right loader is called with the right arguments (and the other loader is not), and that the output is silent.
- The violation path: exit code and the exact printed report, including how the option affects the output.
- Failure paths: missing files, failing Git commands, and the exit code and error message.

Unit-test the new logic outside the CLI as well (loaders in `src/commits/`, adapters in `src/utilities/`).
If the option depends on Git behaviour, also read `.agents/skills/git-behaviour-testing/SKILL.md`.

Finish with `vpr fmt`, `vpr check`, and `vpr test`.
