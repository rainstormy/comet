import type { CommitSha } from "#types/CommitSha.ts"

/**
 * A platform-agnostic representation of a commit with unprocessed data.
 */
export type CrudeCommit = {
	sha: CommitSha
	parents: Array<CommitSha>
	authorName: string
	authorEmail: string
	committerName: string
	committerEmail: string
	message: string
	/**
	 * The cryptographic signature of the commit, an empty string if the commit is unsigned,
	 * or `null` if the signature is unknown because the commit has not been created yet.
	 */
	signature: string | null
}

export type CrudeCommits = Array<CrudeCommit>
