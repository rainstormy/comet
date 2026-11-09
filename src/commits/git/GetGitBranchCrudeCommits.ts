import type { CrudeCommit, CrudeCommits } from "#commits/CrudeCommit.ts"
import type { CommitSha } from "#types/CommitSha.ts"
import type { GitLogCommitDto } from "#utilities/git/cli/dtos/GitLogCommitDto.ts"
import { getGitDefaultBranch } from "#utilities/git/cli/GetGitDefaultBranch.ts"
import { getGitLog } from "#utilities/git/cli/GetGitLog.ts"
import { parseGitIdentity } from "#utilities/git/cli/ParseGitIdentity.ts"

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
	const [authorName, authorEmail] = parseGitIdentity(dto.author.at(0))
	const [committerName, committerEmail] = parseGitIdentity(dto.committer.at(0))

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
