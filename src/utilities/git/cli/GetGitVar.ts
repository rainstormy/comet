import { runCommand } from "#utilities/commands/RunCommand.ts"

export type GitVariable = "GIT_AUTHOR_IDENT" | "GIT_COMMITTER_IDENT"

/**
 * @returns The value of the given logical Git variable, respecting the Git configuration and environment variables such as `GIT_AUTHOR_NAME`.
 * @see https://git-scm.com/docs/git-var
 */
export async function getGitVar(variable: GitVariable): Promise<string> {
	return runCommand("git", "var", variable)
}
