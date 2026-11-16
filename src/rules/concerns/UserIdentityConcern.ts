import type { CommitSha } from "#types/CommitSha.ts"

export type UserIdentityConcern = {
	location: "user-identity"
	key: `${CommitSha | "pending"}:B:${UserIdentityConcernField}:${UserIdentityConcernRuleKey}`
	rule: UserIdentityConcernRuleKey
	commitSha: CommitSha | null
	field: UserIdentityConcernField
}

export type UserIdentityConcernField =
	| "author:email"
	| "author:name"
	| "committer:email"
	| "committer:name"

export type UserIdentityConcernRuleKey =
	| "useAuthorEmailPatterns"
	| "useAuthorNamePatterns"
	| "useCommitterEmailPatterns"
	| "useCommitterNamePatterns"

export function userIdentityConcern(
	rule: UserIdentityConcernRuleKey,
	commitSha: CommitSha | null,
	props: Pick<UserIdentityConcern, "field">,
): UserIdentityConcern {
	return {
		location: "user-identity",
		key: `${commitSha ?? "pending"}:B:${props.field}:${rule}`,
		rule,
		commitSha,
		...props,
	}
}
