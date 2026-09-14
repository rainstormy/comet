import type { Commits } from "#commits/Commit.ts"
import { isNotToken, isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { commitConcern } from "#rules/concerns/CommitConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"

/**
 * Verifies that no commit repeats an earlier subject line in the branch.
 *
 * ## Rationale
 *
 * Unique subject lines make individual changes easier to identify in a branch's history.
 * Repeated subjects can make it difficult to tell whether a change was duplicated or its subject was never updated.
 *
 * ## Remarks
 *
 * - Subject comparison ignores whitespace and capitalization.
 * - Merge commits are considered when comparing later subjects, but they never raise concerns.
 * - Revert commits and commits with squash markers are skipped entirely.
 *
 * ## Examples
 *
 * ### Rejected
 *
 * ```
 * 1. Add some extra love to the code
 * 2. add   some extra love to the code
 * ```
 *
 * ### Accepted
 *
 * ```
 * 1. Label the mystery switch
 * 2. Test the mystery switch
 * ```
 *
 * ```
 * 1. Tune the kettle
 * 2. fixup! Tune the kettle
 * 3. Revert "Tune the kettle"
 * ```
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
