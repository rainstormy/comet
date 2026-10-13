import type { Commits } from "#commits/Commit.ts"
import { isNotToken, isToken, tokenOverflowRange } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectConcern } from "#rules/concerns/SubjectConcern.ts"

/**
 * Rejects subjects longer than the configured character limit.
 *
 * ## Rationale
 *
 * The subject is the first line of the commit message.
 * It is what readers see most often when scanning the commit history.
 *
 * A short subject is easier to read and less likely to be truncated in Git clients.
 *
 * Detailed explanations [belong in the message body](https://git-scm.com/docs/git-commit#_discussion).
 *
 * ## How to fix
 *
 * Change the subject to fit within the character limit and move additional context to the message body.
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
 *    reword 7e0ff1ce Welcome to my convenience store with snacks for every occasion
 *    ```
 *
 * 3. In the commit message editor, shorten the subject (i.e. the first line) to fit within the character limit and move additional context to the message body.
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
 *    Change the subject (i.e. the first line) to fit within the character limit and move additional context to the message body.
 *
 * 2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.
 *
 * ## Remarks
 *
 * The following kinds of commits are always accepted:
 *
 * - Merge commits, i.e. commits with more than one parent.
 * - Revert commits, e.g. `Revert "..."`.
 * - Commits with dependency versions in the subject, e.g. `Bump Vite to 2.4.0-beta.1` and `Pin the Node.js image to 4af617c`.
 * - Commits with squash markers, e.g. `fixup!` and `squash!`.
 *
 * The following kinds of tokens do _not_ count towards the character limit:
 *
 * - Hyperlinks.
 * - Inline code phrases (enclosed in backticks).
 * - Issue links, e.g. `#7` and `NEOWISE-2020`.
 *
 * ## Options
 *
 * - `maxLength` (positive integer): Maximum number of characters allowed per subject. Default value: `50`.
 *
 * ```json
 * {
 *   "rules": {
 *     "useConciseSubjects": {
 *       "level": "error",
 *       "options": {
 *         "maxLength": 50
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * ## Examples
 *
 * Rule configuration:
 *
 * ```json
 * "maxLength": 50
 * ```
 *
 * ### Rejected
 *
 * ```
 * Compare the list of items to the objects downloaded from the server
 * ```
 *
 * ```
 * Shelve the broken cursor until the warm summer weather makes it shine again
 * ```
 *
 * ```
 * Upgrade dependency @opentelemetry/exporter-metrics-otlp-http to the newest version
 * ```
 *
 * ### Accepted
 *
 * ```
 * Add retry metrics
 * ```
 *
 * ```
 * Upgrade `rainstormy/github-action-validate-commit-messages in GitHub Actions` to the newest version
 * ```
 *
 * ```
 * Fix the login retry loop #42
 * ```
 *
 * ```
 * Downgrade dependency @opentelemetry/exporter-metrics-otlp-http to 0.100.5-beta.3
 * ```
 *
 * ## Related rules
 *
 * - [useLineWrapping](./UseLineWrapping.md)
 */
export function* useConciseSubjects(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "useConciseSubjects"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	const maxLength = configuration.options.maxLength

	for (const commit of commits) {
		if (commit.isMergeCommit || commit.subject.some(isToken("revert", "semver", "squash"))) {
			continue
		}
		const overflowRange = tokenOverflowRange(
			commit.subject.filter(isNotToken("code", "hyperlink", "issuelink")),
			maxLength,
		)

		if (overflowRange !== null) {
			yield subjectConcern(rule, commit.sha, { range: overflowRange })
		}
	}
}
