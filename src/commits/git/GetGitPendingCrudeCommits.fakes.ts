import { beforeEach, vi } from "vitest"
import type { CrudeCommits } from "#commits/CrudeCommit.ts"
import type { GitCommitMessageCleanupMode } from "#commits/git/CleanupGitCommitMessage.ts"
import type { CommitSha } from "#types/CommitSha.ts"
import { mockCommand } from "#utilities/commands/RunCommand.fakes.ts"

vi.mock(import("#commits/git/GetGitPendingCrudeCommits.ts"), async (importOriginal) => {
	const original = await importOriginal()

	return {
		...original,
		getGitPendingCrudeCommits: vi.fn(async (messageFilePath: string) => {
			if (mockedCrudeCommits) {
				return mockedCrudeCommits
			}

			return original.getGitPendingCrudeCommits(messageFilePath)
		}),
	}
})

let mockedCrudeCommits: CrudeCommits | undefined

beforeEach(() => {
	mockedCrudeCommits = undefined
})

export function mockGitPendingCrudeCommits(crudeCommits?: CrudeCommits): void {
	mockedCrudeCommits = crudeCommits
}

export type GitPendingCommitTemplate = {
	cleanupMode?: GitCommitMessageCleanupMode | "bogus" | null
	commentConfigEntries?: Array<[key: string, value: string]>
	head?: CommitSha | null
	mergeHead?: CommitSha | null
	authorIdentity?: string
	committerIdentity?: string
}

/**
 * Mocks the Git commands that are needed to retrieve the pending commit, i.e. the Git configuration, the parents, and the identities.
 */
export function mockGitPendingCommit(template: GitPendingCommitTemplate = {}): void {
	const {
		cleanupMode = null,
		commentConfigEntries = [],
		head = "024e4f8b044549ac8f833356f20b63af491e46b5",
		mergeHead = null,
		authorIdentity = "Master Splinter <sensei@ninja-academy.com> 1769801867 -0500",
		committerIdentity = "Leonardo da Vinci <katana@ninja-academy.com> 1769801867 -0500",
	} = template

	mockCommand(
		"git config --get commit.cleanup",
		cleanupMode !== null ? { output: cleanupMode } : { exitCode: 1 },
	)
	mockCommand(
		String.raw`git config --null --get-regexp ^core\.comment(char|string)$`,
		commentConfigEntries.length > 0
			? { output: commentConfigEntries.map(([key, value]) => `${key}\n${value}\0`).join("") }
			: { exitCode: 1 },
	)
	mockCommand(
		"git rev-parse --verify --quiet HEAD",
		head !== null ? { output: head } : { exitCode: 1 },
	)
	mockCommand(
		"git rev-parse --verify --quiet MERGE_HEAD",
		mergeHead !== null ? { output: mergeHead } : { exitCode: 1 },
	)
	mockCommand("git var GIT_AUTHOR_IDENT", { output: authorIdentity })
	mockCommand("git var GIT_COMMITTER_IDENT", { output: committerIdentity })
}
