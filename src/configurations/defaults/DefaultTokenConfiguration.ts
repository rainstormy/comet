import type { TokenConfiguration } from "#commits/TokenConfiguration.ts"

export const DEFAULT_TOKEN_CONFIGURATION: TokenConfiguration = {
	conventionalCommits: {
		types: [],
	},
	issueLinks: {
		prefixes: [],
		wildcards: [],
	},
}
