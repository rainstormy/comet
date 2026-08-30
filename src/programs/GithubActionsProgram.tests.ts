import { beforeEach, describe, expect, it } from "vitest"
import { fakeCrudeCommit } from "#commits/CrudeCommit.fakes.ts"
import { mockGithubPullRequestCrudeCommits } from "#commits/github/GetGithubPullRequestCrudeCommits.fakes.ts"
import { githubActionsProgram } from "#programs/GithubActionsProgram.ts"
import { fakeCommitSha } from "#types/CommitSha.fakes.ts"
import { EXIT_CODE_GENERAL_ERROR, EXIT_CODE_SUCCESS, type ExitCode } from "#types/ExitCode.ts"
import type { JsonValue } from "#types/JsonValue.ts"
import { mockJsonFile, mockNonexistingFile } from "#utilities/files/Files.fakes.ts"
import {
	mockNonexistingGithubResourceDto,
	mockSabotagedGithubResourceDto,
} from "#utilities/github/api/FetchGithubResourceDto.fakes.ts"
import type { GithubUrlString } from "#utilities/github/api/GithubUrlString.ts"
import { mockGithubEnv } from "#utilities/github/env/GithubEnv.fakes.ts"
import type { GithubPullRequestEventDto } from "#utilities/github/event/dtos/GithubPullRequestEventDto.ts"
import {
	mockEmptyGithubEventDto,
	mockGithubPullRequestEventDto,
} from "#utilities/github/event/FetchGithubEventDto.fakes.ts"
import { printGithubActionsError, printMessage } from "#utilities/logging/Logger.ts"

beforeEach(() => {
	mockGithubEnv()
})

describe("when the event payload is not a pull request", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockEmptyGithubEventDto()
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints an error message that describes the expected event payload", () => {
		expect(printGithubActionsError).toHaveBeenCalledExactlyOnceWith(
			"The 'rainstormy/comet' action expects the workflow trigger to be a 'pull_request' event.",
		)
	})
})

describe("when the event payload is missing in the file system", () => {
	const eventPath = "/github/workflow/event.json"
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGithubEnv({ eventPath })
		mockNonexistingFile(eventPath)
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints the error message raised by the file system", () => {
		expect(printGithubActionsError).toHaveBeenCalledExactlyOnceWith(
			`Failed to read '${eventPath}': File not found`,
		)
	})
})

describe("when the 'github-token' input parameter is missing", () => {
	const eventPath = "/github/workflow/event.json"
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGithubEnv({ eventPath, __secretToken__: "" })
		mockJsonFile<GithubPullRequestEventDto>(eventPath, { pull_request: { number: 1 } })
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints an error message that describes the expected input parameter", () => {
		expect(printGithubActionsError).toHaveBeenCalledExactlyOnceWith(
			"The 'rainstormy/comet' action expects the 'github-token' input parameter to be set",
		)
	})
})

describe("when the pull request does not exist", () => {
	let resourceUrl: `${GithubUrlString}/${string}`
	let exitCode: ExitCode

	beforeEach(async () => {
		resourceUrl = mockGithubPullRequestEventDto()
		mockNonexistingGithubResourceDto(resourceUrl, {
			documentationUrl: "https://docs.github.com/rest/pulls/pulls#list-commits-on-a-pull-request",
		})
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints the error message returned by the GitHub REST API", () => {
		expect(printGithubActionsError).toHaveBeenCalledExactlyOnceWith(
			`Failed to fetch '${resourceUrl}': 404 Not Found`,
		)
	})
})

describe("when a network error occurs while fetching data from the GitHub REST API", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		const resourceUrl = mockGithubPullRequestEventDto()
		mockSabotagedGithubResourceDto(resourceUrl)
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints an error message that describes the network error", () => {
		expect(printGithubActionsError).toHaveBeenCalledExactlyOnceWith("Network timeout")
	})
})

describe("when there are no commits", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGithubPullRequestCrudeCommits([])
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printGithubActionsError).not.toHaveBeenCalled()
	})
})

describe("when there is 1 commit that raises no concerns in the default configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGithubPullRequestCrudeCommits([fakeCrudeCommit({ message: "Release the robot butler" })])
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printGithubActionsError).not.toHaveBeenCalled()
	})
})

describe("when there are 4 commits that raise no concerns in the default configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGithubPullRequestCrudeCommits([
			fakeCrudeCommit({ message: "Establish the repository" }),
			fakeCrudeCommit({ message: "Enable the coffee machine integration tests" }),
			fakeCrudeCommit({ message: "Drop the legacy spaghetti tower module" }),
			fakeCrudeCommit({ message: "Help fix the annoying bug" }),
		])
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printGithubActionsError).not.toHaveBeenCalled()
	})
})

describe("when there is 1 commit that raises concerns in the default configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGithubPullRequestCrudeCommits([
			fakeCrudeCommit({
				sha: "98634c15dcab46ae1f23ca87a8d66467093415b3",
				message: "fix!",
			}),
		])
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
98634c1 fix!
        ┬
        ╰─ The first letter in subject lines must be in uppercase.
           (useCapitalisedSubjectLines)

98634c1 fix!
        ─┬─
         ╰─ Subject lines must contain at least two words.
            (noSingleWordSubjectLines)

98634c1 fix!
           ┬
           ╰─ Subject lines must not end with punctuation.
              (noUnexpectedPunctuation)
`.trim(),
		)
	})
})

describe("when there are 2 commits that raise concerns in the default configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGithubPullRequestCrudeCommits([
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
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
61a95da Document the tea set
    ╭──
  1 │ 
∙ 2 │ A  small note
    ·  ┬─
    ·  ╰─ Message bodies must not contain excessive whitespace.
    ·     (noExcessiveWhitespace)
    ╰──

d677c31 Review the tea set
    ╭──
  1 │ 
∙ 2 │ This body line is intentionally longer than the default seventy-two character wrapping limit
    ·                                                                         ──────────┬─────────
    ·                                Message body lines must not exceed 72 characters. ─╯
    ·                                (useLineWrapping)
    ╰──
`.trim(),
		)
	})
})

describe("when there are 3 commits that raise concerns in the default configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGithubPullRequestCrudeCommits([
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
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
335aee6 polish the tea set
        ┬
        ╰─ The first letter in subject lines must be in uppercase.
           (useCapitalisedSubjectLines)

6f8dafa Document the tea set
    ╭──
  1 │ 
∙ 2 │ A  small note
    ·  ┬─
    ·  ╰─ Message bodies must not contain excessive whitespace.
    ·     (noExcessiveWhitespace)
    ╰──

b58de17 Sign the pantry inventory
      ╭──────────────────────────
      ╰─ Commits must be signed cryptographically with a signing key.
         (useSignedCommits)
`.trim(),
		)
	})
})

describe("when there are 6 commits where 4 of them raise concerns in the default configuration", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGithubPullRequestCrudeCommits([
			fakeCrudeCommit({
				sha: "b676d3809038f6c2dc2e5b3feb98877f773dfd4c",
				message: "fixup! polish the tea set!",
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
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
b676d38 fixup! polish the tea set!
        ──┬───
          ╰─ Combine squash commits with their ancestors.
             (noSquashMarkers)

b676d38 fixup! polish the tea set!
               ┬
               ╰─ The first letter in subject lines must be in uppercase.
                  (useCapitalisedSubjectLines)

b676d38 fixup! polish the tea set!
                                 ┬
                                 ╰─ Subject lines must not end with punctuation.
                                    (noUnexpectedPunctuation)

3cfe8b3 Document the tea set
    ╭──
  1 │ 
∙ 2 │ A  small note
    ·  ┬─
    ·  ╰─ Message bodies must not contain excessive whitespace.
    ·     (noExcessiveWhitespace)
    ╰──

41a0e1d Review the tea set
      ╭───────────────────
      ╰─ Commits must be signed cryptographically with a signing key.
         (useSignedCommits)

41a0e1d Review the tea set
    ╭──
∙ 1 │ Well well well would you look at this.
    · ┬
    · ╰─ Subject lines and message bodies must be separated by exactly one empty line.
    ·    (useEmptyLineBeforeBodyLines)
  2 │ 
    ╰──

41a0e1d Review the tea set
    ╭──
  2 │ 
∙ 3 │ This body line is _also_ a bit longer than the default seventy-two character wrapping limit
    ·                                                                         ─────────┬─────────
    ·                               Message body lines must not exceed 72 characters. ─╯
    ·                               (useLineWrapping)
  4 │ We'll have to fix that, don't we?
    ╰──

7f811b2 Merge the old tea ledger
      ╭─────────────────────────
      ╰─ Merge commits are not allowed.
         (noMergeCommits)
`.trim(),
		)
	})
})

describe.each`
	configuration                  | expectedError
	${[{ rules: {}, tokens: {} }]} | ${`Failed to parse 'comet.json' as a Comet configuration: The configuration must be a JSON object, but it is an array: [ { "rules": {}, "tokens": {} …`}
	${{ rules: 31 }}               | ${"Failed to parse 'comet.json' as a Comet configuration: 'rules' must be an object, but it is a number: 31"}
	${{ extends: 1000 }}           | ${"Failed to parse 'comet.json' as a Comet configuration: 'extends' must be a string, but it is a number: 1000"}
`(
	"when the default configuration file is invalid due to $configuration",
	(props: { configuration: JsonValue; expectedError: string }) => {
		let exitCode: ExitCode

		beforeEach(async () => {
			mockJsonFile("./comet.json", props.configuration)
			exitCode = await githubActionsProgram()
		})

		it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
			expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
		})

		it("prints an error message", () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printGithubActionsError).toHaveBeenCalledExactlyOnceWith(props.expectedError)
		})
	},
)

describe.each`
	path                         | expectedError
	${"comet.local.json"}        | ${"Failed to read 'comet.local.json': File not found"}
	${"./configs/missing.json"}  | ${"Failed to read 'configs/missing.json': File not found"}
	${".github/comet.base.json"} | ${"Failed to read '.github/comet.base.json': File not found"}
`(
	"when 'config-path' points to a non-existing configuration file $path",
	(props: { path: string; expectedError: string }) => {
		let exitCode: ExitCode

		beforeEach(async () => {
			mockGithubEnv({ configPath: props.path })
			mockNonexistingFile(props.path)
			exitCode = await githubActionsProgram()
		})

		it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
			expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
		})

		it("prints an error message", () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printGithubActionsError).toHaveBeenCalledExactlyOnceWith(props.expectedError)
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
	"when 'config-path' points to a custom JSON configuration file that is invalid due to $configuration",
	(props: { configuration: JsonValue; expectedError: string }) => {
		let exitCode: ExitCode

		beforeEach(async () => {
			mockGithubEnv({ configPath: "configs/comet.json" })
			mockJsonFile("configs/comet.json", props.configuration)
			exitCode = await githubActionsProgram()
		})

		it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
			expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
		})

		it("prints the configuration error", () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printGithubActionsError).toHaveBeenCalledExactlyOnceWith(props.expectedError)
		})
	},
)

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
		mockGithubPullRequestCrudeCommits([])
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printGithubActionsError).not.toHaveBeenCalled()
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
		mockGithubPullRequestCrudeCommits([
			fakeCrudeCommit({ message: "BOT-71 Deploy the robot butler" }),
		])
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printGithubActionsError).not.toHaveBeenCalled()
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
		mockGithubPullRequestCrudeCommits([
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
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printGithubActionsError).not.toHaveBeenCalled()
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
		mockGithubPullRequestCrudeCommits([
			fakeCrudeCommit({
				sha: "98634c15dcab46ae1f23ca87a8d66467093415b3",
				message: "Authenticate the library cards\n\nCo-authored-by: Ada Lovelace <ada@example.com>",
			}),
		])
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
98634c1 Authenticate the library cards
    ╭──
  1 │ 
∙ 2 │ Co-authored-by: Ada Lovelace <ada@example.com>
    · ──────┬───────
    ·       ╰─ Message bodies must not contain disallowed trailers.
    ·          (noRestrictedTrailers)
    ·          
    ·          Disallowed trailers:
    ·            ∙ Co-authored-by
    ·            ∙ Reviewed-by
    ╰──
`.trim(),
		)
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
		mockGithubPullRequestCrudeCommits([
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
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
61a95da Map the paper trail
╰─ authored by: Master Splinter
              ╭────────────────
              ╰─ Names of commit authors must match an accepted pattern.
                 (useAuthorNamePatterns)
                 
                 Accepted patterns:
                   ∙ Leonardo da Vinci
                   ∙ Ada Lovelace
`.trim(),
		)
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
		mockGithubPullRequestCrudeCommits([
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
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
6f8dafa Add the cinnamon telemetry
      ╭───────────────────────────
      ╰─ Branches must not contain more than 1 commit.
         (noExcessiveCommitsPerBranch)

b58de17 Wire the oat milk alert
      ╭────────────────────────
      ╰─ Branches must not contain more than 1 commit.
         (noExcessiveCommitsPerBranch)

9f1a1b2 Test the emergency toaster
      ╭───────────────────────────
      ╰─ Branches must not contain more than 1 commit.
         (noExcessiveCommitsPerBranch)
`.trim(),
		)
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
		mockGithubPullRequestCrudeCommits([
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
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
3cfe8b3 Calibrate the midnight bell
                              ──┬──
                                ╰─ Subject lines must not exceed 22 characters.
                                   (useConciseSubjectLines)

41a0e1d Document the curious dial
                              ─┬─
                               ╰─ Subject lines must not exceed 22 characters.
                                  (useConciseSubjectLines)

7f811b2 Rehearse the evacuation waltz
                              ───┬───
                                 ╰─ Subject lines must not exceed 22 characters.
                                    (useConciseSubjectLines)

a43a3f3 Replace the ceremonial switch
                              ───┬───
                                 ╰─ Subject lines must not exceed 22 characters.
                                    (useConciseSubjectLines)

c0ffee1 Untangle the improbable cables
                              ───┬────
                                 ╰─ Subject lines must not exceed 22 characters.
                                    (useConciseSubjectLines)
`.trim(),
		)
	})
})

describe("when there are no commits in the custom configuration from 'configs/strict-comet.json'", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGithubEnv({ configPath: "configs/strict-comet.json" })
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
		mockGithubPullRequestCrudeCommits([])
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printGithubActionsError).not.toHaveBeenCalled()
	})
})

describe("when there is 1 commit that raises no concerns in the custom configuration from 'configs/strict-comet.json'", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGithubEnv({ configPath: "configs/strict-comet.json" })
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
		mockGithubPullRequestCrudeCommits([
			fakeCrudeCommit({ message: "CHORE-42 Repair the lunar calendar" }),
		])
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printGithubActionsError).not.toHaveBeenCalled()
	})
})

describe("when there are 7 commits that raise no concerns in the custom configuration from 'configs/strict-comet.json'", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGithubEnv({ configPath: "configs/strict-comet.json" })
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
		mockGithubPullRequestCrudeCommits([
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
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(exitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("remains silent", () => {
		expect(printMessage).not.toHaveBeenCalled()
		expect(printGithubActionsError).not.toHaveBeenCalled()
	})
})

describe("when there is 1 commit that raises concerns in the custom configuration from 'configs/strict-comet.json'", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGithubEnv({ configPath: "configs/strict-comet.json" })
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
		mockGithubPullRequestCrudeCommits([
			fakeCrudeCommit({
				sha: "98634c15dcab46ae1f23ca87a8d66467093415b3",
				message: "Refactor the signal lantern",
			}),
		])
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
98634c1 Refactor the signal lantern
╰─ committed by: 71091436+katanaturtle@users.noreply.github.com
               ╭───────────────────────────────────────────────
               ╰─ Email addresses of committers must match an accepted pattern.
                  (useCommitterEmailPatterns)
                  
                  Accepted patterns:
                    ∙ .+@fastforward\\.com
`.trim(),
		)
	})
})

describe("when there are 2 commits that raise concerns in the custom configuration from 'configs/strict-comet.json'", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGithubEnv({ configPath: "configs/strict-comet.json" })
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
		mockGithubPullRequestCrudeCommits([
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
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
61a95da Patch the rain gauge
╰─ authored by: Master Splinter
              ╭────────────────
              ╰─ Names of commit authors must match an accepted pattern.
                 (useAuthorNamePatterns)
                 
                 Accepted patterns:
                   ∙ Ada Lovelace

d677c31 Tune the observatory clock
      ╭───────────────────────────
      ╰─ Branches must not contain more than 1 commit.
         (noExcessiveCommitsPerBranch)
`.trim(),
		)
	})
})

describe("when there are 4 commits where 3 of them raise concerns in the custom configuration from 'configs/strict-comet.json'", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGithubEnv({ configPath: "configs/strict-comet.json" })
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
		mockGithubPullRequestCrudeCommits([
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
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
6f8dafa Document the emergency lantern
    ╭──
  1 │ 
∙ 2 │ Reviewed-by: Grace Hopper <grace@example.com>
    · ─────┬─────
    ·      ╰─ Message bodies must not contain disallowed trailers.
    ·         (noRestrictedTrailers)
    ·         
    ·         Disallowed trailers:
    ·           ∙ Reviewed-by
    ╰──

b58de17 Calibrate the wind tunnel
    ╭──
  1 │ 
∙ 2 │ The flight path is deliberately long enough to outgrow the tiny configured wrapping limit.
    ·                                 ─────────────────────────────┬────────────────────────────
    ·           Message body lines must not exceed 32 characters. ─╯
    ·           (useLineWrapping)
    ╰──

a43a3f3 Archive the noisy bell!
                              ┬
                              ╰─ Subject lines must not end with punctuation.
                                 (noUnexpectedPunctuation)
`.trim(),
		)
	})
})

describe("when there are 5 commits where 1 of them raises concerns in the custom configuration from 'configs/strict-comet.json'", () => {
	let exitCode: ExitCode

	beforeEach(async () => {
		mockGithubEnv({ configPath: "configs/strict-comet.json" })
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
		mockGithubPullRequestCrudeCommits([
			fakeCrudeCommit({ message: "INC-1 Repair the broken compass" }),
			fakeCrudeCommit({ message: "[maintenance] Polish the rain gauge" }),
			fakeCrudeCommit({ message: 'Revert "Move the stage lights"' }),
			fakeCrudeCommit({
				sha: "7f811b212b8e79d85a3cab7acb276942c565fb4a",
				message: 'Revert "Revert "Disable the alarm""',
			}),
			fakeCrudeCommit({ message: "INC-2 Update the vending machine" }),
		])
		exitCode = await githubActionsProgram()
	})

	it(`exits with ${EXIT_CODE_GENERAL_ERROR}`, () => {
		expect(exitCode).toBe(EXIT_CODE_GENERAL_ERROR)
	})

	it("prints a sorted commitwise report of all concerns", () => {
		expect(printMessage).toHaveBeenCalledExactlyOnceWith(
			`
7f811b2 Revert "Revert "Disable the alarm""
        ──────┬───────
              ╰─ Cherry-pick the original commit instead of reverting it over.
                 (noRevertRevertCommits)
`.trim(),
		)
	})
})
