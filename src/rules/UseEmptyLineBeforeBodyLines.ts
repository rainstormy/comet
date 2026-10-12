import type { Commits } from "#commits/Commit.ts"
import { isNotToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { bodyLineConcern } from "#rules/concerns/BodyLineConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"

/**
 * Rejects commits whose message body is not separated from the subject line by exactly one empty line.
 *
 * ## Rationale
 *
 * Git treats the text before the first empty line [as part of the subject](https://git-scm.com/docs/git-commit#_discussion).
 *
 * Separating the first line and the message body with an empty line helps Git clients display the commit message correctly.
 * Consistent spacing is predictable and makes the commit history easier to read.
 *
 * ## How to fix
 *
 * Insert and leave exactly one empty line between the subject line and the remaining message body.
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
 *    reword 7e0ff1ce Welcome to my convenience store
 *    ```
 *
 * 3. In the commit message editor, insert and leave exactly one empty line between the subject line (i.e. the first line) and the remaining message body.
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
 *    Insert and leave exactly one empty line between the subject line (i.e. the first line) and the remaining message body.
 *
 * 2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.
 *
 * ## Remarks
 *
 * Commits without a message body are always accepted.
 *
 * ## Options
 *
 * This rule has no configurable options.
 *
 * ```json
 * {
 *   "rules": {
 *     "useEmptyLineBeforeBodyLines": {
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
 * Refactor the taxi module
 * The roof sign now flashes politely.
 * ```
 *
 * ```
 * Replace guesswork with a chart
 *
 *
 * The chart uses three excellent dots.
 * ```
 *
 * ### Accepted
 *
 * ```
 * Teach the changelog to whisper
 *
 * The noisy bits moved to the release notes.
 *
 * Footer: charming
 * ```
 *
 * ```
 * Consolidate `BadgeFactory` with `BadgeService` and count to ten
 * ```
 */
export function* useEmptyLineBeforeBodyLines(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "useEmptyLineBeforeBodyLines"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	for (const commit of commits) {
		for (const [lineNumber, bodyLine] of commit.bodyLines.entries()) {
			if (bodyLine.some(isNotToken("whitespace"))) {
				if (lineNumber === 0) {
					yield bodyLineConcern(rule, commit.sha, { line: 0, range: [0, 1] })
				}
				if (lineNumber > 1) {
					yield bodyLineConcern(rule, commit.sha, { line: lineNumber - 1, range: [0, 1] })
				}
				break
			}
		}
	}
}
