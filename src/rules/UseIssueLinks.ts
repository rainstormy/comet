import type { Commits } from "#commits/Commit.ts"
import { isNotToken, isToken, tokenRangeEnd } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"

/**
 * TODO: Rejects subject lines without an issue link in the configured position.
 *
 * TODO: ## Rationale
 *
 * Linking commits to issues in a project management system provides traceability
 * between a code change and the work that motivated it, making related changes
 * easier to understand and find.
 *
 * A link in the subject gives users a direct path from a change to its requirements, discussion, or incident.
 * This rule reduces the time users spend searching for context when reviewing a history or investigating a regression.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * Add an issue link recognised under `tokens.issueLinks` in the position configured for this rule. To edit an existing subject, start an interactive rebase and mark the commit `reword`:
 *
 * ```shell
 * git rebase --interactive <commit-sha>
 * ```
 *
 * TODO: ### IntelliJ IDEA
 *
 * In the Git tool window, right-click the commit and select `Edit Commit Message...`. Add a configured issue link in the required position.
 *
 * TODO: ## Remarks
 *
 * - Merge commits, revert commits, and subjects containing semver tokens are exempt.
 * - Squash markers are skipped while checking a prefix, but they do not satisfy the requirement.
 * - The rule recognises only issue links configured under `tokens.issueLinks`.
 *
 * TODO: ## Options
 *
 * - `position` (one of `"anywhere"`, `"prefix"`, or `"suffix"`): The required position of an issue link in a subject line. Default value: `"anywhere"`.
 *
 * Configure recognised issue links under `tokens.issueLinks`. Each prefix is followed by digits, while wildcards are matched as literal issue-link labels.
 *
 * ```json
 * {
 *   "tokens": {
 *     "issueLinks": {
 *       "prefixes": ["#", "GH-", "GL-"],
 *       "wildcards": ["(no-issue)", "[incident]"]
 *     }
 *   },
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
 * TODO: ## Examples
 *
 * With `position: "suffix"` and the token configuration above:
 *
 * ### Rejected
 *
 * ```
 * #42 Convince the office printer to print in colour
 * ```
 *
 * ```
 * Convince the office printer to print in colour
 * ```
 *
 * ```
 * GL-1024 keep the hamsters on the wheel
 * ```
 *
 * ### Accepted
 *
 * ```
 * Convince the office printer to print in colour #42
 * ```
 *
 * ```
 * The city can build more pylons (no-issue)
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
			if (
				commit.isMergeCommit ||
				commit.subjectLine.some(isToken("issuelink", "revert", "semver"))
			) {
				continue
			}

			const firstToken = commit.subjectLine.find(isNotToken("squash", "whitespace"))
			const firstStart = firstToken?.range[0] ?? tokenRangeEnd(commit.subjectLine)

			yield subjectLineConcern(rule, commit.sha, { range: [firstStart, firstStart + 1] })
		}

		return
	}

	if (position === "prefix") {
		for (const commit of commits) {
			if (commit.isMergeCommit || commit.subjectLine.some(isToken("revert", "semver"))) {
				continue
			}

			const firstToken = commit.subjectLine.find(isNotToken("squash", "whitespace"))

			if (firstToken?.type !== "issuelink") {
				const firstStart = firstToken?.range[0] ?? tokenRangeEnd(commit.subjectLine)
				yield subjectLineConcern(rule, commit.sha, { range: [firstStart, firstStart + 1] })
			}
		}

		return
	}

	for (const commit of commits) {
		if (commit.isMergeCommit || commit.subjectLine.some(isToken("revert", "semver"))) {
			continue
		}

		const lastToken = commit.subjectLine.findLast(isNotToken("whitespace"))

		if (lastToken?.type !== "issuelink") {
			const lastEnd = tokenRangeEnd(commit.subjectLine)
			yield subjectLineConcern(rule, commit.sha, { range: [lastEnd, lastEnd + 1] })
		}
	}
}
