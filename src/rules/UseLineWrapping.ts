import type { Commits } from "#commits/Commit.ts"
import { isNotToken, isToken, tokenOverflowRange } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { bodyLineConcern } from "#rules/concerns/BodyLineConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"

/**
 * Rejects body lines whose counted characters exceed a configured maximum (default: 72 characters).
 *
 * Keeping body lines short makes the commit history easier to read in Git clients
 * and avoids forcing readers to scroll sideways through a paragraph.
 *
 * ## Remarks
 *
 * - Merge commits are ignored.
 * - Lines in fenced code blocks and trailer lines are preserved without checking their length.
 * - Hyperlinks, issue links, and inline code phrases do not count towards the limit.
 * - Only body lines are checked; the subject line is unaffected.
 *
 * ## Options
 *
 * `maxLength` is a positive integer. Its default is `72`.
 *
 * ```json
 * {
 *   "rules": {
 *     "useLineWrapping": {
 *       "level": "error",
 *       "options": { "maxLength": 72 }
 *     }
 *   }
 * }
 * ```
 *
 * ## Examples
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
 * Lines in fenced code blocks are preserved verbatim:
 *
 * ````text
 * ```text
 * This fenced example can be much longer without raising a concern.
 * ```
 * ````
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
