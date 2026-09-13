# Comet ☄️

A linter to ensure that Git commit messages conform to certain standards and conventions declared by a customisable set of rules.

> [!CAUTION]  
> Comet v2 is currently in development with an expected release later in 2026.

## Command-Line Interface (CLI)
### Installation
Install [`@rainstormy/comet`](https://www.npmjs.com/package/@rainstormy/comet)
with a package manager of your choice, for example:

```shell
pnpm add --save-dev @rainstormy/comet
```

### Usage
<mark>TODO</mark>

## GitHub Actions
### Usage
<mark>TODO</mark>

## Rules
| Key                                                                        | Description                                                   | Default |
|----------------------------------------------------------------------------|---------------------------------------------------------------|---------|
| [`noBlankSubjectLines`](docs/rules/NoBlankSubjectLines.md)                 | Require meaningful subject lines.                             | true    |
| [`noExcessiveCommitsPerBranch`](docs/rules/NoExcessiveCommitsPerBranch.md) | Limit the number of commits in a branch.                      | true    |
| [`noExcessiveWhitespace`](docs/rules/NoExcessiveWhitespace.md)             | Disallow excessive whitespace in commit messages.             | true    |
| [`noMergeCommits`](docs/rules/NoMergeCommits.md)                           | Disallow merge commits.                                       | true    |
| [`noRepeatedSubjectLines`](docs/rules/NoRepeatedSubjectLines.md)           | Require unique subject lines in a branch.                     | true    |
| [`noRestrictedTrailers`](docs/rules/NoRestrictedTrailers.md)               | Disallow configured message trailers.                         | true    |
| [`noRevertRevertCommits`](docs/rules/NoRevertRevertCommits.md)             | Disallow commits that revert a revert.                        | true    |
| [`noSingleWordSubjectLines`](docs/rules/NoSingleWordSubjectLines.md)       | Require subject lines with at least two words.                | true    |
| [`noSquashMarkers`](docs/rules/NoSquashMarkers.md)                         | Disallow autosquash markers.                                  | true    |
| [`noUnexpectedPunctuation`](docs/rules/NoUnexpectedPunctuation.md)         | Disallow trailing punctuation in subject lines.               | true    |
| [`useAuthorEmailPatterns`](docs/rules/UseAuthorEmailPatterns.md)           | Require author email addresses to match accepted patterns.    | true    |
| [`useAuthorNamePatterns`](docs/rules/UseAuthorNamePatterns.md)             | Require author names to match accepted patterns.              | true    |
| [`useCapitalisedSubjectLines`](docs/rules/UseCapitalisedSubjectLines.md)   | Require capitalised subject lines.                            | true    |
| [`useCommitterEmailPatterns`](docs/rules/UseCommitterEmailPatterns.md)     | Require committer email addresses to match accepted patterns. | true    |
| [`useCommitterNamePatterns`](docs/rules/UseCommitterNamePatterns.md)       | Require committer names to match accepted patterns.           | true    |
| [`useConciseSubjectLines`](docs/rules/UseConciseSubjectLines.md)           | Limit subject-line length.                                    | true    |
| [`useEmptyLineBeforeBodyLines`](docs/rules/UseEmptyLineBeforeBodyLines.md) | Separate a subject and body with one empty line.              | true    |
| [`useImperativeSubjectLines`](docs/rules/UseImperativeSubjectLines.md)     | Require imperative subject lines.                             | true    |
| [`useIssueLinks`](docs/rules/UseIssueLinks.md)                             | Require issue links in subject lines.                         | true    |
| [`useLineWrapping`](docs/rules/UseLineWrapping.md)                         | Limit body-line length.                                       | true    |
| [`useSignedCommits`](docs/rules/UseSignedCommits.md)                       | Require cryptographically signed commits.                     | true    |

## Configuration
<mark>TODO</mark>
