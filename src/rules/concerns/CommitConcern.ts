import type { CommitSha } from "#types/CommitSha.ts"

export type CommitConcern = {
	location: "commit"
	key: `${CommitSha}:A:${CommitConcernRuleKey}`
	rule: CommitConcernRuleKey
	commitSha: CommitSha
}

export type CommitConcernRuleKey =
	| "noExcessiveCommitsPerBranch"
	| "noMergeCommits"
	| "noRepeatedSubjects"
	| "useSignedCommits"

export function commitConcern(rule: CommitConcernRuleKey, commitSha: CommitSha): CommitConcern {
	return { location: "commit", key: `${commitSha}:A:${rule}`, rule, commitSha }
}
