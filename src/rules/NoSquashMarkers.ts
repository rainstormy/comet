import type { Commits } from "#commits/Commit.ts"
import { isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"
import { rangeBetween } from "#types/CharacterRange.ts"

/**
 * Verifies that subject lines do not contain squash markers.
 *
 * ## Rationale
 *
 * Squashing temporary commits before delivery removes noisy intermediate diffs,
 * keeps each final change cohesive, and makes the history easier to revert.
 *
 * ## Remarks
 *
 * - Markers such as `fixup!`, `squash!`, and `amend!` are recognised case-insensitively,
 *   including when they are combined or repeated.
 * - A marker must include an exclamation mark; plain words such as `fixup`, `squash`,
 *   and `amend` are allowed.
 *
 * ## Examples
 *
 * ### Rejected
 *
 * ```
 * fixup! Reheat the leftovers
 * squash! Make the program act like a clown
 * amend! Apply strawberry jam to make the code sweeter
 * ```
 *
 * ### Accepted
 *
 * ```
 * Refactor the taxi module
 * Make the commit scream fixup! again
 * Revert "Release the robot butler"
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
