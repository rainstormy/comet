import { getGitBranchCrudeCommits } from "#commits/git/GetGitBranchCrudeCommits.ts"
import { DEFAULT_COMMAND_LINE_CONFIGURATION } from "#configurations/defaults/DefaultCommandLineConfiguration.ts"
import { type Configuration, getConfiguration } from "#configurations/GetConfiguration.ts"
import { program } from "#programs/Program.ts"
import {
	EXIT_CODE_GENERAL_ERROR,
	EXIT_CODE_INVALID_INPUT,
	EXIT_CODE_SUCCESS,
	type ExitCode,
} from "#types/ExitCode.ts"
import { defineOptions, parseArgs } from "#utilities/Args.ts"
import { assertError } from "#utilities/Assertions.ts"
import { isReadableFile } from "#utilities/files/Files.ts"
import { printCommandLineError, printMessage } from "#utilities/logging/Logger.ts"
import { deepMerge } from "#utilities/Objects.ts"
import { getPackageVersion } from "#utilities/package/Package.ts"

const OPTION_SCHEMA = defineOptions({
	"--config": { args: { min: 1, max: 1 } },
})

export async function commandLineProgram(args: Array<string>): Promise<ExitCode> {
	if (args.includes("--help") || args.includes("-h")) {
		printMessage(getHelpText())
		return EXIT_CODE_SUCCESS
	}
	if (args.includes("--version") || args.includes("-v")) {
		printMessage(getPackageVersion())
		return EXIT_CODE_SUCCESS
	}

	try {
		const parsedArgs = parseArgs(OPTION_SCHEMA, args)
		const config = parsedArgs["--config"]

		const [crudeCommits, configuration] = await Promise.all([
			getGitBranchCrudeCommits(),
			resolveConfiguration(config),
		])

		return await program(crudeCommits, configuration)
	} catch (error) {
		assertError(error)
		printCommandLineError(error.message)
		return error instanceof TypeError ? EXIT_CODE_INVALID_INPUT : EXIT_CODE_GENERAL_ERROR
	}
}

export function getHelpText(): string {
	return "Usage: comet [options]"
}

async function resolveConfiguration(config: Array<string> | undefined): Promise<Configuration> {
	const defaultConfiguration = DEFAULT_COMMAND_LINE_CONFIGURATION
	const path = await getConfigurationPath(config)

	if (path === null) {
		return defaultConfiguration
	}

	const jsonConfiguration = await getConfiguration(path)
	return deepMerge(defaultConfiguration, jsonConfiguration)
}

async function getConfigurationPath(config: Array<string> | undefined): Promise<string | null> {
	return config?.[0] ?? (await getDefaultConfigurationPath())
}

async function getDefaultConfigurationPath(): Promise<string | null> {
	const defaultExists = await isReadableFile("comet.json")
	return defaultExists ? "comet.json" : null
}
