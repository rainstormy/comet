import type { CharacterRange } from "#types/CharacterRange.ts"
import type { CommitSha } from "#types/CommitSha.ts"

export type SubjectConcern = {
	location: "subject"
	key: `${CommitSha | "pending"}:C${CharacterRange[0]}-${CharacterRange[1]}:${SubjectConcernRuleKey}`
	rule: SubjectConcernRuleKey
	commitSha: CommitSha | null
	range: CharacterRange
}

export type SubjectConcernRuleKey =
	| "noBlankSubjects"
	| "noCapitalisedSubjects"
	| "noExcessiveWhitespace"
	| "noRevertReverts"
	| "noSingleWordSubjects"
	| "noSquashMarkers"
	| "noUnexpectedPunctuation"
	| "useCapitalisedSubjects"
	| "useConciseSubjects"
	| "useConventionalCommits"
	| "useImperativeSubjects"
	| "useIssueLinks"

export function subjectConcern(
	rule: SubjectConcernRuleKey,
	commitSha: CommitSha | null,
	props: Pick<SubjectConcern, "range">,
): SubjectConcern {
	return {
		location: "subject",
		key: `${commitSha ?? "pending"}:C${props.range[0]}-${props.range[1]}:${rule}`,
		rule,
		commitSha,
		...props,
	}
}

export function subjectConcerns(
	rule: SubjectConcernRuleKey,
	commitSha: CommitSha | null,
	ranges: Array<CharacterRange>,
): Array<SubjectConcern> {
	return ranges.map((range) => subjectConcern(rule, commitSha, { range }))
}
