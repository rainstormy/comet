import type { Commits } from "#commits/Commit.ts"
import { isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"

/**
 * Rejects subject lines that contain only one word.
 *
 * ## Rationale
 *
 * The subject line is the part of a commit that readers see most often when scanning the commit history.
 *
 * A descriptive subject line makes the commit distinguishable from other commits.
 * This keeps the commit history readable and makes the commit easier to find.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * Add enough context to say what changed or why, such as `Fix validation` instead of `Fix`. To repair an existing commit, start an interactive rebase and mark it `reword`:
 *
 * ```shell
 * git rebase --interactive <commit-sha>
 * ```
 *
 * TODO: ### IntelliJ IDEA
 *
 * In the Git tool window, right-click the commit and select `Edit Commit Message...` to edit the subject line.
 *
 * TODO: ## Remarks
 *
 * - Revert commits are skipped.
 * - Blank subjects and subjects containing only configured issue links or squash markers are accepted.
 * - Configured issue links and squash markers do not count as words; hyperlinks, inline code phrases
 *   (enclosed in `backticks`), and semver tokens count as one word each.
 *
 * ## Options
 *
 * This rule has no configurable options.
 *
 * ```json
 * {
 *   "rules": {
 *     "noSingleWordSubjectLines": {
 *       "level": "error",
 *       "options": {}
 *     }
 *   }
 * }
 * ```
 *
 * TODO: ## Examples
 *
 * ### Rejected
 *
 * ```
 * WIP
 * ```
 *
 * ```
 * fixup! Test
 * ```
 *
 * ```
 * 2.4.0-beta.1
 * ```
 *
 * ### Accepted
 *
 * ```
 * Fix validation
 * ```
 *
 * ```
 * #42
 * ```
 *
 * ## Related rules
 *
 * - [noBlankSubjectLines](./NoBlankSubjectLines.md)
 */
export function* noSingleWordSubjectLines(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "noSingleWordSubjectLines"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	for (const commit of commits) {
		if (commit.subjectLine.some(isToken("revert"))) {
			continue
		}

		const wordLikeTokens = commit.subjectLine.filter(isToken("code", "hyperlink", "semver", "word"))
		const soloWord = wordLikeTokens.length === 1 ? wordLikeTokens[0] : null

		if (soloWord) {
			yield subjectLineConcern(rule, commit.sha, { range: soloWord.range })
		}
	}
}
