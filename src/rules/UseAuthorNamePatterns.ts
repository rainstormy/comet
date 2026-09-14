import type { Commits } from "#commits/Commit.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { userIdentityConcern } from "#rules/concerns/UserIdentityConcern.ts"
import { regexUnion } from "#utilities/Regexes.ts"

/**
 * Rejects commits whose author name does not match any configured regex pattern.
 *
 * Restricting author names to trusted patterns keeps the commit history attributable
 * and helps prevent private usernames from being exposed.
 *
 * ## Remarks
 *
 * - Patterns are matched against the complete name and are case-sensitive.
 * - Leading and trailing whitespace is not removed before matching.
 * - An empty `patterns` array accepts every name.
 *
 * ## Options
 *
 * `patterns` is an array of regular-expression strings. It defaults to an empty
 * array, which accepts every name.
 *
 * ```json
 * {
 *   "rules": {
 *     "useAuthorNamePatterns": {
 *       "level": "error",
 *       "options": { "patterns": ["\\p{Lu}.*\\s.+"] }
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
 * santa claus
 * Jeanne
 * ```
 *
 * ### Accepted
 *
 * ```
 * The Little Mermaid
 * Jeanne d'Arc
 * ```
 */
export function* useAuthorNamePatterns(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "useAuthorNamePatterns"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	const patterns = configuration.options.patterns

	if (patterns.length === 0) {
		return
	}

	const regex = new RegExp(`^${regexUnion(patterns)}$`, "u")
	const field = { field: "author:name" } as const

	for (const commit of commits) {
		if (!regex.test(commit.authorName)) {
			yield userIdentityConcern(rule, commit.sha, field)
		}
	}
}
