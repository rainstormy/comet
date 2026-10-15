import type { Commits } from "#commits/Commit.ts"
import { isNotToken, isToken, tokenRangeEnd } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectConcern } from "#rules/concerns/SubjectConcern.ts"

/**
 * Rejects subjects without an issue link in the configured position.
 *
 * ## Rationale
 *
 * Issue links connect commits to requirements, discussions, and incident reports in issue-tracking systems such as GitHub, Jira, and YouTrack.
 * This preserves the traceability of the commit history.
 *
 * Consistent positioning of issue links is predictable and makes the commit history easier to read.
 *
 * ## How to fix
 *
 * Change the subject to include an issue link in the appropriate position.
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
 * 3. In the commit message editor, change the subject (i.e. the first line) to include an issue link in the appropriate position.
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
 *    Change the subject (i.e. the first line) to include an issue link in the appropriate position.
 *
 * 2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.
 *
 * ## Remarks
 *
 * The following kinds of commits are always accepted:
 *
 * - Merge commits, i.e. commits with more than one parent.
 * - Revert commits, e.g. `Revert "..."`.
 * - Commits with dependency versions in the subject, e.g. `Bump Vite to 2.4.0-beta.1` and `Pin the Node.js image to 4af617c`.
 *
 * It only recognises issue links declared in `tokens.issueLinks`; ordinary hyperlinks and `Refs` trailers in the message body will not satisfy the rule.
 *
 * ## Options
 *
 * - `position` (one of `anywhere`, `prefix`, or `suffix`): Accept issue links anywhere in, at the beginning of, or at the end of subjects. Default value: `anywhere`.
 *
 * ```json
 * {
 *   "rules": {
 *     "useIssueLinks": {
 *       "level": "error",
 *       "options": {
 *         "position": "anywhere"
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
 * "position": "suffix"
 * ```
 *
 * Token configuration:
 *
 * ```json
 * "issueLinks": {
 *   "prefixes": ["#", "GH-", "GL-"],
 *   "wildcards": ["(no-issue)", "[incident]"]
 * }
 * ```
 *
 * ### Rejected
 *
 * ```
 * #42 Convince the office printer to print in colour
 * ```
 *
 * ```
 * Convince the office printer to print in colour
 *
 * Refs: #42
 * ```
 *
 * ```
 * Replace GH-42 the hamster wheel with a turbine
 * ```
 *
 * ```
 * Read https://github.com/rainstormy/comet/pull/42
 * ```
 *
 * ### Accepted
 *
 * ```
 * Convince the office printer to print in colour #42
 * ```
 *
 * ```
 * Keep the hamsters on the wheel GL-1024
 * ```
 *
 * ```
 * Construction complete (no-issue)
 * ```
 *
 * ```
 * Insufficient funds [incident]
 * ```
 *
 * ```
 * Bump vite from 4.1.1-beta.0 to 4.3.2
 * ```
 */
export function* useIssueLinks(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "useIssueLinks"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	const position = configuration.options.position

	if (position === "anywhere") {
		for (const commit of commits) {
			if (commit.isMergeCommit || commit.subject.some(isToken("issuelink", "revert", "semver"))) {
				continue
			}

			const firstToken = commit.subject.find(isNotToken("squash", "whitespace"))
			const firstStart = firstToken?.range[0] ?? tokenRangeEnd(commit.subject)

			yield subjectConcern(rule, commit.sha, { range: [firstStart, firstStart + 1] })
		}

		return
	}

	if (position === "prefix") {
		for (const commit of commits) {
			if (commit.isMergeCommit || commit.subject.some(isToken("revert", "semver"))) {
				continue
			}

			const firstToken = commit.subject.find(isNotToken("squash", "whitespace"))

			if (firstToken?.type !== "issuelink") {
				const firstStart = firstToken?.range[0] ?? tokenRangeEnd(commit.subject)
				yield subjectConcern(rule, commit.sha, { range: [firstStart, firstStart + 1] })
			}
		}

		return
	}

	for (const commit of commits) {
		if (commit.isMergeCommit || commit.subject.some(isToken("revert", "semver"))) {
			continue
		}

		const lastToken = commit.subject.findLast(isNotToken("whitespace"))

		if (lastToken?.type !== "issuelink") {
			const lastEnd = tokenRangeEnd(commit.subject)
			yield subjectConcern(rule, commit.sha, { range: [lastEnd, lastEnd + 1] })
		}
	}
}
