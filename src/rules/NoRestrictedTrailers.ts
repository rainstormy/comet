import type { Commits } from "#commits/Commit.ts"
import { isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { bodyLineConcern } from "#rules/concerns/BodyLineConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { isNotEmptyString } from "#utilities/Arrays.ts"

/**
 * Verifies that commit message bodies do not contain trailers with restricted keys.
 *
 * ## Rationale
 *
 * Restricting trailers such as `Co-authored-by` keeps the commit history attributable
 * and prevents workflows that cannot sign commits from adding metadata.
 *
 * ## Remarks
 *
 * - Matching ignores letter case. Configured keys are trimmed, and a trailing colon is optional.
 * - Only lines parsed as trailers are checked, so the same text in ordinary body prose is allowed.
 * - An empty `restrictedKeys` array leaves every trailer allowed.
 *
 * ## Options
 *
 * `restrictedKeys` is an array of trailer keys. It defaults to an empty array,
 * so no trailers are restricted until you configure it.
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
