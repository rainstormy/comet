import type { Commits } from "#commits/Commit.ts"
import { isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { bodyLineConcern } from "#rules/concerns/BodyLineConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { isNotEmptyString } from "#utilities/Arrays.ts"

/**
 * Rejects configured [trailers](https://git-scm.com/docs/git-interpret-trailers) in the message body.
 *
 * ## Rationale
 *
 * Restricting certain kinds of trailers keeps commit metadata consistent with the project's contribution policy.
 *
 * For example, a project can disallow `Co-authored-by` trailers to prevent GitHub from committing code review suggestions in pull requests and to encourage contributors to take full credit of work done by AI agents.
 *
 * ## How to fix
 *
 * Delete the offending trailer lines in the message body.
 *
 * ### Command-line interface (CLI)
 *
 * 1. Rebase interactively from (the parent of) the commit SHA, for instance:
 *
 *    ```shell
 *    git rebase --interactive '7e0ff1ce^'
 *    ```
 *
 * 2. Set the commit to `reword`, then save and close the editor to proceed:
 *
 *    ```
 *    reword 7e0ff1ce Welcome to my convenience store
 *    ```
 *
 * 3. In the commit message editor, delete the offending trailer lines in the message body.
 *    Then save and close the editor to complete the rebase.
 *
 * 4. Force-push the rewritten branch to the remote repository:
 *
 *    ```shell
 *    git push --force-with-lease
 *    ```
 *
 * ### JetBrains IDEs (IntelliJ IDEA, WebStorm, etc.)
 *
 * 1. In the Git tool window, right-click the commit and select **Edit Commit Message...**.
 *    Delete the offending trailer lines in the message body.
 *
 * 2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.
 *
 * ## Options
 *
 * - `restrictedKeys` (array of case-insensitive strings): Trailer keys to disallow. If empty, every trailer is allowed. Default value: `[]`.
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
 * ## Examples
 *
 * Rule configuration:
 *
 * ```json
 * "restrictedKeys": ["Co-authored-by", "Signed-off-by"]
 * ```
 *
 * ### Rejected
 *
 * ```
 * Update src/main.ts
 *
 * Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
 * ```
 *
 * ```
 * Pack the deploy snacks
 *
 * All shelves are stocked.
 *
 * signed-off-by: April O'Neil <april.oneil@fastforward.com>
 * signed-off-by: Casey Jones <casey.jones@fastforward.com>
 * SIGNED-OFF-BY: Hamato Yoshi <hamato@nycsewers.com>
 * Relates-to: snack table
 * ```
 *
 * ### Accepted
 *
 * ```
 * Credit the careful reviewers
 *
 * Reviewed-by: April O'Neil <april.oneil@fastforward.com>
 * ```
 *
 * ```
 * Explain the suspicious label
 *
 * This occurrence of Signed-off-by: looked official for a moment, but it is just ordinary prose.
 * ```
 *
 * ```
 * Do some pair programming
 *
 * Co-authored-by: Gon Freecss <rock.paper.scissors@hunters.com>
 *
 * All participants had fun.
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
				yield bodyLineConcern(rule, commit.sha, { lineNumber, range: key.range })
			}
		}
	}
}

export function normaliseTrailerKey(key: string): string {
	const trimmedKey = key.trim().toLowerCase()
	return trimmedKey.endsWith(":") ? trimmedKey.slice(0, -":".length).trimEnd() : trimmedKey
}
