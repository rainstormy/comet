import type { Commits } from "#commits/Commit.ts"
import { isNotToken, isToken, tokenOverflowRange } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { bodyLineConcern } from "#rules/concerns/BodyLineConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"

/**
 * TODO: Rejects body lines that exceed a configured character limit.
 *
 * TODO: ## Rationale
 *
 * Keeping body lines short makes the commit history easier to read in Git clients
 * and avoids forcing readers to scroll sideways through a paragraph.
 *
 * Wrapped body text fits more comfortably in terminals, pull requests, and side-by-side diffs.
 * Users can read an explanation without horizontal scrolling while still keeping code and metadata intact.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * Wrap prose in the commit body so each checked line stays within the configured `maxLength`. To edit an existing message, start an interactive rebase and mark the commit `reword`:
 *
 * ```shell
 * git rebase --interactive <commit-sha>
 * ```
 *
 * TODO: ### IntelliJ IDEA
 *
 * In the Git tool window, right-click the commit and select `Edit Commit Message...`. Wrap body prose so each checked line stays within the configured limit.
 *
 * TODO: ## Remarks
 *
 * - Merge commits are ignored.
 * - Fenced code blocks and trailer lines are not checked.
 * - Hyperlinks, issue links, and inline code phrases (enclosed in `backticks`) do not count towards the limit.
 *
 * ## Options
 *
 * - `maxLength` (positive integer): Maximum number of characters allowed per body line. Default value: `72`.
 *
 * ```json
 * {
 *   "rules": {
 *     "useLineWrapping": {
 *       "level": "error",
 *       "options": {
 *         "maxLength": 72
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * TODO: ## Examples
 *
 * With `maxLength: 72`:
 *
 * ### Rejected
 *
 * ```
 * Prepare the launch checklist
 *
 * It was just a matter of time before it would cause customers to complain.
 * ```
 *
 * ### Accepted
 *
 * ```
 * Prepare the launch checklist
 *
 * The deploy bot left a short note about sandwiches.
 * ```
 *
 * ````
 * Preserve the generated example
 *
 * ```md
 * This fenced example can be much longer without raising a concern.
 * ```
 * ````
 *
 * ## Related rules
 *
 * - [useConciseSubjectLines](./UseConciseSubjectLines.md)
 */
export function* useLineWrapping(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "useLineWrapping"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	const maxLength = configuration.options.maxLength

	for (const commit of commits) {
		if (commit.isMergeCommit) {
			continue
		}

		for (const [lineNumber, bodyLine] of commit.bodyLines.entries()) {
			if (bodyLine.some(isToken("codeblock", "trailerkey"))) {
				continue
			}

			const overflowRange = tokenOverflowRange(
				bodyLine.filter(isNotToken("code", "hyperlink", "issuelink")),
				maxLength,
			)

			if (overflowRange !== null) {
				yield bodyLineConcern(rule, commit.sha, { line: lineNumber, range: overflowRange })
			}
		}
	}
}
