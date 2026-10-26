import type { Commits } from "#commits/Commit.ts"
import { isNotToken, isToken, tokenRangeEnd } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectConcern } from "#rules/concerns/SubjectConcern.ts"

/**
 * Rejects subjects without a [Conventional Commits](https://www.conventionalcommits.org) prefix.
 *
 * ## Rationale
 *
 * The Conventional Commits specification defines the means to identify and distinguish changes solely from the commit messages.
 *
 * Restricting changes to a limited set of types keeps the commit history standardised for SemVer tooling and automated release notes.
 *
 * ## How to fix
 *
 * Change the subject to start with a type, an optional scope, and an optional breaking change marker (`!`), followed by `: `.
 *
 * ### Command-line interface (CLI)
 *
 * 1. Rebase interactively from (the parent of) the commit SHA, for instance:
 *
 *    ```shell
 *    git rebase --interactive '7e0ff1ce^'
 *    ```
 *
 * 2. Set the commit to `reword`, then save and close the editor to proceed:
 *
 *    ```
 *    reword 7e0ff1ce Welcome to my convenience store
 *    ```
 *
 * 3. In the commit message editor, add the appropriate prefix to the beginning of the subject (i.e. the first line).
 *    Then save and close the editor to complete the rebase.
 *
 * 4. Force-push the rewritten branch to the remote repository:
 *
 *    ```shell
 *    git push --force-with-lease
 *    ```
 *
 * ### JetBrains IDEs (IntelliJ IDEA, WebStorm, etc.)
 *
 * 1. In the Git tool window, right-click the commit and select **Edit Commit Message...**.
 *    Add the appropriate prefix to the beginning of the subject (i.e. the first line).
 *
 * 2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.
 *
 * ## Remarks
 *
 * The following kinds of commits are always accepted:
 *
 * - Merge commits.
 * - Revert commits, e.g. `Revert "..."`.
 *
 * It disregards the following kinds of tokens at the beginning of subjects:
 *
 * - Squash markers, e.g. `fixup!` and `squash!`.
 *
 * It only recognises prefixes declared in `tokens.conventionalCommits`.
 * Prefixes are case sensitive.
 *
 * ## Options
 *
 * This rule has no configurable options.
 *
 * ```json
 * {
 *   "rules": {
 *     "useConventionalCommits": {
 *       "level": "error",
 *       "options": {}
 *     }
 *   }
 * }
 * ```
 *
 * ## Examples
 *
 * Token configuration:
 *
 * ```json
 * "conventionalCommits": {
 *   "types": ["build", "chore", "ci", "docs", "feat", "fix", "perf", "refactor", "revert", "style", "test"]
 * }
 * ```
 *
 * ### Rejected
 *
 * ```
 * Refresh the monthly sales dashboard
 * ```
 *
 * ```
 * feat:Add offline export queues
 * ```
 *
 * ```
 * #42 feat: billing alerts
 * ```
 *
 * ```
 * docs(): clarified the data retention period
 * ```
 *
 * ### Accepted
 *
 * ```
 * feat: #42 Add a dark mode toggle
 * ```
 *
 * ```
 * fix(api)!: legacy payments endpoint has been retired
 * ```
 *
 * ```
 * chore(deps): bump vite to 8.3.3
 * ```
 *
 * ```
 * fixup! docs: Explain fix: prefixes
 * ```
 *
 * ```
 * Revert "Move receipts into the monthly report"
 * ```
 */
export function* useConventionalCommits(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "useConventionalCommits"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	for (const commit of commits) {
		if (commit.isMergeCommit || commit.subject.some(isToken("revert"))) {
			continue
		}

		const firstTokenIndex = commit.subject.findIndex(isNotToken("squash", "whitespace"))
		const firstToken = commit.subject[firstTokenIndex]
		const followingToken = commit.subject[firstTokenIndex + 1]

		if (firstToken?.type !== "conventional") {
			const firstStart = firstToken?.range[0] ?? tokenRangeEnd(commit.subject)
			yield subjectConcern(rule, commit.sha, { range: [firstStart, firstStart + 1] })
		} else if (
			followingToken !== undefined &&
			(followingToken.type !== "whitespace" || !followingToken.value.startsWith(" "))
		) {
			const colonIndex = firstToken.range[1] - 1
			yield subjectConcern(rule, commit.sha, { range: [colonIndex, colonIndex + 1] })
		}
	}
}
