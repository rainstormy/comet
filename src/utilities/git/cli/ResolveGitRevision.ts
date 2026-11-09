import type { CommitSha } from "#types/CommitSha.ts"
import { assertCommandError } from "#utilities/commands/CommandError.ts"
import { runCommand } from "#utilities/commands/RunCommand.ts"

/**
 * @returns The commit SHA of the given revision (e.g. `HEAD` or `MERGE_HEAD`), or `null` if the revision does not exist.
 */
export async function resolveGitRevision(revision: string): Promise<CommitSha | null> {
	try {
		const sha = await runCommand("git", "rev-parse", "--verify", "--quiet", revision)
		return sha as CommitSha
	} catch (error) {
		assertCommandError(error)

		// `git rev-parse --verify --quiet` exits with code 1 if the revision does not exist.
		if (error.exitCode !== 1) {
			throw error
		}

		return null
	}
}
