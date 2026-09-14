import type { Commits } from "#commits/Commit.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { commitConcern } from "#rules/concerns/CommitConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"

/**
 * Rejects commits with more than one parent commit, encouraging rebasing instead of merging to keep a branch up to date with the main branch.
 *
 * ## Rationale
 *
 * A linear commit history is easier to read, easier to rebase, and easier to revert.
 *
 * ## Remarks
 *
 * - Only the number of parent commits matters; it disregards the subject line.
 * - It disregards merge commits created by GitHub when merging pull requests.
 *
 * ## Examples
 *
 * `⇧` denotes the number of parent commits.
 *
 * ### Rejected
 *
 * 1. ```
 *    ⇧ 2
 *    Merge branch 'main' into bugfix/dance-party-playlist`
 *    ```
 * 2. ```
 *    ⇧ 3
 *    Cthulhu visited my branch today
 *    ```
 *
 * ### Accepted
 *
 * 1. ```
 *    ⇧ 0
 *    initial commit
 *    ```
 * 2. ```
 *    ⇧ 1
 *    Merge `SoftIceService` and `IceCreamFactory`
 *    ```
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
