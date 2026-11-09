import type { CrudeCommit, CrudeCommits } from "#commits/CrudeCommit.ts"
import {
	type GitCommitMessageCleanupMode,
	type GitCommitMessageCleanupOptions,
	cleanupGitCommitMessage,
} from "#commits/git/CleanupGitCommitMessage.ts"
import type { CommitSha } from "#types/CommitSha.ts"
import { readTextFile } from "#utilities/files/Files.ts"
import { getGitConfigEntries, getGitConfigValue } from "#utilities/git/cli/GetGitConfig.ts"
import { getGitVar } from "#utilities/git/cli/GetGitVar.ts"
import { parseGitIdentity } from "#utilities/git/cli/ParseGitIdentity.ts"
import { resolveGitRevision } from "#utilities/git/cli/ResolveGitRevision.ts"
import { isGitEditorInUse } from "#utilities/git/env/GitHookEnv.ts"

/**
 * A placeholder for the SHA of a commit that has not been created yet, equal to the null object ID in Git.
 */
export const PENDING_COMMIT_SHA: CommitSha = "0000000000000000000000000000000000000000"

/**
 * Retrieves the commit that Git is about to create with the commit message in the given file,
 * e.g. the file passed to the `commit-msg` Git hook.
 *
 * The signature of the pending commit is unknown, as Git signs the commit after the hook has finished.
 *
 * @returns A single pending commit, or no commits if Git is about to abort the commit due to an empty commit message.
 * The hook cannot see `--allow-empty-message`, which makes Git create the commit with an empty message anyway.
 */
export async function getGitPendingCrudeCommits(messageFilePath: string): Promise<CrudeCommits> {
	const [rawMessage, cleanupOptions] = await Promise.all([
		readTextFile(messageFilePath),
		getCleanupOptions(),
	])

	const message = cleanupGitCommitMessage(rawMessage, cleanupOptions)

	if (message === null) {
		return []
	}

	return [await getPendingCrudeCommit(message)]
}

async function getCleanupOptions(): Promise<GitCommitMessageCleanupOptions> {
	const [mode, commentString] = await Promise.all([getCleanupMode(), getCommentString()])
	return { mode, commentString, isEdited: isGitEditorInUse() }
}

const CLEANUP_MODES: Array<GitCommitMessageCleanupMode> = [
	"default",
	"scissors",
	"strip",
	"verbatim",
	"whitespace",
]

async function getCleanupMode(): Promise<GitCommitMessageCleanupMode> {
	const value = await getGitConfigValue("commit.cleanup")
	return CLEANUP_MODES.find((mode) => mode === value) ?? "default"
}

async function getCommentString(): Promise<string> {
	// `core.commentString` and `core.commentChar` are aliases where the last occurrence takes precedence.
	const entries = await getGitConfigEntries(String.raw`^core\.comment(char|string)$`)
	const [, value = "#"] = entries.at(-1) ?? []

	// Git picks a comment character dynamically in the deprecated `auto` mode (case-insensitive), which is impossible to determine from the hook.
	// Fall back to the default comment character.
	return value === "" || value.toLowerCase() === "auto" ? "#" : value
}

async function getPendingCrudeCommit(message: string): Promise<CrudeCommit> {
	const [parents, authorIdentity, committerIdentity] = await Promise.all([
		getPendingParents(),
		getGitVar("GIT_AUTHOR_IDENT"),
		getGitVar("GIT_COMMITTER_IDENT"),
	])

	const [authorName, authorEmail] = parseGitIdentity(authorIdentity)
	const [committerName, committerEmail] = parseGitIdentity(committerIdentity)

	return {
		sha: PENDING_COMMIT_SHA,
		parents,
		authorName,
		authorEmail,
		committerName,
		committerEmail,
		message,
		signature: null,
	}
}

/**
 * `HEAD` does not exist yet before the initial commit in a new repository.
 * `MERGE_HEAD` only exists while Git is creating a merge commit.
 */
async function getPendingParents(): Promise<Array<CommitSha>> {
	const [head, mergeHead] = await Promise.all([
		resolveGitRevision("HEAD"),
		resolveGitRevision("MERGE_HEAD"),
	])

	return [head, mergeHead].filter((sha) => sha !== null)
}
