import { beforeEach, describe, expect, it } from "vitest"
import { fakeCrudeCommit } from "#commits/CrudeCommit.fakes.ts"
import { mockGithubPullRequestCrudeCommits } from "#commits/github/GetGithubPullRequestCrudeCommits.fakes.ts"
import { githubActionsProgram } from "#programs/GithubActionsProgram.ts"
import { fakeCommitSha } from "#types/CommitSha.fakes.ts"
import { EXIT_CODE_GENERAL_ERROR, EXIT_CODE_SUCCESS, type ExitCode } from "#types/ExitCode.ts"
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
			`Failed to read ${eventPath}: File not found`,
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
