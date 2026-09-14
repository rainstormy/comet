import type { Commits } from "#commits/Commit.ts"
import { isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { bodyLineConcern } from "#rules/concerns/BodyLineConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { isNotEmptyString } from "#utilities/Arrays.ts"

/**
 * Rejects commits whose message body contains a trailer with a restricted key.
 *
 * Restricting trailers such as `Co-authored-by` keeps the commit history attributable
 * and prevents metadata from being added through workflows that cannot sign commits.
 *
 * ## Remarks
 *
 * - Trailer-key matching is case-insensitive.
 * - Configured keys are trimmed, and an optional trailing colon is ignored.
 * - Only trailer keys are checked; the same text in ordinary body prose is allowed.
 * - An empty `restrictedKeys` array allows every trailer.
 *
 * ## Options
 *
 * `restrictedKeys` is an array of trailer keys. It defaults to an empty array,
 * so no trailers are restricted until the option is configured.
 *
 * ```json
 * {
 *   "rules": {
 *     "noRestrictedTrailers": {
 *       "level": "error",
 *       "options": { "restrictedKeys": ["Co-authored-by", "Signed-off-by"] }
 *     }
 *   }
 * }
 * ```
 *
 * ## Examples
 *
 * With `restrictedKeys: ["Co-authored-by"]`:
 *
 * ### Rejected
 *
 * ```
 * Teach the robot butler who gets credit
 *
 * Co-Authored-By: Everloving Easter Bunny <everloving.easter.bunny@example.com>
 * ```
 *
 * ### Accepted
 *
 * ```
 * Teach the robot butler who gets credit
 *
 * Reviewed-by: April O'Neil <april.oneil@fastforward.com>
 * ```
 */
export function* noRestrictedTrailers(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "noRestrictedTrailers"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	const restrictedKeys = new Set(
		configuration.options.restrictedKeys.map(normaliseTrailerKey).filter(isNotEmptyString),
	)

	if (restrictedKeys.size === 0) {
		return
	}

	for (const commit of commits) {
		for (const [lineNumber, bodyLine] of commit.bodyLines.entries()) {
			const key = bodyLine.find(isToken("trailerkey")) ?? null

			if (key !== null && restrictedKeys.has(key.value.toLowerCase())) {
				yield bodyLineConcern(rule, commit.sha, { line: lineNumber, range: key.range })
			}
		}
	}
}

export function normaliseTrailerKey(key: string): string {
	const trimmedKey = key.trim().toLowerCase()
	return trimmedKey.endsWith(":") ? trimmedKey.slice(0, -":".length).trimEnd() : trimmedKey
}
