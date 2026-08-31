import type { TokenConfiguration } from "#commits/TokenConfiguration.ts"

export function fakeTokenConfiguration(
	overrides: Partial<TokenConfiguration> = {},
): TokenConfiguration {
	return {
		issueLinks: { prefixes: ["#", "GH-", "GL-"], wildcards: [] },
		...overrides,
	}
}
