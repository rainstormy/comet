import { DEFAULT_RULESET_CONFIGURATION } from "#configurations/defaults/DefaultRulesetConfiguration.ts"
import type { Configuration } from "#configurations/GetConfiguration.ts"
import { deepMerge } from "#utilities/Objects.ts"

export const DEFAULT_COMMAND_LINE_CONFIGURATION: Configuration = {
	tokens: {
		issueLinks: null,
	},
	rules: deepMerge(DEFAULT_RULESET_CONFIGURATION, {
		noRepeatedSubjectLines: { level: "off" },
		noRestrictedTrailers: { level: "off" },
		noRevertRevertCommits: { level: "off" },
		noSquashMarkers: { level: "off" },
		useAuthorEmailPatterns: { level: "off" },
		useAuthorNamePatterns: { level: "off" },
		useCommitterEmailPatterns: { level: "off" },
		useCommitterNamePatterns: { level: "off" },
		useIssueLinks: { level: "off" },
	}),
}
