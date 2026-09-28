import type { Commits } from "#commits/Commit.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { commitConcern } from "#rules/concerns/CommitConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"

/**
 * Rejects commits without a cryptographic signature.
 *
 * TODO: ## Rationale
 *
 * Signed commits make it harder to impersonate authors and help preserve
 * confidence in who created and delivered each change.
 *
 * A verified signature gives users evidence that the recorded author or committer identity was not substituted in transit.
 * This helps teams trust release history and investigate changes with a stronger link to the person or system that delivered them.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * Configure a signing key before signing commits. Sign the current tip with:
 *
 * ```shell
 * git commit --amend --gpg-sign --no-edit
 * ```
 *
 * To sign an earlier commit, start an interactive rebase and mark it `edit`:
 *
 * ```shell
 * git rebase --interactive <commit-sha>~1
 * ```
 *
 * When the rebase pauses, sign the commit and continue:
 *
 * ```shell
 * git commit --amend --gpg-sign --no-edit
 * git rebase --continue
 * ```
 *
 * TODO: ## Remarks
 *
 * - Any non-empty signature counts, even invalid ones.
 *
 * ## Options
 *
 * This rule has no configurable options.
 *
 * ```json
 * {
 *   "rules": {
 *     "useSignedCommits": {
 *       "level": "error",
 *       "options": {}
 *     }
 *   }
 * }
 * ```
 *
 * TODO: ## Examples
 *
 * The first line in each block shows signature metadata; the remaining lines are the commit message.
 *
 * ### Rejected
 *
 * ```
 * signature: none
 * Teach the coffee machine to stop judging mugs
 * ```
 *
 * ### Accepted
 *
 * ```
 * signature: SSH
 * Give the release notes a sensible haircut
 * ```
 *
 * ```
 * signature: PGP
 * Put the changelog back where it belongs
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
