import type { CrudeCommit, CrudeCommits } from "#commits/CrudeCommit.ts"
import type { GithubCommitDto } from "#utilities/github/api/dtos/GithubCommitDto.ts"
import { fetchGithubPullRequestCommitDtos } from "#utilities/github/api/FetchGithubPullRequestCommitDtos.ts"
import { getGithubPullRequestNumber } from "#utilities/github/event/GetGithubPullRequestNumber.ts"

export async function getGithubPullRequestCrudeCommits(): Promise<CrudeCommits> {
	const pullRequestNumber = await getGithubPullRequestNumber()

	if (pullRequestNumber === null) {
		throw new Error(
			"The 'rainstormy/comet' action expects the workflow trigger to be a 'pull_request' event.",
		)
	}

	const dtos = await fetchGithubPullRequestCommitDtos(pullRequestNumber)
	return dtos.map(mapDtoToCrudeCommit)
}

function mapDtoToCrudeCommit(dto: GithubCommitDto): CrudeCommit {
	const signature = dto.commit.verification?.signature ?? ""

	return {
		sha: dto.sha,
		authorName: dto.commit.author?.name ?? "",
		authorEmail: dto.commit.author?.email ?? "",
		committerName: dto.commit.committer?.name ?? "",
		committerEmail: dto.commit.committer?.email ?? "",
		parents: dto.parents.map((parentDto) => parentDto.sha),
		message: dto.commit.message,
		signatures: signature !== "" ? [signature] : [],
	}
}
