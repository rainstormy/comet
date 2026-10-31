import { beforeEach, vi } from "vitest"
import { requireNotNullish } from "#utilities/Assertions.ts"
import { CommandError } from "#utilities/commands/CommandError.ts"

vi.mock(import("#utilities/commands/RunCommand.ts"), () => ({
	runCommand: vi.fn(async (program: string, ...args: Array<string>) => {
		const command = `${program} ${args.join(" ")}`
		const remainingResults = resultsByCommand.get(command) ?? null

		if (remainingResults === null) {
			throw new Error(
				`Unexpected Git command: ${command}\n\nExpected Git commands in the scope of this test case:\n${getExpectedCommands()}\n\n`,
			)
		}

		const result = requireNotNullish(
			remainingResults.length > 1 ? remainingResults.shift() : remainingResults[0],
		)

		if (result.exitCode !== undefined && result.exitCode !== 0) {
			throw new CommandError({ program, args, exitCode: result.exitCode })
		}

		return result.output ?? ""
	}),
}))

const resultsByCommand = new Map<string, Array<CommandResult>>()

export type CommandResult = CommandSucceeded | CommandFailed

type CommandSucceeded = { output: string; exitCode?: 0 }

type CommandFailed = { output?: string; exitCode: number }

const indent = "  "

function getExpectedCommands(): string {
	return [...resultsByCommand.keys()].map((key) => `${indent}${key}`).join("\n")
}

export function mockCommands(): void {
	beforeEach(() => {
		resultsByCommand.clear()
	})
}

export function mockCommand(command: string, result: CommandResult): void {
	const existingResults = resultsByCommand.get(command) ?? null

	if (existingResults) {
		existingResults.push(result)
	} else {
		resultsByCommand.set(command, [result])
	}
}
