import { expect, it } from "vitest"
import { DEFAULT_COMMAND_LINE_CONFIGURATION } from "#configurations/defaults/DefaultCommandLineConfiguration.ts"
import { getConfiguration } from "#configurations/GetConfiguration.ts"
import type { JsonConfigurationDto } from "#configurations/json/dtos/JsonConfigurationDto.ts"
import { mockJsonFile } from "#utilities/files/Files.fakes.ts"

it("augments the default configuration with the JSON configuration", async () => {
	mockJsonFile("./comet.json", {
		rules: {
			noExcessiveCommitsPerBranch: "off",
		},
		tokens: {
			issueLinks: {
				prefixes: ["#"],
			},
		},
	} satisfies JsonConfigurationDto)

	const configuration = await getConfiguration(DEFAULT_COMMAND_LINE_CONFIGURATION)

	expect(configuration).toEqual({
		rules: {
			...DEFAULT_COMMAND_LINE_CONFIGURATION.rules,
			noExcessiveCommitsPerBranch: {
				level: "off",
				options: { maxCommits: 10 },
			},
		},
		tokens: {
			issueLinks: {
				prefixes: ["#"],
				wildcards: [],
			},
		},
	})
})
