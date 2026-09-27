import type { Commits } from "#commits/Commit.ts"
import { type Token, isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"

/**
 * TODO: Rejects subject lines whose first relevant token starts with a lowercase letter.
 *
 * TODO: ## Rationale
 *
 * A consistent capitalisation style gives each subject line a clear visual beginning
 * and makes the commit history easier to scan.
 *
 * It helps users recognise each subject without forcing punctuation, links, or version numbers into a particular case.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * Capitalise the first relevant token in the subject, for example, change `fix the bug` to `Fix the bug`. To edit an existing commit, start an interactive rebase and mark it `reword`:
 *
 * ```shell
 * git rebase --interactive <commit-sha>
 * ```
 *
 * TODO: ### IntelliJ IDEA
 *
 * In the Git tool window, right-click the commit and select `Edit Commit Message...`. Capitalise the first relevant token in its subject.
 *
 * TODO: ## Remarks
 *
 * - Issue links, inline code phrases (enclosed in `backticks`), semantic-version tokens, and squash markers are skipped when locating the first token to check.
 * - A first token that does not start with a letter, including a hyperlink, is accepted; only that token is checked.
 *
 * ## Options
 *
 * This rule has no configurable options.
 *
 * ```json
 * {
 *   "rules": {
 *     "useCapitalisedSubjectLines": {
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
 * fix this confusing plate of spaghetti
 * ```
 *
 * ```
 * amend! solve the problem!
 * ```
 *
 * ### Accepted
 *
 * ```
 * Refactor the taxi module
 * ```
 *
 * ```
 * https://github.com/rainstormy/comet/pull/42 release the robot butler
 * ```
 *
 * ```
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
