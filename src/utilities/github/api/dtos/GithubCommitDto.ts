import * as v from "valibot"
import { commitSha } from "#types/CommitSha.ts"
import { githubCommitUserDto } from "#utilities/github/api/dtos/GithubCommitUserDto.ts"
import { githubParentCommitDto } from "#utilities/github/api/dtos/GithubParentCommitDto.ts"

/**
 * @see https://docs.github.com/en/rest/pulls/pulls?apiVersion=2026-03-10#list-commits-on-a-pull-request
 */
export type GithubCommitDto = v.InferOutput<ReturnType<typeof githubCommitDto>>

// oxlint-disable-next-line typescript/explicit-function-return-type -- Rely on type inference for Valibot schemas.
export function githubCommitDto() {
	return v.object({
		sha: commitSha(),
		parents: v.array(githubParentCommitDto()),
		commit: v.object({
			author: v.nullable(githubCommitUserDto()),
			committer: v.nullable(githubCommitUserDto()),
			message: v.string(),
			verification: v.exactOptional(
				v.object({
					signature: v.nullable(v.string()),
				}),
			),
		}),
	})
}
