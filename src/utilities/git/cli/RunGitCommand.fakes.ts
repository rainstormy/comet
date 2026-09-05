import { beforeEach, vi } from "vitest"
import { requireNotNullish } from "#utilities/Assertions.ts"
import { GitCommandError } from "#utilities/git/cli/GitCommandError.ts"

vi.mock(import("#utilities/git/cli/RunGitCommand.ts"), () => ({
	runGitCommand: vi.fn(async (args) => {
		const remainingResults = resultsByCommand.get(args.join(" ")) ?? null

		if (remainingResults === null) {
			throw new Error(
				`Unexpected Git command: ${args.join(" ")}\n\nExpected Git commands in the scope of this test case:\n${getExpectedCommands()}\n\n`,
			)
		}

		const result = requireNotNullish(
			remainingResults.length > 1 ? remainingResults.shift() : remainingResults[0],
		)

		if (result.exitCode !== undefined && result.exitCode !== 0) {
			throw new GitCommandError({ args, exitCode: result.exitCode })
		}

		return result.output ?? ""
	}),
}))

const resultsByCommand = new Map<string, Array<GitCommandResult>>()

type GitCommandResult = GitCommandSucceeded | GitCommandFailed

type GitCommandSucceeded = { output: string; exitCode?: 0 }

type GitCommandFailed = { output?: string; exitCode: number }

const indent = "  "

function getExpectedCommands(): string {
	return [...resultsByCommand.keys()].map((key) => `${indent}${key}`).join("\n")
}

export function mockGitCli(): void {
	beforeEach(() => {
		resultsByCommand.clear()
	})
}

export function mockGitCommand(command: string, result: GitCommandResult): void {
	const existingResults = resultsByCommand.get(command) ?? null

	if (existingResults) {
		existingResults.push(result)
	} else {
		resultsByCommand.set(command, [result])
	}
}
