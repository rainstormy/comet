import type { Commits } from "#commits/Commit.ts"
import { type Token, isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"

/**
 * Rejects subject lines whose first relevant word starts with a lowercase letter.
 *
 * A consistent capitalisation style makes the commit history easier to scan
 * and gives each subject line a clear visual beginning.
 *
 * ## Remarks
 *
 * - Subjects that do not start with a letter and subjects that start with a hyperlink are accepted.
 * - Issue links, inline code phrases, and squash markers are skipped when locating the first relevant word.
 * - The rule checks the first relevant word only; later lowercase words are allowed.
 *
 * ## Examples
 *
 * ### Rejected
 *
 * ```
 * fix this confusing plate of spaghetti
 * amend! solve the problem!
 * GH-12 organise the bookshelf.
 * ```
 *
 * ### Accepted
 *
 * ```
 * Refactor the taxi module
 * fixup! Resolve a bug that thought it was a feature
 * https://github.com/rainstormy/comet/pull/42 release the robot butler
 * 2.4.0-beta.1
 * ```
 */
export function* useCapitalisedSubjectLines(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "useCapitalisedSubjectLines"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	for (const commit of commits) {
		const firstToken = commit.subjectLine.find(
			isToken("hyperlink", "punctuation", "revert", "word"),
		)

		if (firstToken && firstToken.type !== "hyperlink" && startsWithLowercaseLetter(firstToken)) {
			const rangeStart = firstToken.range[0]
			yield subjectLineConcern(rule, commit.sha, { range: [rangeStart, rangeStart + 1] })
		}
	}
}

function startsWithLowercaseLetter(token: Token): boolean {
	const firstCharacter = token.value.trimStart()[0] ?? ""
	return firstCharacter !== firstCharacter.toUpperCase()
}
