import type { Commits } from "#commits/Commit.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { commitConcern } from "#rules/concerns/CommitConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"

/**
 * Verifies that commits have at most one parent.
 *
 * ## Rationale
 *
 * Keeping the commit history linear makes it easier to rebase interactively,
 * understand the order of changes, and revert a change later.
 *
 * ## Remarks
 *
 * - The number of parents determines the result; the subject line is irrelevant.
 * - Initial commits with no parents and ordinary commits with one parent are accepted.
 *
 * ## Examples
 *
 * `⇧` denotes the number of parent commits.
 *
 * ### Rejected
 *
 * ```
 * ⇧ 2  Merge branch 'main' into bugfix/dance-party-playlist
 * ⇧ 3  Keep my branch up to date
 * ```
 *
 * ### Accepted
 *
 * ```
 * ⇧ 1  Merge the two validation paths
 * ⇧ 0  Establish the repository
 * ⇧ 1  Release the robot butler
 * ```
 */
export function* noMergeCommits(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "noMergeCommits"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	for (const commit of commits) {
		if (commit.isMergeCommit) {
			yield commitConcern(rule, commit.sha)
		}
	}
}
