import type { CommitSha } from "#types/CommitSha.ts"

export type CommitConcern = {
	location: "commit"
	key: `${CommitSha | "pending"}:A:${CommitConcernRuleKey}`
	rule: CommitConcernRuleKey
	commitSha: CommitSha | null
}

export type CommitConcernRuleKey =
	| "noExcessiveCommitsPerBranch"
	| "noMergeCommits"
	| "noRepeatedSubjects"
	| "useSignedCommits"

export function commitConcern(
	rule: CommitConcernRuleKey,
	commitSha: CommitSha | null,
): CommitConcern {
	return { location: "commit", key: `${commitSha ?? "pending"}:A:${rule}`, rule, commitSha }
}
