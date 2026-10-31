# Changelog

This file documents all notable changes to this project.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- New rule: `useConventionalCommits`. Disabled by default.
- New token configuration to recognise prefixes of Conventional Commits: `tokens.conventionalCommits`.

### Changed
- `noBlankSubjects`, `noSingleWordSubjects`, `useCapitalisedSubjects`, `useConciseSubjects`, `useImperativeSubjects`, and `useIssueLinks` ignore prefixes of Conventional Commits configured in `tokens.conventionalCommits`.

### Fixed
- Print hyperlinks to rule documentation in plain text in GitHub Actions.
- `useImperativeSubjects`: Accept `autolink`, `chug`, `containerise`/`containerize`, `delink`, `delist`, `malform`, `malfunction`, `misform`, `nebulise`/`nebulize`, `relink`, `relist`, `unlink`, `unlist`, `virtualise`/`virtualize`.

## [2.0.0] - 2026-10-22
### Added
- New command-line interface (CLI) to check commits locally: `comet`. Published to npm as [`@rainstormy/comet`](https://www.npmjs.com/package/@rainstormy/comet).
- Shareable, extensible JSON configuration files for the CLI and GitHub Actions, including an official JSON schema.
- New GitHub Action input: `config-path`.
- Default rulesets for a zero-configuration setup.
- New rule: `noBlankSubjects`. Enabled by default.
- New rule: `noExcessiveCommitsPerBranch`. Enabled by default in GitHub Actions with a limit of 10 commits.
- New rule: `useSignedCommits`. Enabled by default.
- `useImperativeSubjects`: Warn about redundant whitelist entries in the configuration.
- `useIssueLinks`: Warn about missing issue link token configuration.
- Offending characters are now highlighted in commit messages that break the rules.

### Changed
- **BREAKING:** New project name: Comet.
- **BREAKING:** The `rainstormy/github-action-validate-commit-messages` action has been renamed to `rainstormy/comet`.
- **BREAKING:** Existing rules have been renamed and adapted to the default rulesets:
  - `acknowledged-author-email-addresses` -> `useAuthorEmailPatterns`. Disabled by default.
  - `acknowledged-author-names` -> `useAuthorNamePatterns`. Disabled by default.
  - `acknowledged-committer-email-addresses` -> `useCommitterEmailPatterns`. Disabled by default.
  - `acknowledged-committer-names` -> `useCommitterNamePatterns`. Disabled by default.
  - `capitalised-subject-lines` -> `useCapitalisedSubjects`. Enabled by default.
  - `empty-line-after-subject-lines` -> `useEmptyLineBeforeBody`. Enabled by default.
  - `imperative-subject-lines` -> `useImperativeSubjects`. Enabled by default.
  - `issue-references-in-subject-lines` -> `useIssueLinks`. Disabled by default.
  - `limit-length-of-body-lines` -> `useLineWrapping`. Enabled by default with a character limit of 72 characters per line.
  - `limit-length-of-subject-lines` -> `useConciseSubjects`. Enabled by default with a character limit of 50 characters.
  - `multi-word-subject-lines` -> `noSingleWordSubjects`. Enabled by default.
  - `no-co-authors` -> `noRestrictedTrailers`. Disabled by default.
  - `no-merge-commits` -> `noMergeCommits`. Enabled by default.
  - `no-revert-revert-commits` -> `noRevertReverts`. Enabled by default in GitHub Actions.
  - `no-squash-commits` -> `noSquashMarkers`. Enabled by default in GitHub Actions.
  - `no-trailing-punctuation-in-subject-lines` -> `noUnexpectedPunctuation`. Enabled by default.
  - `no-unexpected-whitespace` -> `noExcessiveWhitespace`. Enabled by default.
  - `unique-subject-lines` -> `noRepeatedSubjects`. Enabled by default in GitHub Actions.
- Rule violations are now grouped by commit instead of by rule.
- [Upgrade Node.js to 24](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners).
- Upgrade GitHub REST API version to 2026-03-10.

### Removed
- **BREAKING:** Obsolete GitHub Action inputs (replaced by configuration files):
  - `rules`. Replaced by the `rules` object in configuration files.
  - `acknowledged-author-email-addresses--patterns`. Replaced by `rules.useAuthorEmailPatterns.options.patterns`.
  - `acknowledged-author-names--patterns`. Replaced by `rules.useAuthorNamePatterns.options.patterns`.
  - `acknowledged-committer-email-addresses--patterns`. Replaced by `rules.useCommitterEmailPatterns.options.patterns`.
  - `acknowledged-committer-names--patterns`. Replaced by `rules.useCommitterNamePatterns.options.patterns`.
  - `imperative-subject-lines--whitelist`. Replaced by `rules.useImperativeSubjects.options.whitelist`.
  - `issue-references-in-subject-lines--allowed-positions`. Replaced by `rules.useIssueLinks.options.position`.
  - `issue-references-in-subject-lines--patterns`. Replaced by `tokens.issueLinks.prefixes` and `tokens.issueLinks.wildcards`.
  - `limit-length-of-body-lines--max-characters`. Replaced by `rules.useLineWrapping.options.maxLength`.
  - `limit-length-of-subject-lines--max-characters`. Replaced by `rules.useConciseSubjects.options.maxLength`.
  - `no-squash-commits--disallowed-prefixes`. No longer configurable.
  - `no-trailing-punctuation-in-subject-lines--whitelist`. No longer configurable.
- **BREAKING:** Major-only version tags such as `v1` and `v2` are no longer published. Pin the `rainstormy/comet` action to a commit SHA (recommended) or a full version tag (e.g. `v2.0.0`) instead.

### Fixed
- `noUnexpectedPunctuation`: Improve recognition of hyphenated words, apostrophes, and names containing punctuation.
- `useImperativeSubjects`: Accept `adjectify`, `adjectivise`/`adjectivize`, `adventure`, `adverbialise`/`adverbialize`, `alight`, `ambulate`, `autobuild`, `autocompile`, `autosquash`, `autoupdate`, `blench`, `blubber`, `chafe`, `cherrypick`/`cherry-pick`, `chortle`, `coalesce`, `cohere`, `combobulate`, `commiserate`, `condole`, `dally`, `decompile`, `defocus`, `desolder`, `discombobulate`, `disfocus`, `dither`, `empathise`/`empathize`, `forcepush`/`force-push`, `hike`, `knead`, `languish`, `lint`, `meditate`, `opine`, `perambulate`, `pique`, `prebuild`, `precompile`, `prioritise`/`prioritize`, `provision`, `quibble`, `reambulate`, `recombobulate`, `recompile`, `reminisce`, `reposition`, `reseparate`, `resolder`, `restage`, `ruminate`, `skyrocket`, `snooze`, `solder`, `soothe` (corrected from `sooth`), `stroll`, `substantify`, `substantivise`/`substantivize`, `tarry`, `tinker`, `toddle`, `transpile`, `triage`, `unbundle`, `undulate`, `unsolder`, `unstage`, `vendor`, `version`, `vouch`, `waft`, `waltz`, `wheedle`, `wilt`, `winnow`, `yodel`.

## [1.1.9] - 2025-07-27
### Fixed
- Bundle size reduction: Call the GitHub REST API directly, dropping the [GitHub Actions Toolkit](https://github.com/actions/toolkit) (−971 KB difference).
- Bundle size reduction: Use [Valibot](https://github.com/fabian-hiller/valibot) for data validation, dropping [Zod](https://github.com/colinhacks/zod) (−58 KB difference).
- `imperative-subject-lines`: Accept `cross-check`, `deconsolidate`, `outfigure`, `outguess`, `outthink`, `overreach`, `preenact`/`pre-enact`, `prefigure`, `pre-release`, `prerender`/ `pre-render`, `recheck`/`re-check`, `reenable`/`re-enable`, `reenact`/ `re-enact`, `uncheck`, `unconsolidate`, `unresolve`, `unset`, `unsettle`, `untick`, `upsert`.

## [1.1.8] - 2025-03-31
### Fixed
- Downgrade [Undici](https://github.com/nodejs/undici) to 6.21.2 to preserve compatibility with Node.js 20.

## [1.1.7] - 2025-03-30
### Fixed
- `limit-length-of-subject-lines`: Accept hexadecimal hash codes and semantic version numbers with prerelease segments.
- `imperative-subject-lines`: Accept `deallocate`, `decommission`, `dequeue`, `digitalise`/`digitalize`, `digitise`/`digitize`, `enqueue`, `generify`, `mislexicalise`/`mislexicalize`, `misparse`, `mistokenise`/`mistokenize`, `prerelease`, `professionalise`/`professionalize`, `quantise`/`quantize`, `reallocate`, `reassign`, `recollapse`, `recommission`, `recommit`, `recouple`, `redeploy`, `regroup`, `remerge`, `requeue`, `re-read`, `rerelease`/`re-release`, `retrap`, `robustify`, `tokenise`/`tokenize`, `unassign`, `unblur`, `unbump`, `uncollapse`, `uncommit`, `uncouple`, `undeploy`, `unfocus`, `ungroup`, `unmerge`, `unpair`, `unrelease`, `unsquash`, `untrap`, `unzoom`.

## [1.1.6] - 2024-10-28
### Fixed
- `imperative-subject-lines`: Accept `autocreate`, `autodelete`, `autofill`, `autofire`, `autofocus`, `autojoin`, `automerge`, `autorelease`, `modularise`/`modularize`, `postfix`, `prefill`.

## [1.1.5] - 2024-05-20
### Changed
- Use [pnpm](https://pnpm.io) as the package manager instead of [Yarn PnP](https://yarnpkg.com).

### Fixed
- `imperative-subject-lines`: Accept `alias`, `inline`, `proxy`, `reroute`.

## [1.1.4] - 2023-12-18
### Fixed
- `imperative-subject-lines`: Accept `coauthor`/`co-author`, `colocate`/`co-locate`, `collocate`, `copilot`/`co-pilot`, `deauthenticate`, `deauthorise`/`deauthorize`, `deorbit`, `parameterise`/`parameterize`/`parametrise`/`parametrize`, `remix`, `unauthorise`/`unauthorize`.

## [1.1.3] - 2023-11-03
### Fixed
- `imperative-subject-lines`: Accept `decouple`.

## [1.1.2] - 2023-10-20
### Changed
- [Upgrade to Node.js 20](https://github.blog/changelog/2023-09-22-github-actions-transitioning-from-node-16-to-node-20).

## [1.1.1] - 2023-09-09
### Fixed
- Bundle size reduction: Remove unnecessary Yarn PnP binaries from the tarball archive (−41 MB difference).

## [1.1.0] - 2023-05-04
### Added
- New rule: `unique-subject-lines`.

### Fixed
- `limit-length-of-subject-lines`: Accept semantic version updates (i.e. subject lines that end with `to X.Y.Z`).
- `limit-length-of-body-lines`: Accept lines that contain an `https://` URL.

## [1.0.1] - 2023-04-17
### Added
- [MIT license](https://choosealicense.com/licenses/mit).

### Fixed
- `imperative-subject-lines`: Accept `scaffold`.

## [1.0.0] - 2023-04-01
### Added
- New GitHub Action: `rainstormy/github-action-validate-commit-messages`.
- New rule: `acknowledged-author-email-addresses`.
- New rule: `acknowledged-author-names`.
- New rule: `acknowledged-committer-email-addresses`.
- New rule: `acknowledged-committer-names`.
- New rule: `capitalised-subject-lines`.
- New rule: `empty-line-after-subject-lines`.
- New rule: `imperative-subject-lines`.
- New rule: `issue-references-in-subject-lines`.
- New rule: `limit-length-of-body-lines`.
- New rule: `limit-length-of-subject-lines`.
- New rule: `multi-word-subject-lines`.
- New rule: `no-co-authors`.
- New rule: `no-merge-commits`.
- New rule: `no-revert-revert-commits`.
- New rule: `no-squash-commits`.
- New rule: `no-trailing-punctuation-in-subject-lines`.
- New rule: `no-unexpected-whitespace`.

[unreleased]: https://github.com/rainstormy/comet/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/rainstormy/comet/compare/v1.1.9...v2.0.0
[1.1.9]: https://github.com/rainstormy/comet/compare/v1.1.8...v1.1.9
[1.1.8]: https://github.com/rainstormy/comet/compare/v1.1.7...v1.1.8
[1.1.7]: https://github.com/rainstormy/comet/compare/v1.1.6...v1.1.7
[1.1.6]: https://github.com/rainstormy/comet/compare/v1.1.5...v1.1.6
[1.1.5]: https://github.com/rainstormy/comet/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/rainstormy/comet/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/rainstormy/comet/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/rainstormy/comet/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/rainstormy/comet/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/rainstormy/comet/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/rainstormy/comet/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/rainstormy/comet/releases/tag/v1.0.0
