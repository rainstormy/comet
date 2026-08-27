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

## Concepts

- **Crude commit:** Platform-agnostic metadata of a Git commit such as SHA, parents, commit message, author, and signature. Mapped from DTOs retrieved from the local Git client or the GitHub REST API.
- **Commit:** Refined from a crude commit with tokenised subject line and body lines.
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
- Always specify types on top-level consts and all function parameters and return values.
- Never use `any` and keep type casts with `as` to a minimum.

## Git workflow

- Each commit should be atomic, self-contained, and easily revertible.
- Keep changes and diffs small and focused.
- Rebase your branch onto `main` instead of merging `main` into your branch.
- Comet enforces some of its commit message standards on itself:
  - Write concise subject lines in commit messages. Add additional context in the commit message body.
  - Separate the subject line and the first body line with an empty line.
  - Start the subject line with a capitalised verb in the imperative mood.
