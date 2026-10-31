import { type CommandResult, mockCommand } from "#utilities/commands/RunCommand.fakes.ts"
import {
	type GitLogCommitDtoTemplate,
	fakeGitLogCommitDto,
} from "#utilities/git/cli/dtos/GitLogCommitDto.fakes.ts"
import type { GitLogCommitDto } from "#utilities/git/cli/dtos/GitLogCommitDto.ts"

export function mockGitLog(
	dtos: Array<GitLogCommitDtoTemplate>,
	defaultBranch: string | null = null,
): void {
	mockGitLogCommands(defaultBranch, {
		output: dtos.map(fakeGitLogCommitDto).map(formatCommitDto).toReversed().join("\n\n"),
	})
}

export function mockSabotagedGitLog(defaultBranch: string | null = null): void {
	mockGitLogCommands(defaultBranch, {
		exitCode: 128,
	})
}

function mockGitLogCommands(defaultBranch: string | null, result: CommandResult): void {
	if (defaultBranch === null) {
		mockCommand("git remote", { output: "origin" })
		mockCommand("git rev-parse --abbrev-ref origin/HEAD", { output: "origin/main" })
	}

	mockCommand(
		`git --no-pager log --format=raw --no-color ${defaultBranch ?? "origin/main"}..HEAD`,
		result,
	)
}

function formatCommitDto(dto: GitLogCommitDto): string {
	const {
		commit: [sha],
		message,
		...otherFields
	} = dto

	const formattedFields = Object.entries(otherFields)
		.flatMap(([key, lines]) => lines.map((line) => [key, line] as const))
		.map(([key, line]) => `${key} ${line.split("\n").join("\n ")}`)
		.join("\n")

	const formattedMessage = message[0]
		.split("\n")
		.map((line) => (line !== "" ? `    ${line}` : ""))
		.join("\n")

	return `commit ${sha}\n${formattedFields}\n\n${formattedMessage}`
}
