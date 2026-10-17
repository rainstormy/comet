# Changelog

This file documents all notable changes to this project.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- **BREAKING:** Upgrade Node.js to 24.

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

[unreleased]: https://github.com/rainstormy/comet/compare/v1.1.9...HEAD
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
