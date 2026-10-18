import * as v from "valibot"

/**
 * @see https://docs.github.com/en/rest/pulls/pulls?apiVersion=2026-03-10#list-commits-on-a-pull-request
 */
export type GithubCommitUserDto = v.InferOutput<ReturnType<typeof githubCommitUserDto>>

// oxlint-disable-next-line typescript/explicit-function-return-type -- Rely on type inference for Valibot schemas.
export function githubCommitUserDto() {
	return v.object({
		name: v.exactOptional(v.string()),
		email: v.exactOptional(v.string()),
	})
}
