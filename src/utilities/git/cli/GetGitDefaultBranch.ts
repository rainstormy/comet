import { ALPHABETICALLY, findMin, isNonEmptyArray } from "#utilities/Arrays.ts"
import { getGitRemotes } from "#utilities/git/cli/GetGitRemotes.ts"
import { assertGitCommandError } from "#utilities/git/cli/GitCommandError.ts"
import { runGitCommand } from "#utilities/git/cli/RunGitCommand.ts"

export async function getGitDefaultBranch(): Promise<string | null> {
	const remote = await getPreferredRemote()

	if (remote === null) {
		return getLocalFallbackBranch()
	}

	try {
		const remoteDefaultBranch = await getRemoteDefaultBranch(remote)

		if (remoteDefaultBranch !== null) {
			return remoteDefaultBranch
		}
	} catch (error) {
		assertGitCommandError(error)
		const remoteDefaultBranch = await retryRemoteDefaultBranch(remote)

		if (remoteDefaultBranch !== null) {
			return remoteDefaultBranch
		}
	}

	return getLocalFallbackBranch()
}

async function retryRemoteDefaultBranch(remote: string): Promise<string | null> {
	// A brand-new Git repository may not know about its remote branches yet.
	await runGitCommand(["fetch"])

	try {
		return await getRemoteDefaultBranch(remote)
	} catch (error) {
		assertGitCommandError(error)

		if (await hasRemoteTrackingBranch()) {
			throw error
		}
	}

	return null
}

async function getRemoteDefaultBranch(remote: string): Promise<string | null> {
	const remoteDefaultBranch = await runGitCommand(["rev-parse", "--abbrev-ref", `${remote}/HEAD`])
	return remoteDefaultBranch === "" ? null : remoteDefaultBranch
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
		assertGitCommandError(error)
		return false
	}
}

async function hasRemoteTrackingBranch(): Promise<boolean> {
	try {
		await runGitCommand(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"])
		return true
	} catch (error) {
		assertGitCommandError(error)
		return false
	}
}
