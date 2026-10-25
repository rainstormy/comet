import { type TokenConfiguration, sanitiseTokenConfiguration } from "#commits/TokenConfiguration.ts"

export function fakeTokenConfiguration(
	overrides: Partial<TokenConfiguration> = {},
): TokenConfiguration {
	return sanitiseTokenConfiguration({
		issueLinks: {
			prefixes: ["#", "GH-", "GL-"],
			wildcards: [],
		},
		...overrides,
	})
}
