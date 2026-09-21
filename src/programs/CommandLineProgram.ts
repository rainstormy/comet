import { getGitBranchCrudeCommits } from "#commits/git/GetGitBranchCrudeCommits.ts"
import { DEFAULT_COMMAND_LINE_CONFIGURATION } from "#configurations/defaults/DefaultCommandLineConfiguration.ts"
import {
	type Configuration,
	getConfiguration,
	getConfigurationPath,
} from "#configurations/GetConfiguration.ts"
import { program } from "#programs/Program.ts"
import {
	EXIT_CODE_GENERAL_ERROR,
	EXIT_CODE_INVALID_CONFIGURATION,
	EXIT_CODE_SUCCESS,
	type ExitCode,
} from "#types/ExitCode.ts"
import { defineOptions, parseArgs } from "#utilities/Args.ts"
import { assertError } from "#utilities/Assertions.ts"
import { printCommandLineError, printMessage } from "#utilities/logging/Logger.ts"
import { deepMerge } from "#utilities/Objects.ts"
import { getPackageVersion } from "#utilities/package/Package.ts"

const OPTION_SCHEMA = defineOptions({
	"--config": { args: { min: 1 } },
	"--default-branch": { args: { min: 1, max: 1 } },
	"--skip-missing-configs": { args: { min: 0, max: 0 } },
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
		const configPaths = parsedArgs["--config"] ?? []
		const defaultBranch = parsedArgs["--default-branch"]?.[0] ?? null
		const skipMissingConfigPaths = parsedArgs["--skip-missing-configs"] !== undefined

		const [crudeCommits, configuration] = await Promise.all([
			getGitBranchCrudeCommits(defaultBranch),
			resolveConfiguration(configPaths, skipMissingConfigPaths),
		])

		return await program(crudeCommits, configuration)
	} catch (error) {
		assertError(error)
		printCommandLineError(error.message)
		return error instanceof TypeError ? EXIT_CODE_INVALID_CONFIGURATION : EXIT_CODE_GENERAL_ERROR
	}
}

export function getHelpText(): string {
	return "Usage: comet [options]"
}

async function resolveConfiguration(
	configPaths: Array<string>,
	skipMissingConfigPaths: boolean,
): Promise<Configuration> {
	const defaultConfiguration = DEFAULT_COMMAND_LINE_CONFIGURATION
	const path = await getConfigurationPath(configPaths.toReversed(), skipMissingConfigPaths)

	if (path === null) {
		return defaultConfiguration
	}

	const jsonConfiguration = await getConfiguration(path)
	return deepMerge(defaultConfiguration, jsonConfiguration)
}
