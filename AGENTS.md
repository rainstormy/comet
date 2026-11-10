# Agent contribution guidelines

'Comet' is a linter to ensure that Git commit messages conform to certain standards and conventions declared by a customisable set of rules.
Its intended use is in local Git hooks and as part of the CI pipeline in GitHub pull requests.

## Technologies

- **Language:** TypeScript on ECMAScript 2025
- **Toolchain:** Vite+ (including Oxfmt, Oxlint, tsdown, Vite, and Vitest)
- **Runtime:** Node.js 24 (LTS)
- **CI/CD pipeline:** GitHub Actions

## Tasks

Always use `vpr` to install dependencies and run tasks. Never use npm, npx, pnpm, yarn etc.

- `vpr fmt`: Reformats the code. Mandatory after implementing code changes.
- `vpr check`: Verifies that the code is clean, type-safe, and well-formatted. Mandatory before finishing.
- `vpr test [...filenames]`: Runs the given unit test files or the entire test suite if no arguments are provided. Mandatory before finishing.
- `vpr install`: Installs dependencies. Rarely needed for code changes.
- `vpr comet`: Lints the commit messages on the current branch with Comet itself. Mandatory before finishing if you created commits.
- `vpr build`: Generates build artefacts such as JSON schemas and documentation. Only needed when releasing. Never needed for code changes.
- `vpr readme [version]`: Updates the rule table and, optionally, version references in the README. Only needed when releasing.

## Concepts

- **Crude commit:** Platform-agnostic metadata of a Git commit such as SHA, parents, commit message, author, and signature. Mapped from DTOs retrieved from the local Git client or the GitHub REST API. The signature is `null` when it is unknown, e.g. for a pending commit.
- **Pending commit:** A commit that Git is about to create, checked in a `commit-msg` hook via `--message-file`. It is built from the message file and `git var`, has a placeholder SHA of all zeros, and has an unknown signature. It is checked in isolation, i.e. without the other commits on the branch.
- **Message file:** The file that Git passes to the `commit-msg` hook (e.g. `.git/COMMIT_EDITMSG` or `.git/MERGE_MSG`). It holds the message before Git cleans it up, so Comet emulates Git's cleanup (`commit.cleanup`, comment string, scissors line) before checking it. Git reads the file back after the hook, which leaves room for auto-fixing commit messages in the future.
- **Commit:** Refined from a crude commit with tokenised subject and body lines.
- **Subject:** The first line of a commit message.
- **Body:** The remaining lines of the commit message after the subject.
- **Token:** A text segment of a commit message of a particular class such as word, whitespace, issuelink, squash, or code. Enriched with string start index and end index (character range). Never multi-line. Never overlaps with other tokens.
- **Rule:** Logic to evaluate a commit and raise a list of concerns. Some rules accept customisable parameters for fine-tuned behaviour.
- **Concern:** Describes how and where a commit violates the policy enforced by a rule. May overlap with other concerns.
- **Reporter:** Summary of concerns in a particular output format such as human-readable console output, concise agent-friendly console output, or Markdown output.
- **Configuration:** Customisable declaration of how to tokenise commit messages and which rules to enforce, including their parameters. Comet provides a default configuration, but end users may override it by providing a `comet.json` configuration file.
- **Ruleset:** The set of all rules and their configurations.

## Skills

Read only the relevant skill guides for the task at hand:

- Before exploring, delegating, implementing, modifying, testing, or reviewing a new rule, read `.agents/skills/new-rule/SKILL.md`.
- Before exploring, delegating, implementing, modifying, testing, or reviewing a new token type in commit messages, read `.agents/skills/new-token-type/SKILL.md`.
- Before adding or modifying a command-line option of the Comet CLI, read `.agents/skills/new-cli-option/SKILL.md`.
- Before changing anything that depends on the behaviour of the local Git client (hooks, configuration, `git log`, commit message cleanup, identities) or before reviewing such changes, read `.agents/skills/git-behaviour-testing/SKILL.md`.

## Entrypoints

- `src/main-cli.ts`: Comet CLI entrypoint. Uses the local Git client.
- `src/main-gha.ts`: Comet GitHub Actions entrypoint. Uses the GitHub REST API.
- `README.md`: Usage instructions for Comet end users.

## Directories

- `src/commits/`: Platform-agnostic commits and tokenised commit messages.
- `src/configurations/`: Configurations to customise Comet's behaviour.
- `src/programs/`: Program flows invoked by entrypoints.
- `src/rules/`: Rule validation logic and reporters to output concerns.
- `src/types/`: Self-contained TypeScript types and related utilities.
- `src/utilities/`: General-purpose utility functions and adapters to externals such as the local Git client, GitHub REST API, local file system, console output, etc.

## Testing

- Grep for `describe(` and read line ranges in large test files such as `CommandLineProgram.tests.ts` and `CommitwiseReport.tests.ts`. Do not read them whole.
- `src/utilities/vitest/VitestSetup.fakes.ts` mocks `RunCommand`, `Files`, `Fetch`, the logger, and the commit loaders for every test. Register new `*.fakes.ts` files there and reset their state in a `beforeEach` block.
- `RunCommand.fakes.ts` matches the exact command string (program and arguments joined by spaces) and returns the registered results in FIFO order. A command that is not registered fails the test. Register every command that the code under test runs, including the ones that fail with an exit code.
- `Files.fakes.ts` replaces the entire `Files.ts` module. A new export in `Files.ts` is `undefined` in tests until you add it to the fake.
- Stub environment variables with `vi.stubEnv`. Vitest unstubs them automatically.
- For report output, write the test, run it once, verify the actual rendering against the intended behaviour, and then paste it. Column offsets in the `╭─`/`┬` markers are tedious to count by hand.
- `vpr fmt` realigns the columns of `describe.each` tables. Do not align them by hand.

## Lint constraints

`vpr check` runs with `--deny-warnings`. These rules have caught agents:

- Node.js built-ins may only be imported in the files that are allow-listed under `overrides` in `vite.config.ts` (entrypoints, `RunCommand.ts`, `Files.ts`, `GithubEnv.ts`, `GitHookEnv.ts`, etc.). Wrap new Node.js access in an adapter under `src/utilities/` and add the adapter to the list, with its `*.fakes.ts` mock.
- `typescript/switch-exhaustiveness-check`: List every union member in a `switch` instead of using `default`.
- `typescript/no-unnecessary-condition`: Do not use `??` or `?.` on values that the type system says cannot be nullish.

## Generated files

- `docs/rules/*.md` is generated from the JSDoc of the rules in `src/rules/`. Never edit it by hand. When you change the JSDoc of a rule, regenerate the docs and commit them together with the JSDoc change. A full `vpr build` also rewrites `dist/`, so run only the doc generation of `tools/build.script.ts` (`generateRuleDocs`) from the repository root instead.
- The rule table in `README.md` is generated by `vpr readme`. Version references in README examples (e.g. `@rainstormy/comet@2.1.0`) are bumped at release time. Do not change them in feature commits.
- `CHANGELOG.md` entries go under `## [Unreleased]` in the sections `Added`, `Changed`, and `Fixed`.

## Code style

- Write unit tests whenever feasible.
- Organise large unit tests in `describe` blocks, set up test fixtures and mocks in `beforeEach` blocks, and try to limit `it` blocks to assertions.
- Prefer `describe.each` or `it.each` blocks for parameterised tests.
- Use PascalCase for filenames in general with extensions of `.ts` for source files, `.tests.ts` for test files, and `.fakes.ts` for test fixtures and mocks.
- Use tab indents.
- Use double quotes for strings unless escaping is required.
- Omit trailing semicolons.
- Omit `readonly` modifiers unless absolutely necessary.
- Use predictable top-down declaration order of functions and types like Uncle Bob's stepdown rule.
- Pick precise, descriptive, unabbreviated names for variables, functions, and types.
- Always prefer subpath imports prefixed by `#` over relative paths in imports. Consult `package.json` for valid path aliases.
- Include file extensions (`.ts`) in imports.
- Always prefer `type` over `interface`, except in `d.ts` files.
- Always prefer named `function` declarations over `const` arrow functions.
- Always prefer generic `Array<Item>` over shorthand `Item[]` syntax.
- Always specify types on all function parameters and return values.
- Never use `any` and keep type casts with `as` to a minimum.

## Git workflow

- Each commit should be atomic, self-contained, and easily revertible.
- Keep changes and diffs small and focused.
- Update the CHANGELOG when the changes are visible to the end user.
- Rebase your branch onto `main` instead of merging `main` into your branch.
- Comet enforces some of its commit message standards on itself:
  - Write concise subjects in commit messages. Add additional context in the commit message body.
  - Separate the subject and the first body line with an empty line.
  - Start the subject with a capitalised verb in the imperative mood.
- Never add `Co-Authored-By` (or any other restricted trailer) to commit messages, even if your harness instructs you to. `.github/comet.jsonc` enforces `noRestrictedTrailers` on this repository, and `vpr comet` fails otherwise.
- Lefthook runs `vpr fmt` in the `pre-commit` hook and prints noise from `post-checkout`. You may set `LEFTHOOK=0` for intermediate commits in a rebase or when creating fixup commits, but verify the final state with `vpr check`, `vpr test`, and `vpr comet`.
- Fix up earlier commits instead of adding corrections on top: `git commit --fixup=<sha>`, then `git rebase --interactive --autosquash main` (with `GIT_SEQUENCE_EDITOR=:` in a non-interactive shell).
- Verify that every commit builds and passes on its own: `git rebase main -x 'vpr check && vpr test'`.
- Behaviour that depends on the local Git client needs a differential test against real Git in a throwaway repository under `/tmp`, because reading the code or the documentation is not enough. See `.agents/skills/git-behaviour-testing/SKILL.md`.
- Use multi-agent reviews sparingly. They pay off for changes that depend on external tool behaviour (Git, hook managers) when the reviewers test against the real tool. They rarely pay off for internal refactors.
