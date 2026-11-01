import { runCommand } from "#utilities/commands/RunCommand.ts"

export async function getCommitSha(tag: `v${string}`): Promise<string> {
	try {
		// Grab the commit SHA with `^{commit}` instead of the annotated tag SHA.
		const commitSha = await runCommand("git", "rev-parse", "--verify", `refs/tags/${tag}^{commit}`)
		await runCommand("git", "merge-base", "--is-ancestor", commitSha, "main")

		return commitSha
	} catch (error) {
		throw new Error(`'${tag}' does not exist on the 'main' branch`, { cause: error })
	}
}
