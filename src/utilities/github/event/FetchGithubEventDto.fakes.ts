import { assertNotNullish } from "#utilities/Assertions.ts"
import { mockJsonFile } from "#utilities/files/Files.fakes.ts"
import type { GithubUrlString } from "#utilities/github/api/GithubUrlString.ts"
import { mockGithubEnv } from "#utilities/github/env/GithubEnv.fakes.ts"
import type { GithubPullRequestEventDto } from "#utilities/github/event/dtos/GithubPullRequestEventDto.ts"
import {
	type GithubPullRequestReference,
	fakeGithubPullRequestReference,
} from "#utilities/github/event/GithubPullRequestReference.fakes.ts"

const eventPath = "/github/workflow/event.json"

export function mockGithubPullRequestEventDto(
	reference: GithubPullRequestReference = fakeGithubPullRequestReference(),
): `${GithubUrlString}/pulls/${number}/commits` {
	const [repository, pullRequestId] = reference.split("#")
	assertNotNullish(repository)
	assertNotNullish(pullRequestId)

	const pullRequestNumber = Math.trunc(Number(pullRequestId))
	const apiBaseUrl = `https://api.github.com/repos/${repository}` as const

	mockGithubEnv({ apiBaseUrl, eventPath })
	mockJsonFile<GithubPullRequestEventDto>(eventPath, {
		pull_request: { number: pullRequestNumber },
	})

	return `${apiBaseUrl}/pulls/${pullRequestNumber}/commits`
}

export function mockEmptyGithubEventDto(): void {
	mockGithubEnv({ eventPath })
	mockJsonFile(eventPath, {})
}
