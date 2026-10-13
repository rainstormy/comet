import type { CharacterRange } from "#types/CharacterRange.ts"
import type { CommitSha } from "#types/CommitSha.ts"

export type SubjectConcern = {
	location: "subject"
	key: `${CommitSha}:C${CharacterRange[0]}-${CharacterRange[1]}:${SubjectConcernRuleKey}`
	rule: SubjectConcernRuleKey
	commitSha: CommitSha
	range: CharacterRange
}

export type SubjectConcernRuleKey =
	| "noBlankSubjects"
	| "noExcessiveWhitespace"
	| "noRevertReverts"
	| "noSingleWordSubjects"
	| "noSquashMarkers"
	| "noUnexpectedPunctuation"
	| "useCapitalisedSubjects"
	| "useConciseSubjects"
	| "useImperativeSubjects"
	| "useIssueLinks"

export function subjectConcern(
	rule: SubjectConcernRuleKey,
	commitSha: CommitSha,
	props: Pick<SubjectConcern, "range">,
): SubjectConcern {
	return {
		location: "subject",
		key: `${commitSha}:C${props.range[0]}-${props.range[1]}:${rule}`,
		rule,
		commitSha,
		...props,
	}
}

export function subjectConcerns(
	rule: SubjectConcernRuleKey,
	commitSha: CommitSha,
	ranges: Array<CharacterRange>,
): Array<SubjectConcern> {
	return ranges.map((range) => subjectConcern(rule, commitSha, { range }))
}
