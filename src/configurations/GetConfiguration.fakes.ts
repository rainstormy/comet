import { fakeTokenConfiguration } from "#commits/TokenConfiguration.fakes.ts"
import type { TokenConfiguration } from "#commits/TokenConfiguration.ts"
import { DEFAULT_RULESET_CONFIGURATION } from "#configurations/defaults/DefaultRulesetConfiguration.ts"
import type { Configuration } from "#configurations/GetConfiguration.ts"
import type { RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { type DeepPartial, deepMerge } from "#utilities/Objects.ts"

export function fakeConfiguration(
	rules?: DeepPartial<RulesetConfiguration>,
	tokens?: Partial<TokenConfiguration>,
): Configuration {
	return {
		git: { defaultBranch: null },
		rules: fakeRulesetConfiguration(rules),
		tokens: fakeTokenConfiguration(tokens),
	}
}

export function emptyRulesetConfiguration(
	rules: DeepPartial<RulesetConfiguration> = {},
): RulesetConfiguration {
	return deepMerge(DEFAULT_RULESET_CONFIGURATION, {
		noBlankSubjects: { level: "off" },
		noExcessiveCommitsPerBranch: { level: "off" },
		noExcessiveWhitespace: { level: "off" },
		noMergeCommits: { level: "off" },
		noRepeatedSubjects: { level: "off" },
		noRestrictedTrailers: { level: "off" },
		noRevertReverts: { level: "off" },
		noSingleWordSubjects: { level: "off" },
		noSquashMarkers: { level: "off" },
		noUnexpectedPunctuation: { level: "off" },
		useAuthorEmailPatterns: { level: "off" },
		useAuthorNamePatterns: { level: "off" },
		useCapitalisedSubjects: { level: "off" },
		useCommitterEmailPatterns: { level: "off" },
		useCommitterNamePatterns: { level: "off" },
		useConciseSubjects: { level: "off" },
		useEmptyLineBeforeBody: { level: "off" },
		useImperativeSubjects: { level: "off" },
		useIssueLinks: { level: "off" },
		useLineWrapping: { level: "off" },
		useSignedCommits: { level: "off" },
		...rules,
	})
}

export function fakeRulesetConfiguration(
	rules: DeepPartial<RulesetConfiguration> = {},
): RulesetConfiguration {
	return deepMerge(DEFAULT_RULESET_CONFIGURATION, {
		noRestrictedTrailers: { options: { restrictedKeys: ["Co-authored-by"] } },
		useAuthorEmailPatterns: {
			options: { patterns: [String.raw`\d+\+.+@users\.noreply\.github\.com`] },
		},
		useAuthorNamePatterns: {
			options: {
				patterns: [
					String.raw`\p{Lu}.*\s.+`,
					String.raw`dependabot\[bot\]`,
					String.raw`renovate\[bot\]`,
				],
			},
		},
		useCommitterEmailPatterns: {
			options: {
				patterns: [
					String.raw`\d+\+.+@users\.noreply\.github\.com`,
					String.raw`noreply@github\.com`,
				],
			},
		},
		useCommitterNamePatterns: {
			options: {
				patterns: [
					String.raw`\p{Lu}.*\s.+`,
					String.raw`dependabot\[bot\]`,
					String.raw`renovate\[bot\]`,
					String.raw`GitHub`,
				],
			},
		},
		...rules,
	})
}
