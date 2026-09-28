import type { Commits } from "#commits/Commit.ts"
import { isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"
import { rangeBetween } from "#types/CharacterRange.ts"

/**
 * Rejects subject lines beginning with a squash marker like `amend!`, `fixup!`, and `squash!`.
 *
 * ## Rationale
 *
 * Temporary commits with squash markers make it easier to discover changes during a code review.
 *
 * TODO: Squashing temporary commits before delivery removes noisy intermediate diffs,
 * keeps each final change cohesive, and makes the history easier to revert.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * Before delivering the branch, combine each temporary commit with its target using `fixup` or `squash`. Keep a descriptive final subject without a squash marker:
 *
 * ```shell
 * git rebase --interactive <commit-sha>~1
 * ```
 *
 * TODO: ### IntelliJ IDEA
 *
 * In the Git tool window, right-click the base commit and select `Interactively Rebase from Here...`. Set each temporary commit to `Fixup` or `Squash` in the rebase dialog, and keep a descriptive final subject without a marker.
 *
 * ## Options
 *
 * This rule has no configurable options.
 *
 * ```json
 * {
 *   "rules": {
 *     "noSquashMarkers": {
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
 * fixup! Reheat the leftovers
 * ```
 *
 * ```
 * fixup! fixup! Enforce the linting rules
 * ```
 *
 * ### Accepted
 *
 * ```
 * Refactor the taxi module
 * ```
 *
 * ```
 * Make the commit scream fixup! again
 * ```
 *
 * ```
 * squash the commits
 * ```
 */
export function* noSquashMarkers(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "noSquashMarkers"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	for (const commit of commits) {
		const firstSquashToken = commit.subjectLine.find(isToken("squash"))

		if (firstSquashToken) {
			const lastSquashToken = commit.subjectLine.findLast(isToken("squash")) ?? firstSquashToken

			yield subjectLineConcern(rule, commit.sha, {
				range: rangeBetween(firstSquashToken.range, lastSquashToken.range),
			})
		}
	}
}
