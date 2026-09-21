import { bold, gray as grey, red } from "ansis"
import { beforeEach, describe, expect, it } from "vitest"
import { fakeCrudeCommit } from "#commits/CrudeCommit.fakes.ts"
import { mockGitBranchCrudeCommits } from "#commits/git/GetGitBranchCrudeCommits.fakes.ts"
import { commandLineProgram, getHelpText } from "#programs/CommandLineProgram.ts"
import { fakeCommitSha } from "#types/CommitSha.fakes.ts"
import {
	EXIT_CODE_GENERAL_ERROR,
	EXIT_CODE_INVALID_CONFIGURATION,
	EXIT_CODE_RULE_VIOLATION,
	EXIT_CODE_SUCCESS,
	type ExitCode,
} from "#types/ExitCode.ts"
import type { JsonValue } from "#types/JsonValue.ts"
import { mockFile, mockJsonFile, mockNonexistingFile } from "#utilities/files/Files.fakes.ts"
import { mockGitCommand } from "#utilities/git/cli/RunGitCommand.fakes.ts"
import { printCommandLineError, printMessage } from "#utilities/logging/Logger.ts"
import { mockPackageVersion } from "#utilities/package/Package.fakes.ts"

describe("the help text", () => {
	it("is a list of program arguments and options", () => {
		expect(getHelpText()).toBe("Usage: comet [options]")
	})

	it("fits within a window of 80 characters", () => {
		const lines = getHelpText().split("\n")

		for (const line of lines) {
			expect(line.length).toBeLessThanOrEqual(80)
		}
	})
})

describe.each`
	args
	${["--help"]}
	${["-h"]}
	${["--config", "configs/comet.jsonc", "--help"]}
	${["-h", "-v"]}
`("when the args of $args contain the '--help'/'-h' flag", (props: { args: Array<string> }) => {
	let exitCode: ExitCode

	beforeEach(async () => {
		exitCode = await commandLineProgram(props.args)
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("prints a help text with usage instructions", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(getHelpText())
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe.each`
	args                                                | version
	${["--version"]}                                    | ${"1.0.0"}
	${["-v"]}                                           | ${"2.0.8"}
	${["--config", "configs/comet.jsonc", "--version"]} | ${"3.2.0-beta.1"}
`(
	"when the args of $args contain the '--version'/'-v' flag and the tool version in the 'package.json' file is $version",
	(props: { args: Array<string>; version: string }) => {
		let exitCode: ExitCode

		beforeEach(async () => {
			mockPackageVersion(props.version)
			exitCode = await commandLineProgram(props.args)
		})

		it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
			expect(exitCode).toBe(EXIT_CODE_SUCCESS)
		})

		it(`prints the tool version of '${props.version}'`, () => {
			expect(printMessage).toHaveBeenCalledExactlyOnceWith(props.version)
			expect(printCommandLineError).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	invalidArgs                                 | expectedError
	${["-c"]}                                   | ${"Unknown option '-c'"}
	${["--check"]}                              | ${"Unknown option '--check'"}
	${["--skip-commits"]}                       | ${"Unknown option '--skip-commits'"}
	${["--config"]}                             | ${"'--config' requires at least 1 argument, but got 0"}
	${["--config", "--config"]}                 | ${"'--config' requires at least 1 argument, but got 0"}
	${["--config", "--skip-missing-configs"]}   | ${"'--config' requires at least 1 argument, but got 0"}
	${["--default-branch"]}                     | ${"'--default-branch' requires exactly 1 argument, but got 0"}
	${["--default-branch", "main", "master"]}   | ${"'--default-branch' requires exactly 1 argument, but got 2"}
	${["--skip-missing-configs", "unexpected"]} | ${"'--skip-missing-configs' requires exactly 0 arguments, but got 1"}
`(
	"when the args are $invalidArgs",
	(props: { invalidArgs: Array<string>; expectedError: string }) => {
		let exitCode: ExitCode

		beforeEach(async () => {
			exitCode = await commandLineProgram(props.invalidArgs)
		})

		it(`exits with ${EXIT_CODE_INVALID_CONFIGURATION}`, () => {
			expect(exitCode).toBe(EXIT_CODE_INVALID_CONFIGURATION)
		})

		it("prints an error message", () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printCommandLineError).toHaveBeenCalledExactlyOnceWith(props.expectedError)
		})
	},
)

describe("when the default Git branch cannot be determined", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGitCommand("remote", { output: "" })
		mockGitCommand("rev-parse --verify --quiet main", { exitCode: 1 })
		mockGitCommand("rev-parse --verify --quiet master", { exitCode: 1 })
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints an error message that describes the unexpected Git state", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).toHaveBeenCalledExactlyOnceWith(
			"Expected a default remote branch (e.g. 'origin/main') or a local branch named 'main' or 'master'",
		)
	})
})

describe("when '--default-branch' is specified", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGitCommand("--no-pager log --format=raw --no-color upstream/release..HEAD", { output: "" })
		exitCode = await commandLineProgram(["--default-branch", "upstream/release"])
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("uses the provided branch without determining a branch automatically", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when the 'git remote' command raises an error", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGitCommand("remote", { exitCode: 1 })
		mockGitCommand("rev-parse --verify --quiet main", { exitCode: 1 })
		mockGitCommand("rev-parse --verify --quiet master", { exitCode: 1 })
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints the error message raised by the local Git client", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).toHaveBeenCalledExactlyOnceWith(
			"Command 'git remote' failed with exit code 1",
		)
	})
})

describe("when the 'git rev-parse' command raises an error", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGitCommand("remote", { output: "origin" })
		mockGitCommand("rev-parse --abbrev-ref origin/HEAD", { exitCode: 128 })
		mockGitCommand("fetch", { output: "" })
		mockGitCommand("rev-parse --abbrev-ref --symbolic-full-name @{u}", { exitCode: 128 })
		mockGitCommand("rev-parse --verify --quiet main", { exitCode: 1 })
		mockGitCommand("rev-parse --verify --quiet master", { exitCode: 1 })
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints an error message that describes the unexpected Git state", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).toHaveBeenCalledExactlyOnceWith(
			"Expected a default remote branch (e.g. 'origin/main') or a local branch named 'main' or 'master'",
		)
	})
})

describe("when the 'git log' command raises an error", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGitCommand("remote", { output: "origin" })
		mockGitCommand("rev-parse --abbrev-ref origin/HEAD", { output: "origin/main" })
		mockGitCommand("--no-pager log --format=raw --no-color origin/main..HEAD", { exitCode: 31 })
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints the error message raised by the local Git client", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).toHaveBeenCalledExactlyOnceWith(
			"Command 'git --no-pager log --format=raw --no-color origin/main..HEAD' failed with exit code 31",
		)
	})
})

describe("when there are no commits in the default configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGitBranchCrudeCommits([])
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there is 1 commit that raises no concerns in the default configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGitBranchCrudeCommits([fakeCrudeCommit({ message: "Release the robot butler" })])
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are 4 commits that raise no concerns in the default configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({ message: "Establish the repository" }),
			fakeCrudeCommit({ message: "Enable the coffee machine integration tests" }),
			fakeCrudeCommit({ message: "Drop the legacy spaghetti tower module" }),
			fakeCrudeCommit({ message: "Help fix the annoying bug" }),
		])
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there is 1 commit that raises concerns in the default configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				sha: "98634c15dcab46ae1f23ca87a8d66467093415b3",
				message: "fix!",
			}),
		])
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`98634c1`} fix!
        ${red`┬`}
        ${red`╰─ The first letter in subject lines must be in uppercase.`}
        ${red`   (useCapitalisedSubjectLines)`}

${grey`98634c1`} fix!
        ${red`─┬─`}
         ${red`╰─ Subject lines must contain at least two words.`}
         ${red`   (noSingleWordSubjectLines)`}

${grey`98634c1`} fix!
           ${red`┬`}
           ${red`╰─ Subject lines must not end with punctuation.`}
           ${red`   (noUnexpectedPunctuation)`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are 2 commits that raise concerns in the default configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				sha: "61a95da418709622ebb04c6bc08977c96ea915b5",
				message: "Document the tea set\n\nA  small note",
			}),
			fakeCrudeCommit({
				sha: "d677c3124551246b6e8b65c7708538e93d3f2a19",
				message:
					"Review the tea set\n\nThis body line is intentionally longer than the default seventy-two character wrapping limit",
			}),
		])
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`61a95da`} Document the tea set
    ${grey`╭──`}
  ${grey`1 │ `}
${red`•`} ${grey`${bold`2`} │`} A  small note
    ${grey`· `} ${red`┬─`}
    ${grey`· `} ${red`╰─ Message bodies must not contain excessive whitespace.`}
    ${grey`· `} ${red`   (noExcessiveWhitespace)`}
    ${grey`╰──`}

${grey`d677c31`} Review the tea set
    ${grey`╭──`}
  ${grey`1 │ `}
${red`•`} ${grey`${bold`2`} │`} This body line is intentionally longer than the default seventy-two character wrapping limit
    ${grey`· `}                                                                        ${red`──────────┬─────────`}
    ${grey`· `}                               ${red`Message body lines must not exceed 72 characters. ─╯`}
    ${grey`· `}                               ${red`(useLineWrapping)`}
    ${grey`╰──`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are 3 commits that raise concerns in the default configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				sha: "335aee65f7a82c2f85771f45d9cfec47efab1547",
				message: "polish the tea set",
			}),
			fakeCrudeCommit({
				sha: "6f8dafa2608a817129c2ff899c5122eb69ba45cb",
				message: "Document the tea set\n\nA  small note",
			}),
			fakeCrudeCommit({
				sha: "b58de17b4d44256ffaa44a1068d743288fc6beda",
				message: "Sign the pantry inventory",
				signature: "",
			}),
		])
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`335aee6`} polish the tea set
        ${red`┬`}
        ${red`╰─ The first letter in subject lines must be in uppercase.`}
        ${red`   (useCapitalisedSubjectLines)`}

${grey`6f8dafa`} Document the tea set
    ${grey`╭──`}
  ${grey`1 │ `}
${red`•`} ${grey`${bold`2`} │`} A  small note
    ${grey`· `} ${red`┬─`}
    ${grey`· `} ${red`╰─ Message bodies must not contain excessive whitespace.`}
    ${grey`· `} ${red`   (noExcessiveWhitespace)`}
    ${grey`╰──`}

${grey`b58de17`} Sign the pantry inventory
      ${red`╭──────────────────────────`}
      ${red`╰─ Commits must be signed cryptographically with a signing key.`}
      ${red`   (useSignedCommits)`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are 6 commits where 4 of them raise concerns in the default configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				sha: "7e63a377f295406fea7cfd5ea4dbe9aecc88e142",
				message: "polish the tea set!",
			}),
			fakeCrudeCommit({ message: "Refactor the teapot module" }),
			fakeCrudeCommit({
				sha: "3cfe8b3d1909b1ce937fbf9dc7fc443f675c7ee2",
				message: "Document the tea set\n\nA  small note",
			}),
			fakeCrudeCommit({
				sha: "41a0e1d9c151ac41962836e4f02b2b47d39ffd61",
				message:
					"Review the tea set\nWell well well would you look at this.\n\nThis body line is _also_ a bit longer than the default seventy-two character wrapping limit\nWe'll have to fix that, don't we?",
				signature: "",
			}),
			fakeCrudeCommit({
				sha: "7f811b212b8e79d85a3cab7acb276942c565fb4a",
				message: "Merge the old tea ledger",
				parents: [fakeCommitSha(), fakeCommitSha()],
			}),
			fakeCrudeCommit({ message: "Sign the pantry inventory" }),
		])
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`7e63a37`} polish the tea set!
        ${red`┬`}
        ${red`╰─ The first letter in subject lines must be in uppercase.`}
        ${red`   (useCapitalisedSubjectLines)`}

${grey`7e63a37`} polish the tea set!
                          ${red`┬`}
                          ${red`╰─ Subject lines must not end with punctuation.`}
                          ${red`   (noUnexpectedPunctuation)`}

${grey`3cfe8b3`} Document the tea set
    ${grey`╭──`}
  ${grey`1 │ `}
${red`•`} ${grey`${bold`2`} │`} A  small note
    ${grey`· `} ${red`┬─`}
    ${grey`· `} ${red`╰─ Message bodies must not contain excessive whitespace.`}
    ${grey`· `} ${red`   (noExcessiveWhitespace)`}
    ${grey`╰──`}

${grey`41a0e1d`} Review the tea set
      ${red`╭───────────────────`}
      ${red`╰─ Commits must be signed cryptographically with a signing key.`}
      ${red`   (useSignedCommits)`}

${grey`41a0e1d`} Review the tea set
    ${grey`╭──`}
${red`•`} ${grey`${bold`1`} │`} Well well well would you look at this.
    ${grey`· `}${red`┬`}
    ${grey`· `}${red`╰─ Subject lines and message bodies must be separated by exactly one empty line.`}
    ${grey`· `}${red`   (useEmptyLineBeforeBodyLines)`}
  ${grey`2 │ `}
    ${grey`╰──`}

${grey`41a0e1d`} Review the tea set
    ${grey`╭──`}
  ${grey`2 │ `}
${red`•`} ${grey`${bold`3`} │`} This body line is _also_ a bit longer than the default seventy-two character wrapping limit
    ${grey`· `}                                                                        ${red`─────────┬─────────`}
    ${grey`· `}                              ${red`Message body lines must not exceed 72 characters. ─╯`}
    ${grey`· `}                              ${red`(useLineWrapping)`}
  ${grey`4 │ We'll have to fix that, don't we?`}
    ${grey`╰──`}

${grey`7f811b2`} Merge the old tea ledger
      ${red`╭─────────────────────────`}
      ${red`╰─ Merge commits are not allowed.`}
      ${red`   (noMergeCommits)`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe.each`
	configuration                  | expectedError
	${[{ rules: {}, tokens: {} }]} | ${`Failed to parse 'comet.json' as a Comet configuration: The configuration must be a JSON object, but it is an array: [ { "rules": {}, "tokens": {} …`}
	${{ rules: 31 }}               | ${"Failed to parse 'comet.json' as a Comet configuration: 'rules' must be an object, but it is a number: 31"}
	${{ extends: 1000 }}           | ${"Failed to parse 'comet.json' as a Comet configuration: 'extends' must be a string, but it is a number: 1000"}
`(
	"when the default 'comet.json' configuration file is invalid due to $configuration",
	(props: { configuration: JsonValue; expectedError: string }) => {
		let exitCode: ExitCode

		beforeEach(async () => {
			mockJsonFile("./comet.json", props.configuration)
			exitCode = await commandLineProgram([])
		})

		it(`exits with ${EXIT_CODE_INVALID_CONFIGURATION}`, () => {
			expect(exitCode).toBe(EXIT_CODE_INVALID_CONFIGURATION)
		})

		it("prints an error message", () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printCommandLineError).toHaveBeenCalledExactlyOnceWith(props.expectedError)
		})
	},
)

describe("when the default 'comet.jsonc' configuration file is invalid", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockFile(
			"comet.jsonc",
			// language=json5
			`{
	// This was accidentally changed from an object while updating the policy.
	"rules": 31
}`,
		)
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_INVALID_CONFIGURATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_INVALID_CONFIGURATION)
	})

	it("prints the configuration error", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).toHaveBeenCalledExactlyOnceWith(
			"Failed to parse 'comet.jsonc' as a Comet configuration: 'rules' must be an object, but it is a number: 31",
		)
	})
})

describe.each`
	path                         | expectedError
	${"comet.local.json"}        | ${"Failed to read 'comet.local.json': File not found"}
	${"./configs/missing.jsonc"} | ${"Failed to read 'configs/missing.jsonc': File not found"}
	${".github/comet.base.json"} | ${"Failed to read '.github/comet.base.json': File not found"}
`(
	"when '--config' points to a non-existing configuration file $path",
	(props: { path: string; expectedError: string }) => {
		describe("and '--skip-missing-configs' is not enabled", () => {
			let exitCode: ExitCode

			beforeEach(async () => {
				mockNonexistingFile(props.path)
				exitCode = await commandLineProgram(["--config", props.path])
			})

			it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
				expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
			})

			it("prints an error message", () => {
				expect(printMessage).not.toHaveBeenCalled()
				expect(printCommandLineError).toHaveBeenCalledExactlyOnceWith(props.expectedError)
			})
		})

		describe("and '--skip-missing-configs' is enabled", () => {
			let exitCode: ExitCode

			beforeEach(async () => {
				mockNonexistingFile(props.path)
				mockGitBranchCrudeCommits([])
				exitCode = await commandLineProgram(["--skip-missing-configs", "--config", props.path])
			})

			it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
				expect(exitCode).toBe(EXIT_CODE_SUCCESS)
			})

			it("skips the missing configuration", () => {
				expect(printMessage).not.toHaveBeenCalled()
				expect(printCommandLineError).not.toHaveBeenCalled()
			})
		})
	},
)

describe.each`
	configuration                  | expectedError
	${[{ rules: {}, tokens: {} }]} | ${`Failed to parse 'configs/comet.json' as a Comet configuration: The configuration must be a JSON object, but it is an array: [ { "rules": {}, "tokens": {} …`}
	${{ rules: 31 }}               | ${"Failed to parse 'configs/comet.json' as a Comet configuration: 'rules' must be an object, but it is a number: 31"}
	${{ extends: 1000 }}           | ${"Failed to parse 'configs/comet.json' as a Comet configuration: 'extends' must be a string, but it is a number: 1000"}
	${{ extends: true }}           | ${"Failed to parse 'configs/comet.json' as a Comet configuration: 'extends' must be a string, but it is a boolean: true"}
	${{ whatIsThis: true }}        | ${"Failed to parse 'configs/comet.json' as a Comet configuration: 'whatIsThis' is not a valid option"}
	${"Release the robot butler"}  | ${"Failed to parse 'configs/comet.json' as a Comet configuration: The configuration must be a JSON object, but it is a string: Release the robot butler"}
`(
	"when '--config' points to a custom JSON configuration file that is invalid due to $configuration",
	(props: { configuration: JsonValue; expectedError: string }) => {
		let exitCode: ExitCode

		beforeEach(async () => {
			mockJsonFile("configs/comet.json", props.configuration)
			exitCode = await commandLineProgram(["--config", "configs/comet.json"])
		})

		it(`exits with ${EXIT_CODE_INVALID_CONFIGURATION}`, () => {
			expect(exitCode).toBe(EXIT_CODE_INVALID_CONFIGURATION)
		})

		it("prints the configuration error", () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printCommandLineError).toHaveBeenCalledExactlyOnceWith(props.expectedError)
		})
	},
)

describe("when '--config' points to a custom JSONC configuration file that is invalid", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockFile(
			"configs/team.jsonc",
			// language=json5
			`{
	"rules": false /* This invalid setting should identify the custom configuration path. */
}`,
		)
		exitCode = await commandLineProgram(["--config", "configs/team.jsonc"])
	})

	it(`exits with ${EXIT_CODE_INVALID_CONFIGURATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_INVALID_CONFIGURATION)
	})

	it("prints the configuration error", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).toHaveBeenCalledExactlyOnceWith(
			"Failed to parse 'configs/team.jsonc' as a Comet configuration: 'rules' must be an object, but it is a boolean: false",
		)
	})
})

describe("when there are no commits in the custom 'comet.json' configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("comet.json", {
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 3 },
				},
				noRepeatedSubjectLines: "error",
				useIssueLinks: {
					level: "error",
					options: { position: "suffix" },
				},
			},
			tokens: {
				issueLinks: {
					prefixes: ["COMET-", "#"],
					wildcards: ["[no-issue]", "[parking-lot]"],
				},
			},
		})
		mockGitBranchCrudeCommits([])
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there is 1 commit that raises no concerns in the custom 'comet.json' configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("comet.json", {
			rules: {
				noRepeatedSubjectLines: "error",
				useImperativeSubjectLines: {
					level: "error",
					options: { whitelist: ["deploy"] },
				},
				useIssueLinks: {
					level: "error",
					options: { position: "prefix" },
				},
			},
			tokens: {
				issueLinks: {
					prefixes: ["BOT-"],
					wildcards: ["[maintenance]"],
				},
			},
		})
		mockGitBranchCrudeCommits([fakeCrudeCommit({ message: "BOT-71 Deploy the robot butler" })])
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are 3 commits that raise no concerns in the custom 'comet.json' configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("comet.json", {
			rules: {
				noRestrictedTrailers: {
					level: "error",
					options: { restrictedKeys: ["Reviewed-by", "Refs"] },
				},
				useIssueLinks: {
					level: "error",
					options: { position: "anywhere" },
				},
				useLineWrapping: {
					level: "error",
					options: { maxLength: 30 },
				},
			},
			tokens: {
				issueLinks: {
					prefixes: ["OPS-", "#"],
					wildcards: ["[maintenance]"],
				},
			},
		})
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				message: "OPS-17 Calibrate the arcade crane\n\nThe prizes stay put.",
			}),
			fakeCrudeCommit({
				message: "Update the lobby display #8\n\nUse `Vite+` as its voice.",
			}),
			fakeCrudeCommit({
				message: "Restore the keycards [maintenance]\n\nThe bell rings softly.",
			}),
		])
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there is 1 commit that raises concerns in the custom 'comet.json' configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("comet.json", {
			rules: {
				noRestrictedTrailers: {
					level: "error",
					options: { restrictedKeys: ["Co-authored-by", "Reviewed-by"] },
				},
			},
		})
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				sha: "98634c15dcab46ae1f23ca87a8d66467093415b3",
				message: "Authenticate the library cards\n\nCo-authored-by: Ada Lovelace <ada@example.com>",
			}),
		])
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`98634c1`} Authenticate the library cards
    ${grey`╭──`}
  ${grey`1 │ `}
${red`•`} ${grey`${bold`2`} │`} Co-authored-by: Ada Lovelace <ada@example.com>
    ${grey`· `}${red`──────┬───────`}
    ${grey`· `}      ${red`╰─ Message bodies must not contain disallowed trailers.`}
    ${grey`· `}      ${red`   (noRestrictedTrailers)`}
    ${grey`· `}      ${red`   `}
    ${grey`· `}      ${red`   Disallowed trailers:`}
    ${grey`· `}      ${red`     ∙ Co-authored-by`}
    ${grey`· `}      ${red`     ∙ Reviewed-by`}
    ${grey`· `}      ${red`   `}
    ${grey`╰──`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are 2 commits where 1 of them raises concerns in the custom 'comet.json' configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("comet.json", {
			rules: {
				useAuthorNamePatterns: {
					level: "error",
					options: { patterns: ["Leonardo da Vinci", "Ada Lovelace"] },
				},
			},
		})
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				sha: "61a95da418709622ebb04c6bc08977c96ea915b5",
				message: "Map the paper trail",
			}),
			fakeCrudeCommit({
				authorName: "Ada Lovelace",
				sha: "d677c3124551246b6e8b65c7708538e93d3f2a19",
				message: "Install the brass telescope",
			}),
		])
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`61a95da`} Map the paper trail
${grey`╰─ authored by:`} Master Splinter
              ${red`╭────────────────`}
              ${red`╰─ Names of commit authors must match an accepted pattern.`}
              ${red`   (useAuthorNamePatterns)`}
              ${red`   `}
              ${red`   Accepted patterns:`}
              ${red`     ∙ Leonardo da Vinci`}
              ${red`     ∙ Ada Lovelace`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are 4 commits where 3 of them raise concerns in the custom 'comet.json' configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("comet.json", {
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 1 },
				},
			},
		})
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				sha: "335aee65f7a82c2f85771f45d9cfec47efab1547",
				message: "Open the bakery dashboard",
			}),
			fakeCrudeCommit({
				sha: "6f8dafa2608a817129c2ff899c5122eb69ba45cb",
				message: "Add the cinnamon telemetry",
			}),
			fakeCrudeCommit({
				sha: "b58de17b4d44256ffaa44a1068d743288fc6beda",
				message: "Wire the oat milk alert",
			}),
			fakeCrudeCommit({
				sha: "9f1a1b2c3d4e5f678901234567890123456789ab",
				message: "Test the emergency toaster",
			}),
		])
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`6f8dafa`} Add the cinnamon telemetry
      ${red`╭───────────────────────────`}
      ${red`╰─ Branches must not contain more than 1 commit.`}
      ${red`   (noExcessiveCommitsPerBranch)`}

${grey`b58de17`} Wire the oat milk alert
      ${red`╭────────────────────────`}
      ${red`╰─ Branches must not contain more than 1 commit.`}
      ${red`   (noExcessiveCommitsPerBranch)`}

${grey`9f1a1b2`} Test the emergency toaster
      ${red`╭───────────────────────────`}
      ${red`╰─ Branches must not contain more than 1 commit.`}
      ${red`   (noExcessiveCommitsPerBranch)`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are 5 commits that raise concerns in the custom 'comet.json' configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("comet.json", {
			rules: {
				useConciseSubjectLines: {
					level: "error",
					options: { maxLength: 22 },
				},
			},
		})
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				sha: "3cfe8b3d1909b1ce937fbf9dc7fc443f675c7ee2",
				message: "Calibrate the midnight bell",
			}),
			fakeCrudeCommit({
				sha: "41a0e1d9c151ac41962836e4f02b2b47d39ffd61",
				message: "Document the curious dial",
			}),
			fakeCrudeCommit({
				sha: "7f811b212b8e79d85a3cab7acb276942c565fb4a",
				message: "Rehearse the evacuation waltz",
			}),
			fakeCrudeCommit({
				sha: "a43a3f3359559a13d1e6fc05b7db7b661a4ab4f2",
				message: "Replace the ceremonial switch",
			}),
			fakeCrudeCommit({
				sha: "c0ffee1234567890abcdef1234567890abcdef12",
				message: "Untangle the improbable cables",
			}),
		])
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`3cfe8b3`} Calibrate the midnight bell
                              ${red`──┬──`}
                                ${red`╰─ Subject lines must not exceed 22 characters.`}
                                ${red`   (useConciseSubjectLines)`}

${grey`41a0e1d`} Document the curious dial
                              ${red`─┬─`}
                               ${red`╰─ Subject lines must not exceed 22 characters.`}
                               ${red`   (useConciseSubjectLines)`}

${grey`7f811b2`} Rehearse the evacuation waltz
                              ${red`───┬───`}
                                 ${red`╰─ Subject lines must not exceed 22 characters.`}
                                 ${red`   (useConciseSubjectLines)`}

${grey`a43a3f3`} Replace the ceremonial switch
                              ${red`───┬───`}
                                 ${red`╰─ Subject lines must not exceed 22 characters.`}
                                 ${red`   (useConciseSubjectLines)`}

${grey`c0ffee1`} Untangle the improbable cables
                              ${red`───┬────`}
                                 ${red`╰─ Subject lines must not exceed 22 characters.`}
                                 ${red`   (useConciseSubjectLines)`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there is 1 commit that raises no concerns in the custom 'comet.jsonc' configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockFile(
			"comet.jsonc",
			// language=json5
			`{
	// Release commit subjects are intentionally lower-case in this repository.
	"rules": {
		"useCapitalisedSubjectLines": "off"
	}
}`,
		)
		mockGitBranchCrudeCommits([fakeCrudeCommit({ message: "release the robot butler" })])
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are 3 commits where 2 of them raise concerns in the custom 'comet.jsonc' configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockFile(
			"comet.jsonc",
			// language=json5
			`{
	// Keep the branch small enough for the release train to stay reviewable.
	"rules": {
		"noExcessiveCommitsPerBranch": {
			"level": "error",
			"options": { "maxCommits": 1 }
		}
	}
}`,
		)
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				sha: "335aee65f7a82c2f85771f45d9cfec47efab1547",
				message: "Open the bakery dashboard",
			}),
			fakeCrudeCommit({
				sha: "6f8dafa2608a817129c2ff899c5122eb69ba45cb",
				message: "Add the cinnamon telemetry",
			}),
			fakeCrudeCommit({
				sha: "b58de17b4d44256ffaa44a1068d743288fc6beda",
				message: "Wire the oat milk alert",
			}),
		])
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`6f8dafa`} Add the cinnamon telemetry
      ${red`╭───────────────────────────`}
      ${red`╰─ Branches must not contain more than 1 commit.`}
      ${red`   (noExcessiveCommitsPerBranch)`}

${grey`b58de17`} Wire the oat milk alert
      ${red`╭────────────────────────`}
      ${red`╰─ Branches must not contain more than 1 commit.`}
      ${red`   (noExcessiveCommitsPerBranch)`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when both 'comet.json' and 'comet.jsonc' are present", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("comet.json", {
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 2 },
				},
				useAuthorNamePatterns: {
					level: "error",
					options: {
						patterns: [
							String.raw`\p{Lu}.*\s.+`,
							String.raw`dependabot\[bot\]`,
							String.raw`renovate\[bot\]`,
						],
					},
				},
				useConciseSubjectLines: {
					level: "error",
					options: { maxLength: 25 },
				},
				useLineWrapping: {
					level: "error",
					options: { maxLength: 24 },
				},
			},
		})
		mockFile(
			"comet.jsonc",
			// language=json5
			`{
	// These settings should be ignored in favour of comet.json.
	"rules": {
		/* The JSONC values differ deliberately so precedence is observable. */
		"noExcessiveWhitespace": "off",
		"noExcessiveCommitsPerBranch": {
			"level": "error",
			"options": { "maxCommits": 3 }
		},
		"useAuthorNamePatterns": {
			"level": "error",
			"options": { "patterns": ["anonymous"] }
		},
		"useConciseSubjectLines": {
			"level": "error",
			"options": { "maxLength": 50 }
		},
		"useLineWrapping": {
			"level": "error",
			"options": { "maxLength": 80 }
		}
	}
}`,
		)
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				authorName: "anonymous",
				sha: "e6f1b4a3d5c27980e1f4a6b7c9d1e3f4a5b6c7d8",
				message: "Document the extremely important tea ceremony",
			}),
			fakeCrudeCommit({
				sha: "f7a2c5b4e6d38091f2a5b7c8d0e2f4a5b6c7d8e9",
				message:
					"Review the tiny blueprint\n\nA line that is deliberately much longer than twenty-four characters to fit the rendered concern annotation.\nShort note.\nNote with  spaces.\nFinal note.",
			}),
			fakeCrudeCommit({
				sha: "a8b3d6c5f7e49102a3b6c8d9e1f3a5b6c7d8e9f0",
				message: "Merge the old tea ledger",
			}),
		])
		exitCode = await commandLineProgram([])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("makes 'comet.json' take precedence", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`e6f1b4a`} Document the extremely important tea ceremony
${grey`╰─ authored by:`} anonymous
              ${red`╭──────────`}
              ${red`╰─ Names of commit authors must match an accepted pattern.`}
              ${red`   (useAuthorNamePatterns)`}
              ${red`   `}
              ${red`   Accepted patterns:`}
              ${red`     ∙ \\p{Lu}.*\\s.+`}
              ${red`     ∙ dependabot\\[bot\\]`}
              ${red`     ∙ renovate\\[bot\\]`}

${grey`e6f1b4a`} Document the extremely important tea ceremony
                                 ${red`─────────┬──────────`}
                                          ${red`╰─ Subject lines must not exceed 25 characters.`}
                                          ${red`   (useConciseSubjectLines)`}

${grey`f7a2c5b`} Review the tiny blueprint
    ${grey`╭──`}
  ${grey`1 │ `}
${red`•`} ${grey`${bold`2`} │`} A line that is deliberately much longer than twenty-four characters to fit the rendered concern annotation.
    ${grey`· `}                        ${red`─────────────────────────────────────────┬─────────────────────────────────────────`}
    ${grey`· `}              ${red`Message body lines must not exceed 24 characters. ─╯`}
    ${grey`· `}              ${red`(useLineWrapping)`}
  ${grey`3 │ Short note.`}
    ${grey`╰──`}

${grey`f7a2c5b`} Review the tiny blueprint
    ${grey`╭──`}
  ${grey`3 │ Short note.`}
${red`•`} ${grey`${bold`4`} │`} Note with  spaces.
    ${grey`· `}         ${red`┬─`}
    ${grey`· `}         ${red`╰─ Message bodies must not contain excessive whitespace.`}
    ${grey`· `}         ${red`   (noExcessiveWhitespace)`}
  ${grey`5 │ Final note.`}
    ${grey`╰──`}

${grey`a8b3d6c`} Merge the old tea ledger
      ${red`╭─────────────────────────`}
      ${red`╰─ Branches must not contain more than 2 commits.`}
      ${red`   (noExcessiveCommitsPerBranch)`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are no commits in the custom configuration from 'configs/strict-comet.json'", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("comet.json", {
			rules: {
				noRepeatedSubjectLines: "off",
				useCapitalisedSubjectLines: "error",
				useIssueLinks: "off",
			},
			tokens: {
				issueLinks: {
					prefixes: ["OTHER-"],
				},
			},
		})
		mockJsonFile("configs/strict-comet.json", {
			rules: {
				noRestrictedTrailers: {
					level: "error",
					options: { restrictedKeys: ["Signed-off-by"] },
				},
				noRevertRevertCommits: "error",
				useIssueLinks: {
					level: "error",
					options: { position: "suffix" },
				},
			},
			tokens: {
				issueLinks: {
					prefixes: ["DEV-"],
					wildcards: ["[not-planned]"],
				},
			},
		})
		mockGitBranchCrudeCommits([])
		exitCode = await commandLineProgram(["--config", "configs/strict-comet.json"])
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there is 1 commit that raises no concerns in the custom configuration from 'configs/strict-comet.json'", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("comet.json", {
			rules: {
				noRepeatedSubjectLines: "off",
				useCapitalisedSubjectLines: "error",
				useIssueLinks: "off",
			},
			tokens: {
				issueLinks: {
					prefixes: ["OTHER-"],
				},
			},
		})
		mockJsonFile("configs/strict-comet.json", {
			rules: {
				useAuthorEmailPatterns: {
					level: "error",
					options: {
						patterns: [String.raw`\d+\+.+@users\.noreply\.github\.com`],
					},
				},
				useIssueLinks: {
					level: "error",
					options: { position: "prefix" },
				},
			},
			tokens: {
				issueLinks: {
					prefixes: ["CHORE-"],
					wildcards: ["[maintenance]"],
				},
			},
		})
		mockGitBranchCrudeCommits([fakeCrudeCommit({ message: "CHORE-42 Repair the lunar calendar" })])
		exitCode = await commandLineProgram(["--config", "configs/strict-comet.json"])
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are 7 commits that raise no concerns in the custom configuration from 'configs/strict-comet.json'", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("comet.json", {
			rules: {
				noRepeatedSubjectLines: "off",
				useCapitalisedSubjectLines: "error",
				useIssueLinks: "off",
			},
			tokens: {
				issueLinks: {
					prefixes: ["OTHER-"],
				},
			},
		})
		mockJsonFile("configs/strict-comet.json", {
			rules: {
				noRepeatedSubjectLines: "error",
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 4 },
				},
				noMergeCommits: "off",
				noSquashMarkers: "off",
			},
		})
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({ message: "Map the odd socks drawer" }),
			fakeCrudeCommit({ message: "fixup! Map the odd socks drawer" }),
			fakeCrudeCommit({
				message: "Merge branch 'main' into feature/odd-socks",
				parents: [fakeCommitSha(), fakeCommitSha()],
			}),
			fakeCrudeCommit({ message: "Add the cardigan forecast" }),
			fakeCrudeCommit({ message: "squash! Make the program less theatrical" }),
			fakeCrudeCommit({ message: "Tune the lint whistle" }),
			fakeCrudeCommit({ message: "Polish the biscuit dashboard" }),
		])
		exitCode = await commandLineProgram(["--config", "configs/strict-comet.json"])
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there is 1 commit that raises concerns in the custom configuration from 'configs/strict-comet.json'", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("comet.json", {
			rules: {
				noRepeatedSubjectLines: "off",
				useCapitalisedSubjectLines: "error",
				useIssueLinks: "off",
			},
			tokens: {
				issueLinks: {
					prefixes: ["OTHER-"],
				},
			},
		})
		mockJsonFile("configs/strict-comet.json", {
			rules: {
				useCommitterEmailPatterns: {
					level: "error",
					options: { patterns: [String.raw`.+@fastforward\.com`] },
				},
			},
		})
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				sha: "98634c15dcab46ae1f23ca87a8d66467093415b3",
				message: "Refactor the signal lantern",
			}),
		])
		exitCode = await commandLineProgram(["--config", "configs/strict-comet.json"])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`98634c1`} Refactor the signal lantern
${grey`╰─ committed by:`} 71091436+katanaturtle@users.noreply.github.com
               ${red`╭───────────────────────────────────────────────`}
               ${red`╰─ Email addresses of committers must match an accepted pattern.`}
               ${red`   (useCommitterEmailPatterns)`}
               ${red`   `}
               ${red`   Accepted patterns:`}
               ${red`     ∙ .+@fastforward\\.com`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are 2 commits that raise concerns in the custom configuration from 'configs/strict-comet.json'", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("comet.json", {
			rules: {
				noRepeatedSubjectLines: "off",
				useCapitalisedSubjectLines: "error",
				useIssueLinks: "off",
			},
			tokens: {
				issueLinks: {
					prefixes: ["OTHER-"],
				},
			},
		})
		mockJsonFile("configs/strict-comet.json", {
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 1 },
				},
				useAuthorNamePatterns: {
					level: "error",
					options: { patterns: ["Ada Lovelace"] },
				},
			},
		})
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				sha: "61a95da418709622ebb04c6bc08977c96ea915b5",
				message: "Patch the rain gauge",
			}),
			fakeCrudeCommit({
				authorName: "Ada Lovelace",
				sha: "d677c3124551246b6e8b65c7708538e93d3f2a19",
				message: "Tune the observatory clock",
			}),
		])
		exitCode = await commandLineProgram(["--config", "configs/strict-comet.json"])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`61a95da`} Patch the rain gauge
${grey`╰─ authored by:`} Master Splinter
              ${red`╭────────────────`}
              ${red`╰─ Names of commit authors must match an accepted pattern.`}
              ${red`   (useAuthorNamePatterns)`}
              ${red`   `}
              ${red`   Accepted patterns:`}
              ${red`     ∙ Ada Lovelace`}

${grey`d677c31`} Tune the observatory clock
      ${red`╭───────────────────────────`}
      ${red`╰─ Branches must not contain more than 1 commit.`}
      ${red`   (noExcessiveCommitsPerBranch)`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are 4 commits where 3 of them raise concerns in the custom configuration from 'configs/strict-comet.json'", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("comet.json", {
			rules: {
				noRepeatedSubjectLines: "off",
				useCapitalisedSubjectLines: "error",
				useIssueLinks: "off",
			},
			tokens: {
				issueLinks: {
					prefixes: ["OTHER-"],
				},
			},
		})
		mockJsonFile("configs/strict-comet.json", {
			rules: {
				noRestrictedTrailers: {
					level: "error",
					options: { restrictedKeys: ["Reviewed-by"] },
				},
				useLineWrapping: {
					level: "error",
					options: { maxLength: 32 },
				},
			},
		})
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				sha: "335aee65f7a82c2f85771f45d9cfec47efab1547",
				message: "Stabilise the ferry schedule\n\nThe crew has coffee.",
			}),
			fakeCrudeCommit({
				sha: "6f8dafa2608a817129c2ff899c5122eb69ba45cb",
				message: "Document the emergency lantern\n\nReviewed-by: Grace Hopper <grace@example.com>",
			}),
			fakeCrudeCommit({
				sha: "b58de17b4d44256ffaa44a1068d743288fc6beda",
				message:
					"Calibrate the wind tunnel\n\nThe flight path is deliberately long enough to outgrow the tiny configured wrapping limit.",
			}),
			fakeCrudeCommit({
				sha: "a43a3f3359559a13d1e6fc05b7db7b661a4ab4f2",
				message: "Archive the noisy bell!",
			}),
		])
		exitCode = await commandLineProgram(["--config", "configs/strict-comet.json"])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`6f8dafa`} Document the emergency lantern
    ${grey`╭──`}
  ${grey`1 │ `}
${red`•`} ${grey`${bold`2`} │`} Reviewed-by: Grace Hopper <grace@example.com>
    ${grey`· `}${red`─────┬─────`}
    ${grey`· `}     ${red`╰─ Message bodies must not contain disallowed trailers.`}
    ${grey`· `}     ${red`   (noRestrictedTrailers)`}
    ${grey`· `}     ${red`   `}
    ${grey`· `}     ${red`   Disallowed trailers:`}
    ${grey`· `}     ${red`     ∙ Reviewed-by`}
    ${grey`· `}     ${red`   `}
    ${grey`╰──`}

${grey`b58de17`} Calibrate the wind tunnel
    ${grey`╭──`}
  ${grey`1 │ `}
${red`•`} ${grey`${bold`2`} │`} The flight path is deliberately long enough to outgrow the tiny configured wrapping limit.
    ${grey`· `}                                ${red`─────────────────────────────┬────────────────────────────`}
    ${grey`· `}          ${red`Message body lines must not exceed 32 characters. ─╯`}
    ${grey`· `}          ${red`(useLineWrapping)`}
    ${grey`╰──`}

${grey`a43a3f3`} Archive the noisy bell!
                              ${red`┬`}
                              ${red`╰─ Subject lines must not end with punctuation.`}
                              ${red`   (noUnexpectedPunctuation)`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are 5 commits where 1 of them raises concerns in the custom configuration from 'configs/strict-comet.json'", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("comet.json", {
			rules: {
				noRepeatedSubjectLines: "off",
				useCapitalisedSubjectLines: "error",
				useIssueLinks: "off",
			},
			tokens: {
				issueLinks: {
					prefixes: ["OTHER-"],
				},
			},
		})
		mockJsonFile("configs/strict-comet.json", {
			rules: {
				noRevertRevertCommits: "error",
				useIssueLinks: {
					level: "error",
					options: { position: "prefix" },
				},
			},
			tokens: {
				issueLinks: {
					prefixes: ["INC-"],
					wildcards: ["[maintenance]"],
				},
			},
		})
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({ message: "INC-1 Repair the broken compass" }),
			fakeCrudeCommit({ message: "[maintenance] Polish the rain gauge" }),
			fakeCrudeCommit({ message: 'Revert "Move the stage lights"' }),
			fakeCrudeCommit({
				sha: "7f811b212b8e79d85a3cab7acb276942c565fb4a",
				message: 'Revert "Revert "Disable the alarm""',
			}),
			fakeCrudeCommit({ message: "INC-2 Update the vending machine" }),
		])
		exitCode = await commandLineProgram(["--config", "configs/strict-comet.json"])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`7f811b2`} Revert "Revert "Disable the alarm""
        ${red`──────┬───────`}
              ${red`╰─ Cherry-pick the original commit instead of reverting it over.`}
              ${red`   (noRevertRevertCommits)`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there is 1 commit that raises no concerns in the custom configuration from 'configs/team.jsonc'", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockFile(
			"configs/team.jsonc",
			// language=json5
			`{
	/* Automated release subjects retain the legacy lower-case convention. */
	"rules": {
		"useCapitalisedSubjectLines": "off"
	}
}`,
		)
		mockGitBranchCrudeCommits([fakeCrudeCommit({ message: "release the robot butler" })])
		exitCode = await commandLineProgram(["--config", "configs/team.jsonc"])
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are 3 commits where 2 of them raise concerns in the custom configuration from 'configs/team.jsonc'", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockFile(
			"configs/team.jsonc",
			// language=json5
			`{
	/* Only commits authored by Ada may enter the team branch. */
	"rules": {
		"useAuthorNamePatterns": {
			"level": "error",
			"options": { "patterns": ["Ada Lovelace"] }
		}
	}
}`,
		)
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				sha: "61a95da418709622ebb04c6bc08977c96ea915b5",
				message: "Map the paper trail",
			}),
			fakeCrudeCommit({
				authorName: "Ada Lovelace",
				sha: "d677c3124551246b6e8b65c7708538e93d3f2a19",
				message: "Install the brass telescope",
			}),
			fakeCrudeCommit({
				sha: "b58de17b4d44256ffaa44a1068d743288fc6beda",
				message: "Calibrate the wind tunnel",
			}),
		])
		exitCode = await commandLineProgram(["--config", "configs/team.jsonc"])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`61a95da`} Map the paper trail
${grey`╰─ authored by:`} Master Splinter
              ${red`╭────────────────`}
              ${red`╰─ Names of commit authors must match an accepted pattern.`}
              ${red`   (useAuthorNamePatterns)`}
              ${red`   `}
              ${red`   Accepted patterns:`}
              ${red`     ∙ Ada Lovelace`}

${grey`b58de17`} Calibrate the wind tunnel
${grey`╰─ authored by:`} Master Splinter
              ${red`╭────────────────`}
              ${red`╰─ Names of commit authors must match an accepted pattern.`}
              ${red`   (useAuthorNamePatterns)`}
              ${red`   `}
              ${red`   Accepted patterns:`}
              ${red`     ∙ Ada Lovelace`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there is 1 commit that raises concerns from the last configuration file in a custom sequence of configuration files", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("configs/base.json", {
			rules: {
				useAuthorNamePatterns: {
					level: "error",
					options: { patterns: ["Grace Hopper"] },
				},
			},
		})
		mockJsonFile("configs/team.json", {
			rules: {
				useAuthorNamePatterns: {
					level: "error",
					options: { patterns: ["Ada Lovelace"] },
				},
			},
		})
		mockJsonFile("configs/local.json", {
			rules: {
				useCommitterEmailPatterns: {
					level: "error",
					options: { patterns: [String.raw`.+@fastforward\.com`] },
				},
			},
		})
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				sha: "98634c15dcab46ae1f23ca87a8d66467093415b3",
				message: "Refactor the signal lantern",
			}),
		])
		exitCode = await commandLineProgram([
			"--config",
			"configs/base.json",
			"--config",
			"configs/team.json",
			"--config",
			"configs/local.json",
		])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`98634c1`} Refactor the signal lantern
${grey`╰─ committed by:`} 71091436+katanaturtle@users.noreply.github.com
               ${red`╭───────────────────────────────────────────────`}
               ${red`╰─ Email addresses of committers must match an accepted pattern.`}
               ${red`   (useCommitterEmailPatterns)`}
               ${red`   `}
               ${red`   Accepted patterns:`}
               ${red`     ∙ .+@fastforward\\.com`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are 2 commits that raise concerns from the second-to-last configuration file in a custom sequence of configuration files with the last file missing", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("configs/base.json", {
			rules: {
				useCommitterNamePatterns: {
					level: "error",
					options: { patterns: ["Release Robot"] },
				},
			},
		})
		mockJsonFile("configs/team.json", {
			rules: {
				useAuthorNamePatterns: {
					level: "error",
					options: { patterns: ["Ada Lovelace"] },
				},
			},
		})
		mockNonexistingFile("configs/local.json")
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				sha: "61a95da418709622ebb04c6bc08977c96ea915b5",
				message: "Map the paper trail",
			}),
			fakeCrudeCommit({
				sha: "b58de17b4d44256ffaa44a1068d743288fc6beda",
				message: "Calibrate the wind tunnel",
			}),
		])
		exitCode = await commandLineProgram([
			"--skip-missing-configs",
			"--config",
			"configs/base.json",
			"--config",
			"configs/team.json",
			"--config",
			"configs/local.json",
		])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`61a95da`} Map the paper trail
${grey`╰─ authored by:`} Master Splinter
              ${red`╭────────────────`}
              ${red`╰─ Names of commit authors must match an accepted pattern.`}
              ${red`   (useAuthorNamePatterns)`}
              ${red`   `}
              ${red`   Accepted patterns:`}
              ${red`     ∙ Ada Lovelace`}

${grey`b58de17`} Calibrate the wind tunnel
${grey`╰─ authored by:`} Master Splinter
              ${red`╭────────────────`}
              ${red`╰─ Names of commit authors must match an accepted pattern.`}
              ${red`   (useAuthorNamePatterns)`}
              ${red`   `}
              ${red`   Accepted patterns:`}
              ${red`     ∙ Ada Lovelace`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are 3 commits where 2 of them raise concerns from the first configuration file in a custom sequence of configuration files with the other files missing", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("configs/base.json", {
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 1 },
				},
			},
		})
		mockNonexistingFile("configs/team.json")
		mockNonexistingFile("configs/local.json")
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				sha: "335aee65f7a82c2f85771f45d9cfec47efab1547",
				message: "Open the bakery dashboard",
			}),
			fakeCrudeCommit({
				sha: "6f8dafa2608a817129c2ff899c5122eb69ba45cb",
				message: "Add the cinnamon telemetry",
			}),
			fakeCrudeCommit({
				sha: "b58de17b4d44256ffaa44a1068d743288fc6beda",
				message: "Wire the oat milk alert",
			}),
		])
		exitCode = await commandLineProgram([
			"--skip-missing-configs",
			"--config",
			"configs/base.json",
			"--config",
			"configs/team.json",
			"--config",
			"configs/local.json",
		])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`6f8dafa`} Add the cinnamon telemetry
      ${red`╭───────────────────────────`}
      ${red`╰─ Branches must not contain more than 1 commit.`}
      ${red`   (noExcessiveCommitsPerBranch)`}

${grey`b58de17`} Wire the oat milk alert
      ${red`╭────────────────────────`}
      ${red`╰─ Branches must not contain more than 1 commit.`}
      ${red`   (noExcessiveCommitsPerBranch)`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when there are 4 commits where 3 of them raise concerns from the last configuration file in a custom sequence of configuration files", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("configs/base.json", {
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 3 },
				},
			},
		})
		mockJsonFile("configs/team.json", {
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 2 },
				},
			},
		})
		mockJsonFile("configs/local.json", {
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 1 },
				},
			},
		})
		mockGitBranchCrudeCommits([
			fakeCrudeCommit({
				sha: "335aee65f7a82c2f85771f45d9cfec47efab1547",
				message: "added feature, removed my coworkers' sanity",
			}),
			fakeCrudeCommit({
				sha: "6f8dafa2608a817129c2ff899c5122eb69ba45cb",
				message: "Oops, forgot to save before commit",
			}),
			fakeCrudeCommit({
				sha: "b58de17b4d44256ffaa44a1068d743288fc6beda",
				message: "Not sure why this works, but it does",
			}),
			fakeCrudeCommit({
				sha: "9f1a1b2c3d4e5f678901234567890123456789ab",
				message: "This commit is a lie",
			}),
		])
		exitCode = await commandLineProgram([
			"--config",
			"configs/base.json",
			"--config",
			"configs/team.json",
			"--config",
			"configs/local.json",
		])
	})

	it(`exits with ${EXIT_CODE_RULE_VIOLATION}`, () => {
		expect(exitCode).toBe(EXIT_CODE_RULE_VIOLATION)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
${grey`335aee6`} added feature, removed my coworkers' sanity
        ${red`┬`}
        ${red`╰─ The first letter in subject lines must be in uppercase.`}
        ${red`   (useCapitalisedSubjectLines)`}

${grey`335aee6`} added feature, removed my coworkers' sanity
        ${red`──┬──`}
          ${red`╰─ Subject lines must start with a verb in the imperative mood.`}
          ${red`   (useImperativeSubjectLines)`}

${grey`6f8dafa`} Oops, forgot to save before commit
      ${red`╭───────────────────────────────────`}
      ${red`╰─ Branches must not contain more than 1 commit.`}
      ${red`   (noExcessiveCommitsPerBranch)`}

${grey`6f8dafa`} Oops, forgot to save before commit
        ${red`─┬──`}
         ${red`╰─ Subject lines must start with a verb in the imperative mood.`}
         ${red`   (useImperativeSubjectLines)`}

${grey`b58de17`} Not sure why this works, but it does
      ${red`╭─────────────────────────────────────`}
      ${red`╰─ Branches must not contain more than 1 commit.`}
      ${red`   (noExcessiveCommitsPerBranch)`}

${grey`b58de17`} Not sure why this works, but it does
        ${red`─┬─`}
         ${red`╰─ Subject lines must start with a verb in the imperative mood.`}
         ${red`   (useImperativeSubjectLines)`}

${grey`9f1a1b2`} This commit is a lie
      ${red`╭─────────────────────`}
      ${red`╰─ Branches must not contain more than 1 commit.`}
      ${red`   (noExcessiveCommitsPerBranch)`}

${grey`9f1a1b2`} This commit is a lie
        ${red`─┬──`}
         ${red`╰─ Subject lines must start with a verb in the imperative mood.`}
         ${red`   (useImperativeSubjectLines)`}
`.trim(),
		)
		expect(printCommandLineError).not.toHaveBeenCalled()
	})
})

describe("when a configuration file in a custom sequence of configuration files is missing and '--skip-missing-configs' is not enabled", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockJsonFile("configs/base.json", { rules: 31 })
		mockNonexistingFile("configs/local.json")
		exitCode = await commandLineProgram([
			"--config",
			"configs/base.json",
			"--config",
			"configs/local.json",
		])
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("raises an error for the missing configuration", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printCommandLineError).toHaveBeenCalledExactlyOnceWith(
			"Failed to read 'configs/local.json': File not found",
		)
	})
})
