# Comet ☄️

A linter to ensure that Git commit messages conform to certain standards and conventions declared by a customisable set of rules.

> [!CAUTION]  
> Comet v2 is currently in development with an expected release later in 2026.

## Rules

| Symbol                                       | Explanation                                                                        |
|----------------------------------------------|------------------------------------------------------------------------------------|
| ![Command-line](docs/assets/commandline.svg) | The rule is enabled by default in the `comet` CLI on the command-line.             |
| ![GitHub Actions](docs/assets/github.svg)    | The rule is enabled by default in the `rainstormy/comet` action in GitHub Actions. |

| Name                                                                       | Description                                                                                                                                                                                                                                     | Default                                                                                |
|----------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| [`noBlankSubjects`](docs/rules/NoBlankSubjects.md)                         | Rejects subjects without any alphanumeric characters.                                                                                                                                                                                           | ![GitHub Actions](docs/assets/github.svg) ![Command-line](docs/assets/commandline.svg) |
| [`noExcessiveCommitsPerBranch`](docs/rules/NoExcessiveCommitsPerBranch.md) | Rejects branches with more than a configured number of undelivered commits, encouraging short-lived branches and [stacked pull requests](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-stacked-pull-requests). | ![GitHub Actions](docs/assets/github.svg)                                              |
| [`noExcessiveWhitespace`](docs/rules/NoExcessiveWhitespace.md)             | Rejects subjects with leading, trailing, or consecutive whitespace characters, and body lines with consecutive whitespace characters.                                                                                                           | ![GitHub Actions](docs/assets/github.svg) ![Command-line](docs/assets/commandline.svg) |
| [`noMergeCommits`](docs/rules/NoMergeCommits.md)                           | Rejects commits with more than one parent commit, encouraging rebasing instead of merging to keep a branch up to date with the main branch.                                                                                                     | ![GitHub Actions](docs/assets/github.svg) ![Command-line](docs/assets/commandline.svg) |
| [`noRepeatedSubjects`](docs/rules/NoRepeatedSubjects.md)                   | Rejects subjects equal to a previous subject in the current branch.                                                                                                                                                                             | ![GitHub Actions](docs/assets/github.svg)                                              |
| [`noRestrictedTrailers`](docs/rules/NoRestrictedTrailers.md)               | Rejects configured [trailers](https://git-scm.com/docs/git-interpret-trailers) in the message body.                                                                                                                                             |                                                                                        |
| [`noRevertReverts`](docs/rules/NoRevertReverts.md)                         | Rejects subjects with more than one revert marker, encouraging cherry-picking the original commit.                                                                                                                                              | ![GitHub Actions](docs/assets/github.svg)                                              |
| [`noSingleWordSubjects`](docs/rules/NoSingleWordSubjects.md)               | Rejects subjects that contain only one word.                                                                                                                                                                                                    | ![GitHub Actions](docs/assets/github.svg) ![Command-line](docs/assets/commandline.svg) |
| [`noSquashMarkers`](docs/rules/NoSquashMarkers.md)                         | Rejects subjects beginning with a squash marker like `amend!`, `fixup!`, and `squash!`, reminding you to squash temporary commits before merging pull requests.                                                                                 | ![GitHub Actions](docs/assets/github.svg)                                              |
| [`noUnexpectedPunctuation`](docs/rules/NoUnexpectedPunctuation.md)         | Rejects subjects with unexpected trailing punctuation.                                                                                                                                                                                          | ![GitHub Actions](docs/assets/github.svg) ![Command-line](docs/assets/commandline.svg) |
| [`useAuthorEmailPatterns`](docs/rules/UseAuthorEmailPatterns.md)           | Rejects commits where the author's email address does not match one of the configured regex patterns.                                                                                                                                           |                                                                                        |
| [`useAuthorNamePatterns`](docs/rules/UseAuthorNamePatterns.md)             | Rejects commits where the author's name does not match one of the configured regex patterns.                                                                                                                                                    |                                                                                        |
| [`useCapitalisedSubjects`](docs/rules/UseCapitalisedSubjects.md)           | Rejects subjects that start with a lowercase letter.                                                                                                                                                                                            | ![GitHub Actions](docs/assets/github.svg) ![Command-line](docs/assets/commandline.svg) |
| [`useCommitterEmailPatterns`](docs/rules/UseCommitterEmailPatterns.md)     | Rejects commits where the committer's email address does not match one of the configured regex patterns.                                                                                                                                        |                                                                                        |
| [`useCommitterNamePatterns`](docs/rules/UseCommitterNamePatterns.md)       | Rejects commits where the committer's name does not match one of the configured regex patterns.                                                                                                                                                 |                                                                                        |
| [`useConciseSubjects`](docs/rules/UseConciseSubjects.md)                   | Rejects subjects longer than the configured character limit.                                                                                                                                                                                    | ![GitHub Actions](docs/assets/github.svg) ![Command-line](docs/assets/commandline.svg) |
| [`useEmptyLineBeforeBody`](docs/rules/UseEmptyLineBeforeBody.md)           | Rejects commits whose message body is not separated from the subject (i.e. the first line) by exactly one empty line.                                                                                                                           | ![GitHub Actions](docs/assets/github.svg) ![Command-line](docs/assets/commandline.svg) |
| [`useImperativeSubjects`](docs/rules/UseImperativeSubjects.md)             | Rejects subjects that do not start with a verb in the imperative mood.                                                                                                                                                                          | ![GitHub Actions](docs/assets/github.svg) ![Command-line](docs/assets/commandline.svg) |
| [`useIssueLinks`](docs/rules/UseIssueLinks.md)                             | Rejects subjects without an issue link in the configured position.                                                                                                                                                                              |                                                                                        |
| [`useLineWrapping`](docs/rules/UseLineWrapping.md)                         | Rejects body lines longer than the configured character limit.                                                                                                                                                                                  | ![GitHub Actions](docs/assets/github.svg) ![Command-line](docs/assets/commandline.svg) |
| [`useSignedCommits`](docs/rules/UseSignedCommits.md)                       | Rejects commits without a cryptographic signature.                                                                                                                                                                                              | ![GitHub Actions](docs/assets/github.svg) ![Command-line](docs/assets/commandline.svg) |

## Command-line interface (CLI)

The Comet CLI checks the commits on the current branch that have not been delivered to the default branch, i.e. the range `origin/HEAD..HEAD` for a remote named `origin`.
If no remote exists, it checks the local range `main..HEAD` or `master..HEAD`.

It does not modify any commits.

### Usage with Node.js

Install [`@rainstormy/comet`](https://www.npmjs.com/package/@rainstormy/comet) with a package manager of your choice, for example:

```shell
pnpm add --save-dev @rainstormy/comet
```

If `node_modules/.bin/` is linked to your `PATH`, you can run Comet directly:

```shell
comet \
  [--config <path>] \
  [--default-branch <branch>] \
  [--skip-missing-configs]
```

You can also define a custom task in `package.json` or `vite.config.ts` (with Vite+):

```json
{
  "scripts": {
    "lint-commits": "comet"
  }
}
```

Run it with your package manager, for example:

```shell
pnpm run lint-commits
```

Or with Vite+:

```shell
vpr lint-commits
```

### Usage with Deno

Install and run Comet directly with [Deno](https://deno.com):

```shell
deno run \
  --allow-env \
  --allow-read='comet.json,comet.jsonc' \
  --allow-run='git' \
  npm:@rainstormy/comet \
  [--config <path>] \
  [--default-branch <branch>] \
  [--skip-missing-configs]
```

If you use a custom configuration file or `extends`, add its path to `--allow-read`.

## GitHub Actions

The `rainstormy/comet` action checks the commits of the current pull request.
It must run in workflows triggered by `pull_request` events.

The `github-token` needs `pull-requests: read` permissions to allow Comet to [list the pull request's commits](https://docs.github.com/en/rest/pulls/pulls?apiVersion=2026-03-10#list-commits-on-a-pull-request).

To load a configuration file, it needs `contents: read` permissions and an `actions/checkout` step before the `rainstormy/comet` step.
Use `config-path` to specify a custom configuration file path.

```yaml
name: CI

on: pull_request

jobs:
  commit-messages:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: rainstormy/comet@v2.0.0-beta.1
        with:
          github-token: ${{ github.token }}
          config-path: .github/comet.jsonc
```

## Configuration

Comet applies a reasonable default configuration of rules.

To customise the configuration, create a `comet.json` or `comet.jsonc` file in the project root directory.
Override the settings you want to change, for example:

```json
{
  "$schema": "https://unpkg.com/@rainstormy/comet@2.0.0-beta.1/schema.json",
  "rules": {
    "noMergeCommits": "error",
    "useConciseSubjects": {
      "level": "error",
      "options": { "maxLength": 60 }
    },
    "useSignedCommits": "off"
  }
}
```

Use `--config <path>` in the CLI or `config-path` in GitHub Actions to use a different configuration path.

A configuration file can inherit settings from another file with the `extends` property:

```json
{
  "extends": "./comet.base.json",
  "rules": {
    "noSquashMarkers": "error"
  }
}
```
