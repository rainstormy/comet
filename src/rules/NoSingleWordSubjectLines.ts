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
 * A descriptive subject line makes the commit distinguishable from other commits.
 * This keeps the commit history readable and makes the commit easier to find.
 *
 * ## How to fix
 *
 * Change the subject line to contain at least two words.
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
 *    reword 7e0ff1ce Welcome
 *    ```
 *
 * 3. In the commit message editor, change the subject line (i.e. the first line) to contain at least two words.
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
 *    Change the subject line (i.e. the first line) to contain at least two words.
 *
 * 2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.
 *
 * ## Remarks
 *
 * Revert commits, e.g. `Revert "..."`, are always accepted.
 *
 * The following kinds of tokens do _not_ count as words:
 *
 * - Issue links, e.g. `#7` and `NEOWISE-2020`.
 * - Squash markers, e.g. `fixup!` and `squash!`.
 *
 * Inline code phrases (enclosed in backticks) always count as one word.
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
 * ## Examples
 *
 * ### Rejected
 *
 * ```
 * bugfix
 * ```
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
 * `Unscheduled maintenance`
 * ```
 *
 * ### Accepted
 *
 * ```
 * Fix validation
 * ```
 *
 * ```
 * init project
 * ```
 *
 * ```
 * Refactored `HotChocolateMachine`
 * ```
 *
 * ```
 * Revert "Release"
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
