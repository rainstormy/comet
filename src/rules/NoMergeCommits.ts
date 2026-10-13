import type { Commits } from "#commits/Commit.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { commitConcern } from "#rules/concerns/CommitConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"

/**
 * Rejects commits with more than one parent commit, encouraging rebasing instead of merging to keep a branch up to date with the main branch.
 *
 * ## Rationale
 *
 * A linear commit history is easier to read, easier to revert, and safer to rebase.
 *
 * ## How to fix
 *
 * Rebase the current branch onto the main branch while [dropping merge commits](https://git-scm.com/docs/git-rebase#Documentation/git-rebase.txt---no-rebase-merges).
 *
 * ### Command-line interface (CLI)
 *
 * 1. Refresh branch information from the remote, for example:
 *
 *    ```shell
 *    git fetch origin
 *    ```
 *
 * 2. Rebase onto the main branch, for example `origin/main`, while dropping merge commits:
 *
 *    ```shell
 *    git rebase --no-rebase-merges 'origin/main'
 *    ```
 *
 * 3. If the rebase pauses, resolve the merge conflicts and stage the changes, then continue:
 *
 *    ```shell
 *    git add <resolved-files>
 *    git rebase --continue
 *    ```
 *
 *    Repeat until the rebase completes.
 *
 * 4. Review the rebased commits and verify that any changes made in the original merge commit are preserved.
 *
 * 5. Force-push the rewritten branch to the remote repository:
 *
 *    ```shell
 *    git push --force-with-lease
 *    ```
 *
 * ### JetBrains IDEs (IntelliJ IDEA, WebStorm, etc.)
 *
 * 1. Select **Git** > **Fetch** to refresh branch information from the remote.
 *
 * 2. Select **Git** > **Rebase...** and use the main branch as base, for example `origin/main`.
 *    Leave the `--rebase-merges` option disabled to drop the merge commits.
 *
 * 3. Start the rebase and resolve any merge conflicts that arise.
 *    Review the rebased commits and verify that any changes made in the original merge commit are preserved.
 *
 * 4. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.
 *
 * ## Remarks
 *
 * The number of parent commits is the only thing that matters; it disregards the subject.
 *
 * Merge commits created by GitHub upon merging pull requests are always accepted.
 *
 * ## Options
 *
 * This rule has no configurable options.
 *
 * ```json
 * {
 *   "rules": {
 *     "noMergeCommits": {
 *       "level": "error",
 *       "options": {}
 *     }
 *   }
 * }
 * ```
 *
 * ## Examples
 *
 * The following examples display the `parent` headers of the commit before the commit message.
 *
 * ### Rejected
 *
 * ```
 * parent: 19fe6c7e563dc0a343fd4a8e1f5651de03cb0a90
 * parent: 5d9fbd14e0ecba1ad50f1fdfb371ba4da907e12d
 *
 * Merge branch 'main' into bugfix/dance-party-playlist
 * ```
 *
 * ```
 * parent: 316f0ce3d715fa10c7d4f727930dbad666c34e59
 * parent: 712a56ac04c9c5b931de0c39bd982960bb6c1071
 * parent: 22d4a421bea4a8adbbe0e73ba7f58584d6d70366
 *
 * Cthulhu visited my branch today
 * ```
 *
 * ### Accepted
 *
 * ```
 * initial commit
 * ```
 *
 * ```
 * parent: 98b22d82dfc39e3d64bc527172b36553a015194b
 *
 * Merge `SoftIceService` and `IceCreamFactory`
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
