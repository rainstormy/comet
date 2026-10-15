import type { Commits } from "#commits/Commit.ts"
import { isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectConcern } from "#rules/concerns/SubjectConcern.ts"
import { rangeBetween } from "#types/CharacterRange.ts"

/**
 * Rejects subjects beginning with a squash marker like `amend!`, `fixup!`, and `squash!`, reminding you to squash temporary commits before merging pull requests.
 *
 * ## Rationale
 *
 * Temporary commits with squash markers make it easier for reviewers to discover changes during a code review.
 * They also eliminate the need for writing intermediate commit messages.
 *
 * Squashing these commits into the original commit produces a cleaner commit history.
 * A single, cohesive commit is also easier to revert than a sequence of commits that may be out of order.
 *
 * ## How to fix
 *
 * Rebase interactively and squash the temporary commits into the original commit.
 *
 * ### Command-line interface (CLI)
 *
 * 1. Rebase interactively from (the parent of) the original commit, with [auto-squashing enabled](https://git-scm.com/docs/git-rebase#Documentation/git-rebase.txt---autosquash), for instance:
 *
 *    ```shell
 *    git rebase --interactive --autosquash '7e0ff1ce^'
 *    ```
 *
 * 2. Ensure that each temporary commit follows its target commit, then save and close the editor to proceed:
 *
 *    ```
 *    pick 7e0ff1ce Welcome to my convenience store
 *    fixup cafebeef fixup! Welcome to my convenience store
 *    ```
 *
 * 3. For `squash` actions, in the commit message editor, delete the squash markers and change the subject (i.e. the first line) to describe the combined change.
 *    Then save and close the editor to complete the rebase. Resolve any merge conflicts that arise.
 *
 * 4. Force-push the rewritten branch to the remote repository:
 *
 *    ```shell
 *    git push --force-with-lease
 *    ```
 *
 * ### JetBrains IDEs (IntelliJ IDEA, WebStorm, etc.)
 *
 * 1. In the Git tool window, right-click the original commit and select **Interactively Rebase from Here...**.
 *
 * 2. Ensure that each temporary commit follows its target commit and has a matching action, e.g. `fixup` or `squash`.
 *    For `squash` actions, delete the squash markers and change the subject (i.e. the first line) to describe the combined change.
 *    Then start the rebase and resolve any merge conflicts that arise.
 *
 * 3. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.
 *
 * ## Options
 *
 * This rule has no configurable options.
 *
 * ```json
 * {
 *   "rules": {
 *     "noSquashMarkers": {
 *       "level": "error",
 *       "options": {}
 *     }
 *   }
 * }
 * ```
 *
 * ## Examples
 *
 * ### Rejected
 *
 * ```
 * amend!
 * ```
 *
 * ```
 * squash! Reheat the leftovers
 * ```
 *
 * ```
 * fixup! fixup! added some extra love to the code
 * ```
 *
 * ### Accepted
 *
 * ```
 * Refactor the taxi module
 * ```
 *
 * ```
 * Make the commit scream fixup! again
 * ```
 *
 * ```
 * squash the commits
 * ```
 */
export function* noSquashMarkers(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "noSquashMarkers"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	for (const commit of commits) {
		const firstSquashToken = commit.subject.find(isToken("squash"))

		if (firstSquashToken) {
			const lastSquashToken = commit.subject.findLast(isToken("squash")) ?? firstSquashToken

			yield subjectConcern(rule, commit.sha, {
				range: rangeBetween(firstSquashToken.range, lastSquashToken.range),
			})
		}
	}
}
