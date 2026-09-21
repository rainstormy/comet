import type { CrudeCommit, CrudeCommits } from "#commits/CrudeCommit.ts"
import type { CommitSha } from "#types/CommitSha.ts"
import type { GitLogCommitDto } from "#utilities/git/cli/dtos/GitLogCommitDto.ts"
import { getGitDefaultBranch } from "#utilities/git/cli/GetGitDefaultBranch.ts"
import { getGitLog } from "#utilities/git/cli/GetGitLog.ts"

export async function getGitBranchCrudeCommits(
	defaultBranch: string | null = null,
): Promise<CrudeCommits> {
	const fromRef = defaultBranch ?? (await getGitDefaultBranch())

	if (fromRef === null) {
		throw new Error(
			"Expected a default remote branch (e.g. 'origin/main') or a local branch named 'main' or 'master'",
		)
	}

	const dtos = await getGitLog(fromRef, "HEAD")
	return dtos.map(mapDtoToCrudeCommit).toReversed()
}

function mapDtoToCrudeCommit(dto: GitLogCommitDto): CrudeCommit {
	const [authorName, authorEmail] = parseUser(dto.author.at(0))
	const [committerName, committerEmail] = parseUser(dto.committer.at(0))

	return {
		sha: dto.commit[0] as CommitSha,
		parents: dto.parent as Array<CommitSha>,
		authorName,
		authorEmail,
		committerName,
		committerEmail,
		message: dto.message[0],
		signature: dto.gpgsig[0] ?? "",
	}
}

/**
 * Parses a string on the form `name <email> timestamp timezone` into a pair of name and email.
 */
function parseUser(line: string | undefined): [name: string, email: string] {
	if (line === undefined) {
		return ["", ""]
	}

	const timezoneStartIndex = line.lastIndexOf(" ")
	const timestampStartIndex = line.lastIndexOf(" ", timezoneStartIndex - 1)

	if (timestampStartIndex === -1) {
		return ["", ""]
	}

	const userLine = line.slice(0, timestampStartIndex)

	const emailStartIndex = userLine.lastIndexOf("<")
	const emailEndIndex = userLine.lastIndexOf(">")

	if (emailStartIndex !== -1 && emailEndIndex > emailStartIndex) {
		const name = userLine.slice(0, emailStartIndex)
		const email = userLine.slice(emailStartIndex + "<".length, emailEndIndex)
		return [emailStartIndex > 0 ? trimTrailingSpace(name) : "", email]
	}

	return [trimTrailingSpace(userLine), ""]
}

function trimTrailingSpace(value: string): string {
	return value.endsWith(" ") ? value.slice(0, -" ".length) : value
}
