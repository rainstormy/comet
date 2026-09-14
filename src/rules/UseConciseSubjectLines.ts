import type { Commits } from "#commits/Commit.ts"
import { isNotToken, isToken, tokenOverflowRange } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"

/**
 * Rejects subject lines whose counted characters exceed a configured maximum (default: 50 characters).
 *
 * Keeping subject lines short makes the commit history easier to scan in Git clients
 * and leaves room for issue links or other useful context.
 *
 * ## Remarks
 *
 * - Merge commits, revert commits, squash commits, and subjects containing semver tokens are ignored.
 * - Hyperlinks, issue links, and inline code phrases do not count towards the limit.
 * - Only the subject line is checked; the message body is unaffected.
 *
 * ## Options
 *
 * `maxLength` is a positive integer. Its default is `50`.
 *
 * ```json
 * {
 *   "rules": {
 *     "useConciseSubjectLines": {
 *       "level": "error",
 *       "options": { "maxLength": 50 }
 *     }
 *   }
 * }
 * ```
 *
 * ## Examples
 *
 * With `maxLength: 50`:
 *
 * ### Rejected
 *
 * ```
 * Compare the list of items to the objects downloaded from the server
 * Make a genuine attempt to fix the bugs that the users were complaining about
 * ```
 *
 * ### Accepted
 *
 * ```
 * Add retry metrics
 * Explain `RapidTransportService` retries to operators
 * Fix the login retry loop #42
 * ```
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
