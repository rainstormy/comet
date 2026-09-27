import type { Commits } from "#commits/Commit.ts"
import { isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { commitConcern } from "#rules/concerns/CommitConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"

/**
 * Rejects branches with more than a configured number of undelivered commits, encouraging short-lived branches.
 *
 * ## Rationale
 *
 * Keeping pull requests small makes them easier to review and safer to revert if needed.
 * Rebasing a branch or squashing commits on a branch with few commits is less likely to cause merge conflicts.
 *
 * This rule can also help catch accidental rebases onto stale commits. Such an operation is likely to add copies of old base commits to the current branch.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * Use an interactive rebase to combine related commits with `squash` or `fixup` until the branch is within `maxCommits`. Keep independent work on separate branches or pull requests:
 *
 * ```shell
 * git rebase --interactive <commit-sha>
 * ```
 *
 * TODO: ### IntelliJ IDEA
 *
 * In the Git tool window, right-click the base commit and select `Interactively Rebase from Here...`. Set related commits to `Squash` or `Fixup` in the rebase dialog. Keep independent work on separate branches or pull requests.
 *
 * ## Remarks
 *
 * The following kinds of commits do _not_ count towards the limit:
 *
 * - Merge commits, i.e. commits with more than one parent.
 * - Commits with squash markers such as `fixup!` and `squash!`.
 *
 * ## Options
 *
 * - `maxCommits` (positive integer): Maximum number of commits allowed per branch. Default value: `10`.
 *
 * ```json
 * {
 *   "rules": {
 *     "noExcessiveCommitsPerBranch": {
 *       "level": "error",
 *       "options": {
 *         "maxCommits": 10
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * ## Examples
 *
 * With `maxCommits: 3`:
 *
 * ### Rejected
 *
 * 1. ```
 *    Create new bakery dashboard
 *    ```
 * 2. ```
 *    Add Cinnamon telemetry
 *    ```
 * 3. ```
 *    Fix the suspicious croissant counter
 *    ```
 * 4. ```
 *    Test emergency toaster
 *    ```
 *
 * ### Accepted
 *
 * 1. ```
 *    Replace guesswork with a tiny chart
 *    ```
 * 2. ```
 *    Teach the kettle to apologise
 *    ```
 * 3. ```
 *    Add a label to the mystery switch
 *    ```
 */
export function* noExcessiveCommitsPerBranch(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "noExcessiveCommitsPerBranch"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	const maxCommits = configuration.options.maxCommits

	let commitCount = 0

	for (const commit of commits) {
		if (commit.isMergeCommit || commit.subjectLine.some(isToken("squash"))) {
			continue
		}

		commitCount += 1

		if (commitCount > maxCommits) {
			yield commitConcern(rule, commit.sha)
		}
	}
}
