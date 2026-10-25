import { DEFAULT_RULESET_CONFIGURATION } from "#configurations/defaults/DefaultRulesetConfiguration.ts"
import { DEFAULT_TOKEN_CONFIGURATION } from "#configurations/defaults/DefaultTokenConfiguration.ts"
import type { Configuration } from "#configurations/GetConfiguration.ts"
import { deepMerge } from "#utilities/Objects.ts"

export const DEFAULT_COMMAND_LINE_CONFIGURATION: Configuration = {
	git: { defaultBranch: null },
	tokens: DEFAULT_TOKEN_CONFIGURATION,
	rules: deepMerge(DEFAULT_RULESET_CONFIGURATION, {
		noExcessiveCommitsPerBranch: { level: "off" },
		noRepeatedSubjects: { level: "off" },
		noRestrictedTrailers: { level: "off" },
		noRevertReverts: { level: "off" },
		noSquashMarkers: { level: "off" },
		useAuthorEmailPatterns: { level: "off" },
		useAuthorNamePatterns: { level: "off" },
		useCommitterEmailPatterns: { level: "off" },
		useCommitterNamePatterns: { level: "off" },
		useIssueLinks: { level: "off" },
	}),
}
