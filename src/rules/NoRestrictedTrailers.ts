import type { Commits } from "#commits/Commit.ts"
import { isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { bodyLineConcern } from "#rules/concerns/BodyLineConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { isNotEmptyString } from "#utilities/Arrays.ts"

/**
 * TODO: Rejects commit messages whose bodies contain trailers with restricted keys.
 *
 * TODO: ## Rationale
 *
 * Restricting trailers such as `Co-authored-by` keeps the commit history attributable
 * and prevents workflows that cannot sign commits from adding metadata.
 *
 * Trailer metadata can change who appears to have contributed to a commit and how automated tooling interprets it.
 * Configuring restricted keys lets users enforce the metadata policy that fits their workflow while allowing unrelated body prose.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * Remove the restricted trailer or replace it with an allowed key. To edit an existing message, start an interactive rebase and mark the commit `reword`:
 *
 * ```shell
 * git rebase --interactive <commit-sha>~1
 * ```
 *
 * TODO: ### IntelliJ IDEA
 *
 * In the Git tool window, right-click the commit and select `Edit Commit Message...`. Remove the restricted trailer or replace it with an allowed key.
 *
 * TODO: ## Remarks
 *
 * - Matching ignores letter case. Configured keys are trimmed, and a trailing colon is optional.
 * - Only lines parsed as trailers are checked, so the same text in ordinary body prose is allowed.
 * - An empty `restrictedKeys` array leaves every trailer allowed.
 *
 * ## Options
 *
 * - `restrictedKeys` (array of strings): Trailer keys to disallow. If empty, every trailer is allowed. Default value: `[]`.
 *
 * ```json
 * {
 *   "rules": {
 *     "noRestrictedTrailers": {
 *       "level": "error",
 *       "options": {
 *         "restrictedKeys": []
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * TODO: ## Examples
 *
 * With `restrictedKeys: ["Co-authored-by", "Signed-off-by"]`:
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
 *
 * ```
 * Document the credit policy
 *
 * The phrase Co-authored-by: appears here as ordinary prose.
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
