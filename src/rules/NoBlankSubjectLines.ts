import type { Commits } from "#commits/Commit.ts"
import { isToken, tokenRangeEnd } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"
import { nonEmptyRangeOf } from "#types/CharacterRange.ts"

/**
 * Rejects subject lines without any alphanumeric characters.
 *
 * ## Rationale
 *
 * A meaningful subject line makes the commit distinguishable from other commits.
 * This keeps the commit history readable and makes the commit easier to find.
 *
 * ## Remarks
 *
 * The following kinds of tokens do _not_ count as alphanumeric characters:
 *
 * - Issue links, e.g. `#7` and `NEOWISE-2020`.
 * - Revert markers, e.g. `Revert ""`.
 * - Squash markers, e.g. `fixup!` and `squash!`.
 *
 * ## Examples
 *
 * ### Rejected
 *
 * ```
 * ...
 * ```
 *
 * ```
 * ``
 * ```
 *
 * ```
 * fixup! -
 * ```
 *
 * ```
 * #4 Revert " "
 * ```
 *
 * ### Accepted
 *
 * ```
 * bugfix
 * ```
 *
 * ```
 * init project
 * ```
 *
 * ```
 * Refactor `HotChocolateMachine`
 * ```
 *
 * ```
 * 2.4.0-beta.1
 * ```
 */
export function* noBlankSubjectLines(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "noBlankSubjectLines"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	for (const commit of commits) {
		if (
			commit.subjectLine.some(isToken("hyperlink", "semver", "word")) ||
			commit.subjectLine.some((token) => token.type === "code" && token.value !== "``")
		) {
			continue
		}

		const firstBlankIndex =
			commit.subjectLine.findLastIndex(isToken("issuelink", "revert", "squash")) + 1

		const blankEnd = tokenRangeEnd(commit.subjectLine)
		const blankStart =
			firstBlankIndex !== -1 ? (commit.subjectLine[firstBlankIndex]?.range[0] ?? blankEnd) : 0

		yield subjectLineConcern(rule, commit.sha, { range: nonEmptyRangeOf(blankStart, blankEnd) })
	}
}
