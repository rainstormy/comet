import type { Commits } from "#commits/Commit.ts"
import { isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"
import { rangeBetween } from "#types/CharacterRange.ts"

/**
 * Verifies that subject lines contain at most one revert marker.
 *
 * ## Rationale
 *
 * Reverting a revert can obscure which change is active and where it came from.
 * Cherry-picking the original commit keeps the original message and authorship visible.
 *
 * ## Remarks
 *
 * - Matching is case-insensitive.
 * - Only tokenised revert markers count; ordinary words such as `revert` and `Reverted` do not.
 * - One revert marker is allowed, including one preceded by a squash marker.
 *
 * ## Examples
 *
 * ### Rejected
 *
 * ```
 * Revert "Revert "Fix the nasty bug""
 * Revert "Revert "Revert "Repair the soft ice machine"""
 * ```
 *
 * ### Accepted
 *
 * ```
 * Revert "Repair the soft ice machine"
 * Time to revert it
 * ```
 */
export function* noRevertRevertCommits(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "noRevertRevertCommits"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	for (const commit of commits) {
		const firstRevertToken = commit.subjectLine.find(isToken("revert"))
		const lastRevertToken = commit.subjectLine.findLast(isToken("revert"))

		if (firstRevertToken && lastRevertToken && firstRevertToken !== lastRevertToken) {
			yield subjectLineConcern(rule, commit.sha, {
				range: rangeBetween(firstRevertToken.range, lastRevertToken.range),
			})
		}
	}
}
