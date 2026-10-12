import type { Commits } from "#commits/Commit.ts"
import { type Token, isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"

/**
 * Rejects subject lines that start with a lowercase letter.
 *
 * ## Rationale
 *
 * Consistent capitalisation is predictable and makes the commit history easier to read.
 *
 * Git itself and GitHub use capitalised subject lines when they generate the following kinds of commits:
 *
 * - Merge commits, e.g. `Merge branch ...` and `Merge pull request #1 from ...`.
 * - Revert commits, e.g. `Revert "..."` and `Reapply "..."`.
 * - Code review suggestions, e.g. `Update src/...`.
 *
 * ## How to fix
 *
 * Capitalise the first proper word in the subject line.
 *
 * ### Command-line interface (CLI)
 *
 * 1. Rebase interactively from (the parent of) the commit SHA, for example:
 *
 *    ```shell
 *    git rebase --interactive '7e0ff1ce^'
 *    ```
 *
 * 2. Set the commit to `reword`, then save and close the editor to proceed:
 *
 *    ```
 *    reword 7e0ff1ce welcome to my convenience store
 *    ```
 *
 * 3. In the commit message editor, capitalise the first proper word in the subject line (i.e. the first line), preserving any issue links and squash markers (e.g. `fixup!`) as is.
 *    Then save and close the editor to complete the rebase.
 *
 * 4. Force-push the rewritten branch to the remote repository:
 *
 *    ```shell
 *    git push --force-with-lease
 *    ```
 *
 * ### JetBrains IDEs (IntelliJ IDEA, WebStorm, etc.)
 *
 * 1. In the Git tool window, right-click the commit and select **Edit Commit Message...**.
 *    Capitalise the first proper word in the subject line (i.e. the first line), preserving any issue links and squash markers (e.g. `fixup!`) as is.
 *
 * 2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.
 *
 * ## Remarks
 *
 * It disregards the following kinds of tokens before the first word:
 *
 * - Inline code phrases (enclosed in backticks).
 * - Issue links, e.g. `#7` and `NEOWISE-2020`.
 * - Squash markers, e.g. `fixup!` and `squash!`.
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
 * ## Examples
 *
 * ### Rejected
 *
 * ```
 * fix this confusing plate of spaghetti
 * ```
 *
 * ```
 * amend! solve the problem
 * ```
 *
 * ```
 * GH-12 organise the bookshelf
 * ```
 *
 * ```
 * revert "Fix a nasty bug"
 * ```
 *
 * ### Accepted
 *
 * ```
 * Formatting.
 * ```
 *
 * ```
 * Refactor the taxi module
 * ```
 *
 * ```
 * fixup! Release the robot butler
 * ```
 *
 * ```
 * 99 reasons to upgrade the framework
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
