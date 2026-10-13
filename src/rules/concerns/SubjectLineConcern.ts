import type { CharacterRange } from "#types/CharacterRange.ts"
import type { CommitSha } from "#types/CommitSha.ts"

export type SubjectLineConcern = {
	location: "subject-line"
	key: `${CommitSha}:C${CharacterRange[0]}-${CharacterRange[1]}:${SubjectLineConcernRuleKey}`
	rule: SubjectLineConcernRuleKey
	commitSha: CommitSha
	range: CharacterRange
}

export type SubjectLineConcernRuleKey =
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

export function subjectLineConcern(
	rule: SubjectLineConcernRuleKey,
	commitSha: CommitSha,
	props: Pick<SubjectLineConcern, "range">,
): SubjectLineConcern {
	return {
		location: "subject-line",
		key: `${commitSha}:C${props.range[0]}-${props.range[1]}:${rule}`,
		rule,
		commitSha,
		...props,
	}
}

export function subjectLineConcerns(
	rule: SubjectLineConcernRuleKey,
	commitSha: CommitSha,
	ranges: Array<CharacterRange>,
): Array<SubjectLineConcern> {
	return ranges.map((range) => subjectLineConcern(rule, commitSha, { range }))
}
