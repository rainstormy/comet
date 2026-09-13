import { blue, bold, green, gray as grey, magenta, red } from "ansis"
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

export const COMMAND_LINE_OPTION_SCHEMA = defineOptions({
	"--config": { args: { min: 1 } },
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
		const parsedArgs = parseArgs(COMMAND_LINE_OPTION_SCHEMA, args)
		const configPaths = parsedArgs["--config"] ?? []
		const skipMissingConfigPaths = parsedArgs["--skip-missing-configs"] !== undefined

		const [crudeCommits, configuration] = await Promise.all([
			getGitBranchCrudeCommits(),
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
	return `${bold`Usage:`} comet [options]

Comet is a linter to ensure that Git commit messages conform to certain
standards and conventions declared by a customisable set of rules.

It checks the commits on the current branch that have not been delivered to the
main branch, i.e. the range ${magenta`origin/HEAD..HEAD`} for a remote named ${magenta`origin`}. If no
remote exists, it checks the local range ${magenta`main..HEAD`} or ${magenta`master..HEAD`}.

It does not modify any commits.

You can change the default set of rules by providing a custom configuration in
${magenta`comet.json`} (or ${magenta`comet.jsonc`}) or a specific path via ${magenta`--config <path>`}.
Use the official JSON schema to validate the configuration file and to enable
code completion, for example:

${grey`{
    "$schema": "./node_modules/@rainstormy/comet/schema.json",
    "rules": {
        "noMergeCommits": "error",
        "noSquashCommits": "error",
        "useConciseSubjectLines": {
            "level": "error",
            "options": { "maxLength": 50 }
        },
        "useSignedCommits": "error",
    }
}`}

A configuration file may also inherit settings from another file through the
${magenta`extends`} property.

${bold`Exit codes:`}
   ${green.bold`0`}  Every commit passed all configured rules.
   ${red.bold`1`}  An unexpected error occurred.
   ${red.bold`2`}  A command-line argument or a configuration file is invalid.
  ${red.bold`40`}  At least one commit violated some configured rules.

${bold`Options:`}
  ${blue`${bold`--config`} <path>`}
      Load a custom ${magenta`.json`} (or ${magenta`.jsonc`}) configuration file at the given path.

      Multiple pairs of ${magenta`--config <path>`} may be provided, in which case it picks
      the last path and ignores the previous ones. Use ${magenta`--skip-missing-configs`} to
      disregard non-existing paths before picking a path.

  ${blue.bold`--help`}, ${blue.bold`-h`}
      Display this help screen and exit.

  ${blue.bold`--skip-missing-configs`}
      Ignore missing paths provided in ${magenta`--config`} instead of failing.

  ${blue.bold`--version`}, ${blue.bold`-v`}
      Display the version of this tool and exit.`
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
