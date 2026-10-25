import { type TokenConfiguration, sanitiseTokenConfiguration } from "#commits/TokenConfiguration.ts"
import type { DeepPartial } from "#utilities/Objects.ts"

export function fakeTokenConfiguration(
	overrides: DeepPartial<TokenConfiguration> = {},
): TokenConfiguration {
	const sanitisedOverrides = sanitiseTokenConfiguration(overrides)

	return {
		conventionalCommits: {
			types: [
				"build",
				"chore",
				"ci",
				"docs",
				"feat",
				"fix",
				"perf",
				"refactor",
				"revert",
				"style",
				"test",
			],
			...sanitisedOverrides.conventionalCommits,
		},
		issueLinks: {
			prefixes: ["#", "GH-", "GL-"],
			wildcards: [],
			...sanitisedOverrides.issueLinks,
		},
	}
}
