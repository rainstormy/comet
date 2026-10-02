import { type MockInstance, beforeEach, describe, expect, it, vi } from "vitest"
import { printGithubActionsError, printGithubActionsWarning } from "#utilities/logging/Logger.ts"

// Undo the automatic use of `mockLogger` in `VitestSetup.fakes.ts`.
vi.unmock(import("#utilities/logging/Logger.ts"))

describe.each`
	error                                                                                         | expectedMessage
	${"Cannot find the configuration file 'configs/comet.jsonc'."}                                | ${"::error::Cannot find the configuration file 'configs/comet.jsonc'."}
	${"The 'rainstormy/comet' action expects the workflow trigger to be a 'pull_request' event."} | ${"::error::The 'rainstormy/comet' action expects the workflow trigger to be a 'pull_request' event."}
	${"A multiline error message:\n\rIt escapes newlines,\nand carriage returns\r."}              | ${"::error::A multiline error message:%0A%0DIt escapes newlines,%0Aand carriage returns%0D."}
	${"Invalid statement:\nAchieved 100% test coverage!"}                                         | ${"::error::Invalid statement:%0AAchieved 100%25 test coverage!"}
`(
	"when logging an error message of $error in GitHub Actions",
	(props: { error: string; expectedMessage: string }) => {
		let consoleLog: ConsoleLogMock

		beforeEach(() => {
			consoleLog = mockConsoleLog()
			printGithubActionsError(props.error)
		})

		it("logs a message with escaped characters and an '::error::' prefix", () => {
			expect(consoleLog).toHaveBeenCalledWith(props.expectedMessage)
		})
	},
)
describe.each`
	warning                                                                                       | expectedMessage
	${"Cannot find the configuration file 'configs/comet.jsonc'."}                                | ${"::warning::Cannot find the configuration file 'configs/comet.jsonc'."}
	${"The 'rainstormy/comet' action expects the workflow trigger to be a 'pull_request' event."} | ${"::warning::The 'rainstormy/comet' action expects the workflow trigger to be a 'pull_request' event."}
	${"A multiline error message:\n\rIt escapes newlines,\nand carriage returns\r."}              | ${"::warning::A multiline error message:%0A%0DIt escapes newlines,%0Aand carriage returns%0D."}
	${"Invalid statement:\nAchieved 100% test coverage!"}                                         | ${"::warning::Invalid statement:%0AAchieved 100%25 test coverage!"}
`(
	"when logging an error message of $warning in GitHub Actions",
	(props: { warning: string; expectedMessage: string }) => {
		let consoleLog: ConsoleLogMock

		beforeEach(() => {
			consoleLog = mockConsoleLog()
			printGithubActionsWarning(props.warning)
		})

		it("logs a message with escaped characters and a '::warning::' prefix", () => {
			expect(consoleLog).toHaveBeenCalledWith(props.expectedMessage)
		})
	},
)

type ConsoleLogMock = MockInstance<typeof console.log>

function mockConsoleLog(): ConsoleLogMock {
	return vi.spyOn(console, "log").mockImplementation(() => {
		// Do nothing.
	})
}
