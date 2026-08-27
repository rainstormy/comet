import { DEFAULT_RULESET_CONFIGURATION } from "#configurations/defaults/DefaultRulesetConfiguration.ts"
import type { Configuration } from "#configurations/GetConfiguration.ts"
import { deepMerge } from "#utilities/Objects.ts"

export const DEFAULT_GITHUB_ACTIONS_CONFIGURATION: Configuration = {
	tokens: {
		issueLinks: null,
	},
	rules: deepMerge(DEFAULT_RULESET_CONFIGURATION, {
		noRestrictedTrailers: { level: "off" },
		useAuthorEmailPatterns: { level: "off" },
		useAuthorNamePatterns: { level: "off" },
		useCommitterEmailPatterns: { level: "off" },
		useCommitterNamePatterns: { level: "off" },
		useIssueLinks: { level: "off" },
	}),
}
