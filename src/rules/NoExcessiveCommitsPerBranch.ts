import type { Commits } from "#commits/Commit.ts"
import { isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { commitConcern } from "#rules/concerns/CommitConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"

/**
 * Rejects branches with more than a configured number of undelivered commits, encouraging short-lived branches and [stacked pull requests](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-stacked-pull-requests).
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
 * Split the branch into a stack of smaller branches.
 *
 * ### Command-line interface (CLI)
 *
 * 1. Identify the commit that marks the end of the first branch.
 *    Create a new branch from this commit, for example:
 *
 *    ```shell
 *    git switch --create <new-branch-name> '7e0ff1ce'
 *    ```
 *
 * 2. Push the new branch to the remote repository:
 *
 *    ```shell
 *    git push --set-upstream origin <new-branch-name>
 *    ```
 *
 * ### JetBrains IDEs (IntelliJ IDEA, WebStorm, etc.)
 *
 * 1. Identify the commit that marks the end of the first branch.
 *    In the Git tool window, right-click the commit, select **New Branch...**, and enter the name of the new branch.
 *
 * 2. Select **Git** > **Push...** > **Push** to push the new branch to the remote repository.
 *
 * ## Remarks
 *
 * The following kinds of commits do _not_ count towards the limit:
 *
 * - Merge commits, i.e. commits with more than one parent.
 * - Commits with squash markers, e.g. `fixup!` and `squash!`.
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
 * Rule configuration:
 *
 * ```json
 * "maxCommits": 3
 * ```
 *
 * ### Rejected
 *
 * 1. ```
 *    Create new bakery dashboard
 *    ```
 *
 * 2. ```
 *    Add Cinnamon telemetry
 *    ```
 *
 * 3. ```
 *    Fix the suspicious croissant counter
 *    ```
 *
 * 4. ```
 *    Test emergency toaster
 *    ```
 *
 * ### Accepted
 *
 * 1. ```
 *    Replace guesswork with a tiny chart
 *    ```
 *
 * 2. ```
 *    Teach the kettle to apologise
 *    ```
 *
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
