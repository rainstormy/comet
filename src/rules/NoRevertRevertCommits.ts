import type { Commits } from "#commits/Commit.ts"
import { isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"
import { rangeBetween } from "#types/CharacterRange.ts"

/**
 * TODO: Rejects subject lines containing more than one revert marker.
 *
 * TODO: ## Rationale
 *
 * Reverting a revert can obscure which change is active and where it came from.
 * Cherry-picking the original commit keeps the original message and authorship visible.
 *
 * Nested reverts make it harder for users to tell whether a change is active and which commit originally introduced it.
 * This rule encourages a direct reapplication that keeps the history and authorship easier to follow.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * To reapply a change that was reverted, cherry-pick the original commit instead of reverting its revert. Resolve any conflicts and use a subject that describes the restored change:
 *
 * ```shell
 * git cherry-pick <original-commit-sha>
 * ```
 *
 * TODO: ### IntelliJ IDEA
 *
 * In the Git tool window, right-click the original commit and select `Cherry-Pick`. Resolve any conflicts and keep the subject that describes the restored change.
 *
 * TODO: ## Remarks
 *
 * - Matching is case-insensitive.
 * - Only tokenised revert markers count; ordinary words such as `revert` and `Reverted` do not.
 * - One revert marker is allowed, including one preceded by a squash marker.
 *
 * ## Options
 *
 * This rule has no configurable options.
 *
 * ```json
 * {
 *   "rules": {
 *     "noRevertRevertCommits": {
 *       "level": "error",
 *       "options": {}
 *     }
 *   }
 * }
 * ```
 *
 * TODO: ## Examples
 *
 * ### Rejected
 *
 * ```
 * Revert "Revert "Fix the nasty bug""
 * ```
 *
 * ```
 * Revert "Revert "Revert "Repair the soft ice machine"""
 * ```
 *
 * ### Accepted
 *
 * ```
 * Revert "Repair the soft ice machine"
 * ```
 *
 * ```
 * fixup! Revert "Repair the soft ice machine"
 * ```
 *
 * ```
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
