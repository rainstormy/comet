import { expect, it } from "vitest"
import { DEFAULT_GITHUB_ACTIONS_CONFIGURATION } from "#configurations/defaults/DefaultGithubActionsConfiguration.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"

const configuration = DEFAULT_GITHUB_ACTIONS_CONFIGURATION

it("does not tokenise issue links", () => {
	expect(configuration.tokens.issueLinks).toEqual({ prefixes: [], wildcards: [] })
})

it.each`
	enabledRuleKey                   | expectedRuleOptions
	${"noBlankSubjects"}             | ${{}}
	${"noExcessiveCommitsPerBranch"} | ${{ maxCommits: 10 }}
	${"noExcessiveWhitespace"}       | ${{}}
	${"noMergeCommits"}              | ${{}}
	${"noRepeatedSubjects"}          | ${{}}
	${"noRevertReverts"}             | ${{}}
	${"noSingleWordSubjects"}        | ${{}}
	${"noSquashMarkers"}             | ${{}}
	${"noUnexpectedPunctuation"}     | ${{}}
	${"useCapitalisedSubjects"}      | ${{}}
	${"useConciseSubjects"}          | ${{ maxLength: 50 }}
	${"useEmptyLineBeforeBody"}      | ${{}}
	${"useImperativeSubjects"}       | ${{ whitelist: [] }}
	${"useLineWrapping"}             | ${{ maxLength: 72 }}
	${"useSignedCommits"}            | ${{}}
`("enables $enabledRuleKey", (props: { enabledRuleKey: RuleKey; expectedRuleOptions: object }) => {
	const rule = configuration.rules[props.enabledRuleKey]
	expect(rule).toEqual({ level: "error", options: props.expectedRuleOptions })
})

it.each`
	disabledRuleKey                | expectedRuleOptions
	${"noRestrictedTrailers"}      | ${{ restrictedKeys: [] }}
	${"useAuthorEmailPatterns"}    | ${{ patterns: [] }}
	${"useAuthorNamePatterns"}     | ${{ patterns: [] }}
	${"useCommitterEmailPatterns"} | ${{ patterns: [] }}
	${"useCommitterNamePatterns"}  | ${{ patterns: [] }}
	${"useIssueLinks"}             | ${{ position: "anywhere" }}
	${"useConventionalCommits"}    | ${{}}
`(
	"does not enable $disabledRuleKey'",
	(props: { disabledRuleKey: RuleKey; expectedRuleOptions: object }) => {
		const rule = configuration.rules[props.disabledRuleKey]
		expect(rule).toEqual({ level: "off", options: props.expectedRuleOptions })
	},
)
