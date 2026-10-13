import * as v from "valibot"
import { naturalNumber } from "#types/NaturalNumber.ts"
import { stringArray } from "#types/StringArray.ts"

export type RulesetConfiguration = v.InferOutput<typeof RULESET_CONFIGURATION_SCHEMA>

export const RULE_LEVEL_SCHEMA = v.picklist(["error", "off"], "'error' or 'off'")
const EMPTY_RULE_CONFIGURATION = ruleConfiguration({})

export const RULESET_CONFIGURATION_SCHEMA = v.strictObject({
	noBlankSubjects: EMPTY_RULE_CONFIGURATION,
	noExcessiveCommitsPerBranch: ruleConfiguration({ maxCommits: naturalNumber() }),
	noExcessiveWhitespace: EMPTY_RULE_CONFIGURATION,
	noMergeCommits: EMPTY_RULE_CONFIGURATION,
	noRepeatedSubjects: EMPTY_RULE_CONFIGURATION,
	noRestrictedTrailers: ruleConfiguration({ restrictedKeys: stringArray() }),
	noRevertReverts: EMPTY_RULE_CONFIGURATION,
	noSingleWordSubjects: EMPTY_RULE_CONFIGURATION,
	noSquashMarkers: EMPTY_RULE_CONFIGURATION,
	noUnexpectedPunctuation: EMPTY_RULE_CONFIGURATION,
	useAuthorEmailPatterns: ruleConfiguration({ patterns: stringArray() }),
	useAuthorNamePatterns: ruleConfiguration({ patterns: stringArray() }),
	useCapitalisedSubjects: EMPTY_RULE_CONFIGURATION,
	useCommitterEmailPatterns: ruleConfiguration({ patterns: stringArray() }),
	useCommitterNamePatterns: ruleConfiguration({ patterns: stringArray() }),
	useConciseSubjects: ruleConfiguration({ maxLength: naturalNumber() }),
	useEmptyLineBeforeBody: EMPTY_RULE_CONFIGURATION,
	useImperativeSubjects: ruleConfiguration({ whitelist: stringArray() }),
	useIssueLinks: ruleConfiguration({
		position: v.picklist(["anywhere", "prefix", "suffix"], "'anywhere', 'prefix', or 'suffix'"),
	}),
	useLineWrapping: ruleConfiguration({ maxLength: naturalNumber() }),
	useSignedCommits: EMPTY_RULE_CONFIGURATION,
})

// oxlint-disable-next-line typescript/explicit-function-return-type -- Rely on type inference for Valibot schemas.
function ruleConfiguration<Options extends v.ObjectEntries>(options: Options) {
	return v.strictObject({ level: RULE_LEVEL_SCHEMA, options: v.strictObject(options) })
}

export type RuleKey = keyof RulesetConfiguration
