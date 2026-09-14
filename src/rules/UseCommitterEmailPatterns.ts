import type { Commits } from "#commits/Commit.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { userIdentityConcern } from "#rules/concerns/UserIdentityConcern.ts"
import { regexUnion } from "#utilities/Regexes.ts"

/**
 * Rejects commits whose committer email does not match any configured regex pattern.
 *
 * Restricting committer email addresses to trusted patterns keeps the commit history attributable
 * and helps prevent private addresses from leaking into a public repository.
 *
 * ## Remarks
 *
 * - Patterns are matched against the complete email address and are case-sensitive.
 * - Leading and trailing whitespace is not removed before matching.
 * - An empty `patterns` array accepts every address.
 *
 * ## Options
 *
 * `patterns` is an array of regular-expression strings. It defaults to an empty
 * array, which accepts every address.
 *
 * ```json
 * {
 *   "rules": {
 *     "useCommitterEmailPatterns": {
 *       "level": "error",
 *       "options": {
 *         "patterns": ["\\d+\\+.+@users\\.noreply\\.github\\.com"]
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * ## Examples
 *
 * With the pattern above:
 *
 * ### Rejected
 *
 * ```
 * bunny@theeastercompany.com
 * claus@santasworkshop.com
 * ```
 *
 * ### Accepted
 *
 * ```
 * 12345678+santaclaus@users.noreply.github.com
 * ```
 */
export function* useCommitterEmailPatterns(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "useCommitterEmailPatterns"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	const patterns = configuration.options.patterns

	if (patterns.length === 0) {
		return
	}

	const regex = new RegExp(`^${regexUnion(patterns)}$`, "u")
	const field = { field: "committer:email" } as const

	for (const commit of commits) {
		if (!regex.test(commit.committerEmail)) {
			yield userIdentityConcern(rule, commit.sha, field)
		}
	}
}
