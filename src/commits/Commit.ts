import type { CrudeCommit } from "#commits/CrudeCommit.ts"
import type { Tokens } from "#commits/Token.ts"
import type { TokenConfiguration } from "#commits/TokenConfiguration.ts"
import {
	type TokeniserPatterns,
	conventionalPattern,
	issueLinkPattern,
	tokeniseBodyLines,
	tokeniseSubject,
} from "#commits/Tokenise.ts"
import type { CommitSha } from "#types/CommitSha.ts"

/**
 * A platform-agnostic representation of a commit with refined data.
 */
export type Commit = {
	sha: CommitSha
	authorName: string
	authorEmail: string
	committerName: string
	committerEmail: string
	isMergeCommit: boolean
	hasSignature: boolean
	subject: Tokens
	bodyLines: Array<Tokens>
}

export type Commits = Array<Commit>

export function mapCrudeCommitToCommit(
	crudeCommit: CrudeCommit,
	configuration: TokenConfiguration,
): Commit {
	const [crudeSubject = "", ...crudeBodyLines] = crudeCommit.message.split("\n")

	const patterns: TokeniserPatterns = {
		conventional: conventionalPattern(configuration),
		issueLink: issueLinkPattern(configuration),
	}

	return {
		sha: crudeCommit.sha,
		isMergeCommit: crudeCommit.parents.length > 1,
		hasSignature: crudeCommit.signature !== "",
		authorName: crudeCommit.authorName,
		authorEmail: crudeCommit.authorEmail,
		committerName: crudeCommit.committerName,
		committerEmail: crudeCommit.committerEmail,
		subject: tokeniseSubject(crudeSubject, patterns),
		bodyLines: tokeniseBodyLines(crudeBodyLines, patterns),
	}
}
