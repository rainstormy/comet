import type { Commits } from "#commits/Commit.ts"
import { isToken, tokenRangeEnd } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { bodyLineConcern } from "#rules/concerns/BodyLineConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"

/**
 * Rejects message bodies with consecutive blank lines.
 *
 * ## Rationale
 *
 * Consistent spacing is predictable and makes the commit history easier to read.
 *
 * ## How to fix
 *
 * Delete the offending blank lines in the message body.
 *
 * ### Command-line interface (CLI)
 *
 * 1. Rebase interactively from (the parent of) the commit SHA, for instance:
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
 * 3. In the commit message editor, delete the offending blank lines (empty or whitespace-only) in the message body.
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
 *    Delete the offending blank lines (empty or whitespace-only) in the message body.
 *
 * 2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.
 *
 * ## Remarks
 *
 * It disregards blank lines in fenced code blocks.
 *
 * ## Options
 *
 * This rule has no configurable options.
 *
 * ```json
 * {
 *   "rules": {
 *     "noExcessiveBlankLines": {
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
 * Teach the changelog to whisper
 *
 * The noisy bits moved to the release notes.
 *
 *
 * The quiet bits stayed where they were.
 * ```
 *
 * ### Accepted
 *
 * ```
 * Teach the changelog to whisper
 *
 * The noisy bits moved to the release notes.
 *
 * The quiet bits stayed where they were.
 * ```
 *
 * ````
 * Install the doorbell
 *
 * Run the following command:
 *
 * ```shell
 * pnpm add doorbell
 *
 *
 * pnpm exec doorbell --ring
 * ```
 * ````
 *
 * ## Related rules
 *
 * - [noExcessiveWhitespace](./NoExcessiveWhitespace.md)
 * - [useEmptyLineBeforeBody](./UseEmptyLineBeforeBody.md)
 */
export function* noExcessiveBlankLines(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "noExcessiveBlankLines"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	for (const commit of commits) {
		let consecutiveBlankLineCount = 0

		for (const [lineNumber, bodyLine] of commit.bodyLines.entries()) {
			const isBlankLine = bodyLine.every(isToken("whitespace"))
			consecutiveBlankLineCount = isBlankLine ? consecutiveBlankLineCount + 1 : 0

			if (consecutiveBlankLineCount === 2) {
				yield bodyLineConcern(rule, commit.sha, {
					lineNumber,
					range: [0, Math.max(1, tokenRangeEnd(bodyLine))],
				})
			}
		}
	}
}
