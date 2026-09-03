import { ALPHABETICALLY, findMin, isNonEmptyArray } from "#utilities/Arrays.ts"
import { getGitRemotes } from "#utilities/git/cli/GetGitRemotes.ts"
import { GitCommandError } from "#utilities/git/cli/GitCommandError.ts"
import { runGitCommand } from "#utilities/git/cli/RunGitCommand.ts"

export async function getGitDefaultBranch(): Promise<string | null> {
	const remote = await getPreferredRemote()

	try {
		if (remote !== null) {
			const remoteDefaultBranch = await runGitCommand([
				"rev-parse",
				"--abbrev-ref",
				`${remote}/HEAD`,
			])

			if (remoteDefaultBranch) {
				return remoteDefaultBranch
			}
		}
	} catch (error) {
		if (error instanceof GitCommandError && error.exitCode !== 0) {
			return getLocalFallbackBranch()
		}
		throw error
	}

	return getLocalFallbackBranch()
}

async function getPreferredRemote(): Promise<string | null> {
	const remotes = await getGitRemotes()

	return isNonEmptyArray(remotes)
		? remotes.includes("origin")
			? "origin"
			: findMin(remotes, ALPHABETICALLY)
		: null
}

async function getLocalFallbackBranch(): Promise<string | null> {
	if (await hasLocalBranch("main")) {
		return "main"
	}
	if (await hasLocalBranch("master")) {
		return "master"
	}
	return null
}

async function hasLocalBranch(branchName: string): Promise<boolean> {
	try {
		await runGitCommand(["rev-parse", "--verify", "--quiet", branchName])
		return true
	} catch (error) {
		if (error instanceof GitCommandError && error.exitCode !== 0) {
			return false
		}
		throw error
	}
}
