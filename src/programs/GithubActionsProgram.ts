import { getGithubPullRequestCrudeCommits } from "#commits/github/GetGithubPullRequestCrudeCommits.ts"
import { DEFAULT_GITHUB_ACTIONS_CONFIGURATION } from "#configurations/defaults/DefaultGithubActionsConfiguration.ts"
import { type Configuration, getConfiguration } from "#configurations/GetConfiguration.ts"
import { program } from "#programs/Program.ts"
import { EXIT_CODE_GENERAL_ERROR, type ExitCode } from "#types/ExitCode.ts"
import { assertError } from "#utilities/Assertions.ts"
import { isReadableFile } from "#utilities/files/Files.ts"
import { printGithubActionsError } from "#utilities/logging/Logger.ts"
import { deepMerge } from "#utilities/Objects.ts"

export async function githubActionsProgram(): Promise<ExitCode> {
	try {
		const [crudeCommits, configuration] = await Promise.all([
			getGithubPullRequestCrudeCommits(),
			resolveConfiguration(),
		])

		return await program(crudeCommits, configuration)
	} catch (error) {
		assertError(error)
		printGithubActionsError(error.message)
		return EXIT_CODE_GENERAL_ERROR
	}
}

async function resolveConfiguration(): Promise<Configuration> {
	const defaultConfiguration = DEFAULT_GITHUB_ACTIONS_CONFIGURATION
	const path = await getConfigurationPath()

	if (path === null) {
		return defaultConfiguration
	}

	const jsonConfiguration = await getConfiguration(path)
	return deepMerge(defaultConfiguration, jsonConfiguration)
}

async function getConfigurationPath(): Promise<string | null> {
	return getDefaultConfigurationPath()
}

async function getDefaultConfigurationPath(): Promise<string | null> {
	const defaultExists = await isReadableFile("comet.json")
	return defaultExists ? "comet.json" : null
}
