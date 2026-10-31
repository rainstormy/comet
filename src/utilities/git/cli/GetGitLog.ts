import type { NonEmptyArray } from "#utilities/Arrays.ts"
import { runCommand } from "#utilities/commands/RunCommand.ts"
import type { GitLogCommitDto } from "#utilities/git/cli/dtos/GitLogCommitDto.ts"

export async function getGitLog(fromRef: string, toRef: string): Promise<Array<GitLogCommitDto>> {
	const range = `${fromRef}..${toRef}`

	// `--no-pager` prints all output at once instead of using pagination.
	const output = await runCommand("git", "--no-pager", "log", "--format=raw", "--no-color", range)

	if (output === "") {
		return []
	}

	const lines = output.split("\n")
	const [firstLine, ...remainingLines] = lines

	assertCommitLine(firstLine, range)
	return mapLogLinesToCommitDtos(firstLine, remainingLines)
}

function mapLogLinesToCommitDtos(
	firstLine: `commit ${string}`,
	remainingLines: Array<string>,
): Array<GitLogCommitDto> {
	const commitDtos: Array<GitLogCommitDto> = []

	let currentCommitDto = gitLogCommitDto(firstLine.slice("commit ".length))
	let currentField: NonEmptyArray<string> = currentCommitDto.commit

	function addCommitDto(dto: GitLogCommitDto): void {
		commitDtos.push(trimTrailingNewlines(dto))
	}

	function addLine(line: string): void {
		currentField[currentField.length - 1] += `${line}\n`
	}

	for (const line of remainingLines) {
		if (line.startsWith("commit ")) {
			addCommitDto(currentCommitDto)
			currentCommitDto = gitLogCommitDto(line.slice("commit ".length))
			currentField = currentCommitDto.commit

			// A commit message.
		} else if (line.startsWith("    ")) {
			currentField = currentCommitDto.message
			addLine(line.slice("    ".length))

			// A multiline value.
		} else if (line.startsWith(" ")) {
			addLine(line.slice(" ".length))

			// A key-value field.
		} else if (line.includes(" ")) {
			const valueIndex = line.indexOf(" ")

			const key = line.slice(0, valueIndex)
			const value = `${line.slice(valueIndex + " ".length)}\n`

			if (currentCommitDto[key] === undefined) {
				currentCommitDto[key] = [value]
			} else {
				currentCommitDto[key].push(value)
			}
			currentField = currentCommitDto[key] as NonEmptyArray<string>

			// A blank line.
		} else {
			addLine("")
		}
	}

	addCommitDto(currentCommitDto)
	return commitDtos
}

function gitLogCommitDto(commitSha: string): GitLogCommitDto {
	return {
		author: [],
		commit: [`${commitSha}\n`],
		committer: [],
		gpgsig: [],
		message: [""],
		parent: [],
	}
}

function trimTrailingNewlines(dto: GitLogCommitDto): GitLogCommitDto {
	return Object.fromEntries(
		Object.entries(dto).map(([key, values]) => [
			key,
			values.map((value) =>
				value.endsWith("\n\n") ? value.slice(0, -"\n\n".length) : value.slice(0, -"\n".length),
			),
		]),
	) as GitLogCommitDto
}

function assertCommitLine(
	line: string | undefined,
	logRange: string,
): asserts line is `commit ${string}` {
	if (line === undefined || !line.startsWith("commit ")) {
		throw new Error(`Unexpected line in the Git log of ${logRange}: ${line}`)
	}
}
