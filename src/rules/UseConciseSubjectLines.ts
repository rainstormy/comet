import type { Commits } from "#commits/Commit.ts"
import { isNotToken, isToken, tokenOverflowRange } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"

/**
 * TODO: Rejects subject lines that exceed a configured character limit.
 *
 * TODO: ## Rationale
 *
 * Keeping subject lines short makes the commit history easier to scan in Git clients
 * and leaves room for issue links or other useful context.
 *
 * Short subjects remain visible in log tables, pull request lists, and terminal output without being cut off.
 * Users can understand the change at a glance while retaining space for the issue link or other identifying context.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * Shorten the subject to fit the configured `maxLength` while keeping its key information. Move secondary details to the body. To edit an existing commit, start an interactive rebase and mark it `reword`:
 *
 * ```shell
 * git rebase --interactive <commit-sha>
 * ```
 *
 * TODO: ### IntelliJ IDEA
 *
 * In the Git tool window, right-click the commit and select `Edit Commit Message...`. Shorten its subject and move secondary details to the body.
 *
 * TODO: ## Remarks
 *
 * - Merge, revert, and squash commits, as well as subjects containing semver tokens, are ignored.
 * - Hyperlinks, issue links, and inline code phrases (enclosed in `backticks`) do not count towards the limit.
 *
 * ## Options
 *
 * - `maxLength` (positive integer): Maximum number of characters allowed per subject line. Default value: `50`.
 *
 * ```json
 * {
 *   "rules": {
 *     "useConciseSubjectLines": {
 *       "level": "error",
 *       "options": {
 *         "maxLength": 50
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * TODO: ## Examples
 *
 * With `maxLength: 50`:
 *
 * ### Rejected
 *
 * ```
 * Compare the list of items to the objects downloaded from the server
 * ```
 *
 * ```
 * Make a genuine attempt to fix the bugs that the users were complaining about
 * ```
 *
 * ### Accepted
 *
 * ```
 * Add retry metrics
 * ```
 *
 * ```
 * Explain `RapidTransportService` retries to operators
 * ```
 *
 * ```
 * Fix the login retry loop #42
 * ```
 *
 * ## Related rules
 *
 * - [useLineWrapping](./UseLineWrapping.md)
 */
export function* useConciseSubjectLines(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "useConciseSubjectLines"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	const maxLength = configuration.options.maxLength

	for (const commit of commits) {
		if (commit.isMergeCommit || commit.subjectLine.some(isToken("revert", "semver", "squash"))) {
			continue
		}
		const overflowRange = tokenOverflowRange(
			commit.subjectLine.filter(isNotToken("code", "hyperlink", "issuelink")),
			maxLength,
		)

		if (overflowRange !== null) {
			yield subjectLineConcern(rule, commit.sha, { range: overflowRange })
		}
	}
}
