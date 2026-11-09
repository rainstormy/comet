import { blue, bold, green, gray as grey, magenta, red } from "ansis"
import { getGitBranchCrudeCommits } from "#commits/git/GetGitBranchCrudeCommits.ts"
import { getGitPendingCrudeCommits } from "#commits/git/GetGitPendingCrudeCommits.ts"
import { DEFAULT_COMMAND_LINE_CONFIGURATION } from "#configurations/defaults/DefaultCommandLineConfiguration.ts"
import {
	type Configuration,
	formatConfigurationIssues,
	getConfiguration,
	getConfigurationPath,
} from "#configurations/GetConfiguration.ts"
import { program } from "#programs/Program.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import {
	EXIT_CODE_GENERAL_ERROR,
	EXIT_CODE_INVALID_CONFIGURATION,
	EXIT_CODE_SUCCESS,
	type ExitCode,
} from "#types/ExitCode.ts"
import { defineOptions, parseArgs } from "#utilities/Args.ts"
import { assertError } from "#utilities/Assertions.ts"
import { resolveAbsolutePath } from "#utilities/files/Files.ts"
import {
	printCommandLineError,
	printCommandLineWarning,
	printMessage,
} from "#utilities/logging/Logger.ts"
import { deepMerge } from "#utilities/Objects.ts"
import { getPackageVersion } from "#utilities/package/Package.ts"

export const COMMAND_LINE_OPTION_SCHEMA = defineOptions({
	"--config": { args: { min: 1 } },
	"--default-branch": { args: { min: 1, max: 1 } },
	"--message-file": { args: { min: 1, max: 1 } },
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
		const messageFilePath = parsedArgs["--message-file"]?.[0] ?? null

		const configuration = await resolveConfiguration(configPaths, skipMissingConfigPaths)

		if (messageFilePath !== null) {
			return await checkPendingCommit(messageFilePath, configuration)
		}

		const defaultBranch = parsedArgs["--default-branch"]?.[0] ?? configuration.git.defaultBranch
		return await checkBranchCommits(defaultBranch, configuration)
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
default branch, i.e. the range ${magenta`origin/HEAD..HEAD`} for a remote named ${magenta`origin`}.
If no remote exists, it checks the local range ${magenta`main..HEAD`} or ${magenta`master..HEAD`}.

Use ${magenta`--message-file <path>`} to check the commit that is about to be created
instead, e.g. in a ${magenta`commit-msg`} Git hook.

It does not modify any commits.

You can change the default set of rules by providing a custom configuration
in ${magenta`comet.json`} (or ${magenta`comet.jsonc`}) or a specific path via ${magenta`--config <path>`}.
Use the official JSON schema to validate the configuration file and to enable
code completion, for example:

${grey`{
    "$schema": "https://unpkg.com/@rainstormy/comet@${getPackageVersion()}/schema.json",
    "rules": {
        "noMergeCommits": "error",
        "noSquashCommits": "error",
        "useConciseSubjects": {
            "level": "error",
            "options": { "maxLength": 50 }
        },
        "useSignedCommits": "error",
    }
}`}

A configuration file may also inherit settings from another file
through the ${magenta`extends`} property.

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

  ${blue`${bold`--default-branch`} <branch>`}
      Check commits in the range ${magenta`<branch>..HEAD`} instead of the usual range
      of ${magenta`origin/HEAD..HEAD`}.

      It takes precedence over the ${magenta`git.defaultBranch`} setting in the
      configuration file.

  ${blue.bold`--help`}, ${blue.bold`-h`}
      Display this help screen and exit.

  ${blue`${bold`--message-file`} <path>`}
      Check the message of the commit that is about to be created instead of
      the commits on the current branch, e.g. ${magenta`--message-file "$1"`} in a
      ${magenta`commit-msg`} Git hook where Git passes the path of the message file.

      It cleans up the message like Git does, e.g. by removing comments.
      It checks the commit in isolation, so rules that compare it to other
      commits do not apply, and neither does ${magenta`useSignedCommits`}, as Git signs
      the commit afterwards. ${magenta`--default-branch`} has no effect.

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
	const formattedIssues = formatConfigurationIssues(jsonConfiguration)

	if (formattedIssues !== "") {
		printCommandLineWarning(formattedIssues)
	}

	return deepMerge(defaultConfiguration, jsonConfiguration)
}

async function checkPendingCommit(
	messageFilePath: string,
	configuration: Configuration,
): Promise<ExitCode> {
	const crudeCommits = await getGitPendingCrudeCommits(messageFilePath)

	return program(crudeCommits, configuration, {
		ruleLinkStyle: "hyperlink",
		getAdvice: (concerns) =>
			concerns.some(isMessageConcern) ? getEditAdvice(messageFilePath) : null,
	})
}

/**
 * Editing the message resolves concerns about the subject and the body lines,
 * but not concerns about the commit as a whole (e.g. merge commits) or the identities of the author and the committer.
 */
function isMessageConcern(concern: Concern): boolean {
	return concern.location === "subject" || concern.location === "body-line"
}

/**
 * Git keeps the message file after the `commit-msg` hook has rejected the commit.
 * The hook cannot see the options of the `git commit` command (e.g. `--amend`, `--all`, `--verbose`, or paths), so the user must repeat them.
 * The hook runs in the root directory of the repository, so resolve the path to make the advice work from any directory.
 */
function getEditAdvice(messageFilePath: string): string {
	const absolutePath = resolveAbsolutePath(messageFilePath)
	const quotedPath = `'${absolutePath.replaceAll("'", String.raw`'\''`)}'`

	return [
		`To edit the commit message, repeat the ${magenta`git commit`} command with the same options`,
		`(e.g. ${magenta`--amend`} or ${magenta`--all`}) and add ${magenta`--edit --file=${quotedPath}`}`,
	].join("\n")
}

async function checkBranchCommits(
	defaultBranch: string | null,
	configuration: Configuration,
): Promise<ExitCode> {
	const crudeCommits = await getGitBranchCrudeCommits(defaultBranch)
	return program(crudeCommits, configuration, { ruleLinkStyle: "hyperlink" })
}
