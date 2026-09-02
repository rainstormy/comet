# Changelog

This file documents all notable changes to this project.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0),
and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- **BREAKING:** Upgrade Node.js to 24.

## [1.1.9] - 2025-07-27
### Changed
- Reduce the size of the bundle downloaded by the GitHub Actions runner:
  - Drop [GitHub Actions Toolkit](https://github.com/actions/toolkit) as a
    runtime dependency and interact directly with the GitHub REST API via the
    Fetch API in Node.js.
  - Replace [Zod](https://github.com/colinhacks/zod)
    with [Valibot](https://github.com/fabian-hiller/valibot) as data validation
    library.

### Fixed
- Recognise `cross-check`, `deconsolidate`, `outfigure`, `outguess`, `outthink`,
  `overreach`, `preenact`/`pre-enact`, `prefigure`, `pre-release`, `prerender`/
  `pre-render`, `recheck`/`re-check`, `reenable`/`re-enable`, `reenact`/
  `re-enact`, `uncheck`, `unconsolidate`, `unresolve`, `unset`, `unsettle`,
  `untick`, and `upsert` as verbs in the `imperative-subject-lines` rule.

## [1.1.8] - 2025-03-31
### Fixed
- Downgrade [Undici](https://github.com/nodejs/undici) to 6.21.2 to preserve
  compatibility with Node.js 20.

## [1.1.7] - 2025-03-30
### Fixed
- Detect and ignore trailing hexadecimal hashes and semantic version numbers
  with prerelease segments in the `limit-length-of-subject-lines` rule.
- Recognise `deallocate`, `decommission`, `dequeue`, `digitalise`/`digitalize`,
  `digitise`/`digitize`, `enqueue`, `generify`, `mislexicalise`/`mislexicalize`,
  `misparse`, `mistokenise`/`mistokenize`, `prerelease`,
  `professionalise`/`professionalize`, `quantise`/`quantize`, `reallocate`,
  `reassign`, `recollapse`, `recommission`, `recommit`, `recouple`, `redeploy`,
  `regroup`, `remerge`, `requeue`, `re-read`, `rerelease`/`re-release`,
  `retrap`, `robustify`, `tokenise`/`tokenize`, `unassign`, `unblur`, `unbump`,
  `uncollapse`, `uncommit`, `uncouple`, `undeploy`, `unfocus`, `ungroup`,
  `unmerge`, `unpair`, `unrelease`, `unsquash`, `untrap`, and `unzoom` as verbs
  in the `imperative-subject-lines` rule.

## [1.1.6] - 2024-10-28
### Fixed
- Recognise `autocreate`, `autodelete`, `autofill`, `autofire`, `autofocus`,
  `autojoin`, `automerge`, `autorelease`, `modularise`/`modularize`, `postfix`,
  and `prefill` as verbs in the `imperative-subject-lines` rule.

## [1.1.5] - 2024-05-20
### Changed
- Use [pnpm](https://pnpm.io) as the package manager instead
  of [Yarn PnP](https://yarnpkg.com).

### Fixed
- Recognise `alias`, `inline`, `proxy`, and `reroute` as verbs in the
  `imperative-subject-lines` rule.

## [1.1.4] - 2023-12-18
### Fixed
- Recognise `coauthor`/`co-author`, `colocate`/`co-locate`, `collocate`,
  `copilot`/`co-pilot`, `deauthenticate`, `deauthorise`/`deauthorize`,
  `deorbit`, `parameterise`/`parameterize`/`parametrise`/`parametrize`, `remix`,
  and `unauthorise`/`unauthorize` as verbs in the `imperative-subject-lines`
  rule.

## [1.1.3] - 2023-11-03
### Fixed
- Recognise `decouple` as a verb in the `imperative-subject-lines` rule.

## [1.1.2] - 2023-10-20
### Changed
- Run on Node.js 20, as Node.js 16 is
  to [become obsolete in GitHub Actions](https://github.blog/changelog/2023-09-22-github-actions-transitioning-from-node-16-to-node-20).
  This change should neither require any changes to your workflow files nor
  affect the visible behaviour of this action. Hence, it is not considered to be
  a breaking change.

## [1.1.1] - 2023-09-09
### Fixed
- Reduce the size of the bundle downloaded by the GitHub Actions runner. The
  tarball archive exported by GitHub no longer contains Yarn PnP binaries.

## [1.1.0] - 2023-05-04
### Added
- New rule: `unique-subject-lines`.

### Fixed
- Ignore semantic version updates (i.e. subject lines that end with `to X.Y.Z`)
  in the `limit-length-of-subject-lines` rule.
- Ignore lines that contain an `https://` URL in the
  `limit-length-of-body-lines` rule.

## [1.0.1] - 2023-04-17
### Added
- [MIT license](https://choosealicense.com/licenses/mit).

### Fixed
- Recognise `scaffold` as a verb in the `imperative-subject-lines` rule.

## [1.0.0] - 2023-04-01
### Added
- GitHub Actions entrypoint.
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
