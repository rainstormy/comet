import type { Commits } from "#commits/Commit.ts"
import { isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"

/**
 * Verifies that subject lines do not contain exactly one significant word.
 *
 * ## Rationale
 *
 * A little context in the subject line makes the commit easier to identify,
 * search for, and understand later.
 *
 * ## Remarks
 *
 * - Blank subjects and subjects containing no significant words are accepted.
 * - Revert commits are skipped.
 * - Issue links and squash markers do not count as words; hyperlinks, inline code phrases
 *   (enclosed in `backticks`), and semver tokens count as one word each.
 *
 * ## Examples
 *
 * ### Rejected
 *
 * ```
 * WIP
 * Unsubscribe
 * fixup! Test
 * ```
 *
 * ### Accepted
 *
 * ```
 * Fix validation
 * Refactor `HotChocolateMachine`
 * Read https://docs.example.com
 * 2.4.0-beta.1
 * ```
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
