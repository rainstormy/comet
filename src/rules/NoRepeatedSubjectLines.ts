import type { Commits } from "#commits/Commit.ts"
import { isNotToken, isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { commitConcern } from "#rules/concerns/CommitConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"

/**
 * Rejects subject lines equal to a previous subject line in the current branch.
 *
 * ## Rationale
 *
 * The subject line is the part of a commit that readers see most often when scanning the commit history.
 *
 * A unique subject line makes the commit distinguishable from other commits.
 * This keeps the commit history readable and makes the commit easier to find.
 *
 * Sometimes, a duplicated subject line is meant to amend a previous commit.
 * In those cases, it should start with a squash marker such as `amend!`, `fixup!`, or `squash!` to make the intent clear and to enable tools for interactive rebasing.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * Give independent changes distinct subject lines. If a commit amends earlier work, combine it with that commit using `fixup` or `squash`; otherwise, mark the duplicate `reword` and give it a unique subject:
 *
 * ```shell
 * git rebase --interactive <commit-sha>
 * ```
 *
 * TODO: ### IntelliJ IDEA
 *
 * In the Git tool window, right-click an independent duplicate and select `Edit Commit Message...` to give it a unique subject. If it amends earlier work, select `Interactively Rebase from Here...` and set it to `Fixup` or `Squash`.
 *
 * TODO: ## Remarks
 *
 * - Subject comparison ignores whitespace and capitalization.
 * - Merge commits are considered when comparing later subjects, but they never raise concerns.
 * - Revert commits and commits with squash markers are skipped entirely.
 *
 * ## Options
 *
 * This rule has no configurable options.
 *
 * ```json
 * {
 *   "rules": {
 *     "noRepeatedSubjectLines": {
 *       "level": "error",
 *       "options": {}
 *     }
 *   }
 * }
 * ```
 *
 * TODO: ## Examples
 *
 * Each numbered item is a separate commit in the same branch.
 *
 * ### Rejected
 *
 * 1. ```
 *    Add some extra love to the code
 *    ```
 * 2. ```
 *    add   some extra love to the code
 *    ```
 *
 * ### Accepted
 *
 * 1. ```
 *    Label the mystery switch
 *    ```
 * 2. ```
 *    fixup! Label the mystery switch
 *    ```
 * 3. ```
 *    fixup! Label the mystery switch
 *    ```
 */
export function* noRepeatedSubjectLines(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "noRepeatedSubjectLines"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	const previousSubjectLines = new Set<string>()

	for (const commit of commits) {
		if (commit.subjectLine.some(isToken("revert", "squash"))) {
			continue
		}

		const canonicalSubjectLine = commit.subjectLine
			.filter(isNotToken("whitespace"))
			.map((token) => token.value)
			.join("")
			.toLowerCase()

		if (previousSubjectLines.has(canonicalSubjectLine) && !commit.isMergeCommit) {
			yield commitConcern(rule, commit.sha)
		}

		previousSubjectLines.add(canonicalSubjectLine)
	}
}
