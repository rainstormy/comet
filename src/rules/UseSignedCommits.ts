import type { Commits } from "#commits/Commit.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { commitConcern } from "#rules/concerns/CommitConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"

/**
 * Rejects commits without a cryptographic signature.
 *
 * ## Rationale
 *
 * Signed commits make it harder to impersonate authors and help preserve
 * confidence in who created and delivered each change.
 *
 * ## Remarks
 *
 * - Valid SSH and PGP signatures are accepted.
 * - Only signature metadata is checked; the subject line and message body do not affect the result.
 *
 * ## Examples
 *
 * ### Rejected
 *
 * ```
 * Teach the coffee machine to stop judging mugs
 * ```
 *
 * ### Accepted
 *
 * ```
 * Give the release notes a sensible haircut
 * put the changelog back where it belongs
 * ```
 */
export function* useSignedCommits(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "useSignedCommits"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	for (const commit of commits) {
		if (!commit.hasSignature) {
			yield commitConcern(rule, commit.sha)
		}
	}
}
