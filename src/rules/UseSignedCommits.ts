import type { Commits } from "#commits/Commit.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { commitConcern } from "#rules/concerns/CommitConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"

/**
 * Rejects commits without a valid cryptographic signature.
 *
 * Signed commits make it harder to impersonate authors and help preserve
 * confidence in who created and delivered each change.
 *
 * ## Remarks
 *
 * - Valid SSH and PGP signatures are accepted.
 * - The signature metadata determines the result; the subject line and message body do not.
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
