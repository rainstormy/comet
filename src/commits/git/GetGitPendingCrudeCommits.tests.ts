import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CrudeCommit, CrudeCommits } from "#commits/CrudeCommit.ts"
import type { GitCommitMessageCleanupMode } from "#commits/git/CleanupGitCommitMessage.ts"
import { mockGitPendingCommit } from "#commits/git/GetGitPendingCrudeCommits.fakes.ts"
import {
	PENDING_COMMIT_SHA,
	getGitPendingCrudeCommits,
} from "#commits/git/GetGitPendingCrudeCommits.ts"
import { fakeCommitSha } from "#types/CommitSha.fakes.ts"
import type { CommitSha } from "#types/CommitSha.ts"
import { mockCommand } from "#utilities/commands/RunCommand.fakes.ts"
import { mockFile } from "#utilities/files/Files.fakes.ts"

const messageFilePath = ".git/COMMIT_EDITMSG"

const STATUS_BLOCK = [
	"# Please enter the commit message for your changes. Lines starting",
	"# with '#' will be ignored, and an empty message aborts the commit.",
	"#",
	"# On branch main",
	"# Changes to be committed:",
	"#\tmodified:   README.md",
	"#",
].join("\n")

const NO_EDITOR = ":"
const SOME_EDITOR = "vim"

describe.each`
	message
	${"Release the robot butler"}
	${"Make more spaghetti\n\nFeed the ever-growing code monster."}
`("when the message file contains $message", (props: { message: string }) => {
	const headSha = fakeCommitSha()
	let actualCommits: CrudeCommits

	beforeEach(async () => {
		vi.stubEnv("GIT_EDITOR", NO_EDITOR)
		mockFile(messageFilePath, `${props.message}\n`)
		mockGitPendingCommit({
			head: headSha,
			authorIdentity: "Master Splinter <58390854+sensei@users.noreply.github.com> 1794259164 +0100",
			committerIdentity:
				"Leonardo da Vinci <71091436+katanaturtle@users.noreply.github.com> 1794259164 +0100",
		})
		actualCommits = await getGitPendingCrudeCommits(messageFilePath)
	})

	it("returns a single pending commit with the message, the identities, and the parent, but without a known signature", () => {
		expect(actualCommits).toEqual<Array<CrudeCommit>>([
			{
				sha: PENDING_COMMIT_SHA,
				parents: [headSha],
				authorName: "Master Splinter",
				authorEmail: "58390854+sensei@users.noreply.github.com",
				committerName: "Leonardo da Vinci",
				committerEmail: "71091436+katanaturtle@users.noreply.github.com",
				message: props.message,
				signature: null,
			},
		])
	})
})

describe.each`
	authorIdentity                                                                        | expectedAuthorName | expectedAuthorEmail
	${"tmnt <tmnt@fastforward.com> 1794259164 +0100"}                                     | ${"tmnt"}          | ${"tmnt@fastforward.com"}
	${"renovate[bot] <29139614+renovate[bot]@users.noreply.github.com> 1794259164 +0000"} | ${"renovate[bot]"} | ${"29139614+renovate[bot]@users.noreply.github.com"}
`(
	"when the author identity is $authorIdentity",
	(props: { authorIdentity: string; expectedAuthorName: string; expectedAuthorEmail: string }) => {
		let actualCommit: CrudeCommit | undefined

		beforeEach(async () => {
			vi.stubEnv("GIT_EDITOR", NO_EDITOR)
			mockFile(messageFilePath, "Release the robot butler\n")
			mockGitPendingCommit({ authorIdentity: props.authorIdentity })
			;[actualCommit] = await getGitPendingCrudeCommits(messageFilePath)
		})

		it("has the author's name and email address", () => {
			expect(actualCommit?.authorName).toBe(props.expectedAuthorName)
			expect(actualCommit?.authorEmail).toBe(props.expectedAuthorEmail)
		})
	},
)

describe.each`
	committerIdentity                                        | expectedCommitterName | expectedCommitterEmail
	${"Kgl. Hofnar <hofnar@kongehuset.dk> 1794259164 +0100"} | ${"Kgl. Hofnar"}      | ${"hofnar@kongehuset.dk"}
	${"GitHub <noreply@github.com> 1794259164 +0000"}        | ${"GitHub"}           | ${"noreply@github.com"}
`(
	"when the committer identity is $committerIdentity",
	(props: {
		committerIdentity: string
		expectedCommitterName: string
		expectedCommitterEmail: string
	}) => {
		let actualCommit: CrudeCommit | undefined

		beforeEach(async () => {
			vi.stubEnv("GIT_EDITOR", NO_EDITOR)
			mockFile(messageFilePath, "Release the robot butler\n")
			mockGitPendingCommit({ committerIdentity: props.committerIdentity })
			;[actualCommit] = await getGitPendingCrudeCommits(messageFilePath)
		})

		it("has the committer's name and email address", () => {
			expect(actualCommit?.committerName).toBe(props.expectedCommitterName)
			expect(actualCommit?.committerEmail).toBe(props.expectedCommitterEmail)
		})
	},
)

describe("when the pending commit is the initial commit in the repository", () => {
	let actualCommit: CrudeCommit | undefined

	beforeEach(async () => {
		vi.stubEnv("GIT_EDITOR", NO_EDITOR)
		mockFile(messageFilePath, "Establish the repository\n")
		mockGitPendingCommit({ head: null })
		;[actualCommit] = await getGitPendingCrudeCommits(messageFilePath)
	})

	it("does not have any parents", () => {
		expect(actualCommit?.parents).toEqual<Array<CommitSha>>([])
	})
})

describe("when the pending commit is a merge commit", () => {
	const headSha = fakeCommitSha()
	const mergeHeadSha = fakeCommitSha()
	let actualCommit: CrudeCommit | undefined

	beforeEach(async () => {
		vi.stubEnv("GIT_EDITOR", NO_EDITOR)
		mockFile(".git/MERGE_MSG", "Merge branch 'feature'")
		mockGitPendingCommit({ head: headSha, mergeHead: mergeHeadSha })
		;[actualCommit] = await getGitPendingCrudeCommits(".git/MERGE_MSG")
	})

	it("has two parents", () => {
		expect(actualCommit?.parents).toEqual<Array<CommitSha>>([headSha, mergeHeadSha])
	})
})

describe.each`
	editor         | cleanupMode     | rawMessage                                                          | expectedMessage
	${NO_EDITOR}   | ${null}         | ${"Release the robot butler  \n\n\n# It is polite.\n"}              | ${"Release the robot butler\n\n# It is polite."}
	${NO_EDITOR}   | ${"default"}    | ${"Release the robot butler  \n\n\n# It is polite.\n"}              | ${"Release the robot butler\n\n# It is polite."}
	${NO_EDITOR}   | ${"strip"}      | ${"Release the robot butler  \n\n\n# It is polite.\n"}              | ${"Release the robot butler"}
	${NO_EDITOR}   | ${"verbatim"}   | ${"Release the robot butler  \n\n\n# It is polite.\n"}              | ${"Release the robot butler  \n\n\n# It is polite."}
	${SOME_EDITOR} | ${null}         | ${`Release the robot butler  \n\nIt is polite.\n\n${STATUS_BLOCK}`} | ${"Release the robot butler\n\nIt is polite."}
	${SOME_EDITOR} | ${"default"}    | ${`Release the robot butler  \n\nIt is polite.\n\n${STATUS_BLOCK}`} | ${"Release the robot butler\n\nIt is polite."}
	${SOME_EDITOR} | ${"whitespace"} | ${`Release the robot butler  \n\nIt is polite.\n\n${STATUS_BLOCK}`} | ${`Release the robot butler\n\nIt is polite.\n\n${STATUS_BLOCK}`}
	${SOME_EDITOR} | ${"bogus"}      | ${`Release the robot butler  \n\nIt is polite.\n\n${STATUS_BLOCK}`} | ${"Release the robot butler\n\nIt is polite."}
`(
	"when GIT_EDITOR is $editor, 'commit.cleanup' is $cleanupMode, and the message file contains $rawMessage",
	(props: {
		editor: string
		cleanupMode: GitCommitMessageCleanupMode | "bogus" | null
		rawMessage: string
		expectedMessage: string
	}) => {
		let actualCommit: CrudeCommit | undefined

		beforeEach(async () => {
			vi.stubEnv("GIT_EDITOR", props.editor)
			mockFile(messageFilePath, props.rawMessage)
			mockGitPendingCommit({ cleanupMode: props.cleanupMode })
			;[actualCommit] = await getGitPendingCrudeCommits(messageFilePath)
		})

		it("cleans up the message in the same way as Git", () => {
			expect(actualCommit?.message).toBe(props.expectedMessage)
		})
	},
)

describe("when GIT_EDITOR is not set", () => {
	let actualCommit: CrudeCommit | undefined

	beforeEach(async () => {
		vi.stubEnv("GIT_EDITOR", undefined)
		mockFile(messageFilePath, `Release the robot butler\n\n${STATUS_BLOCK}`)
		mockGitPendingCommit()
		;[actualCommit] = await getGitPendingCrudeCommits(messageFilePath)
	})

	it("assumes that the message has been edited and removes the comments", () => {
		expect(actualCommit?.message).toBe("Release the robot butler")
	})
})

describe.each`
	commentConfigEntries                                         | expectedMessage
	${[]}                                                        | ${"; It is polite.\n// It is quick.\n//x It is quiet."}
	${[["core.commentchar", "#"]]}                               | ${"; It is polite.\n// It is quick.\n//x It is quiet."}
	${[["core.commentchar", ";"]]}                               | ${"# It is polite.\n// It is quick.\n//x It is quiet."}
	${[["core.commentstring", "//"]]}                            | ${"# It is polite.\n; It is polite."}
	${[["core.commentstring", "// "]]}                           | ${"# It is polite.\n; It is polite.\n//x It is quiet."}
	${[["core.commentstring", "//"], ["core.commentchar", ";"]]} | ${"# It is polite.\n// It is quick.\n//x It is quiet."}
	${[["core.commentchar", ";"], ["core.commentstring", "//"]]} | ${"# It is polite.\n; It is polite."}
	${[["core.commentchar", "auto"]]}                            | ${"; It is polite.\n// It is quick.\n//x It is quiet."}
	${[["core.commentchar", "Auto"]]}                            | ${"; It is polite.\n// It is quick.\n//x It is quiet."}
	${[["core.commentchar", "AUTO"]]}                            | ${"; It is polite.\n// It is quick.\n//x It is quiet."}
`(
	"when the comment configuration entries are $commentConfigEntries",
	(props: {
		commentConfigEntries: Array<[key: string, value: string]>
		expectedMessage: string
	}) => {
		let actualCommit: CrudeCommit | undefined

		beforeEach(async () => {
			vi.stubEnv("GIT_EDITOR", SOME_EDITOR)
			mockFile(
				messageFilePath,
				"Release the robot butler\n\n# It is polite.\n; It is polite.\n// It is quick.\n//x It is quiet.\n",
			)
			mockGitPendingCommit({ commentConfigEntries: props.commentConfigEntries })
			;[actualCommit] = await getGitPendingCrudeCommits(messageFilePath)
		})

		it("removes the comments that start with the configured comment string", () => {
			expect(actualCommit?.message).toBe(`Release the robot butler\n\n${props.expectedMessage}`)
		})
	},
)

describe("when the comment string has a trailing space and the edited message contains a verbose diff", () => {
	let actualCommit: CrudeCommit | undefined

	beforeEach(async () => {
		vi.stubEnv("GIT_EDITOR", SOME_EDITOR)
		mockFile(
			messageFilePath,
			"Release the robot butler\n\n//  ------------------------ >8 ------------------------\ndiff --git a/a b/a\n",
		)
		mockGitPendingCommit({ commentConfigEntries: [["core.commentstring", "// "]] })
		;[actualCommit] = await getGitPendingCrudeCommits(messageFilePath)
	})

	it("truncates the message at the scissors line", () => {
		expect(actualCommit?.message).toBe("Release the robot butler")
	})
})

describe.each`
	cleanupMode   | rawMessage  | expectedMessage
	${"verbatim"} | ${"\n"}     | ${""}
	${"verbatim"} | ${"  \n\n"} | ${"  \n"}
`(
	"when 'commit.cleanup' is $cleanupMode and the message file of $rawMessage is blank, but not empty",
	(props: {
		cleanupMode: GitCommitMessageCleanupMode
		rawMessage: string
		expectedMessage: string
	}) => {
		let actualCommits: CrudeCommits

		beforeEach(async () => {
			vi.stubEnv("GIT_EDITOR", NO_EDITOR)
			mockFile(messageFilePath, props.rawMessage)
			mockGitPendingCommit({ cleanupMode: props.cleanupMode })
			actualCommits = await getGitPendingCrudeCommits(messageFilePath)
		})

		it("returns a single pending commit with a blank message, as Git creates the commit", () => {
			expect(actualCommits.map((commit) => commit.message)).toEqual([props.expectedMessage])
		})
	},
)

describe.each`
	editor         | rawMessage
	${NO_EDITOR}   | ${""}
	${NO_EDITOR}   | ${"\n  \n\n"}
	${SOME_EDITOR} | ${STATUS_BLOCK}
	${SOME_EDITOR} | ${`\n\n${STATUS_BLOCK}\n# ------------------------ >8 ------------------------\ndiff`}
`(
	"when GIT_EDITOR is $editor and the message file of $rawMessage results in an empty commit message",
	(props: { editor: string; rawMessage: string }) => {
		let actualCommits: CrudeCommits

		beforeEach(async () => {
			vi.stubEnv("GIT_EDITOR", props.editor)
			mockFile(messageFilePath, props.rawMessage)
			mockGitPendingCommit()
			actualCommits = await getGitPendingCrudeCommits(messageFilePath)
		})

		it("returns no commits, as Git will abort the commit", () => {
			expect(actualCommits).toEqual<CrudeCommits>([])
		})
	},
)

describe("when the message file does not exist", () => {
	let actualError: unknown

	beforeEach(async () => {
		mockGitPendingCommit()
		actualError = await getGitPendingCrudeCommits(".git/MISSING_EDITMSG").catch(
			(error: unknown) => error,
		)
	})

	it("raises an error", () => {
		expect(actualError).toHaveProperty(
			"message",
			"Failed to read '.git/MISSING_EDITMSG': File not found",
		)
	})
})

describe.each`
	command
	${"git config --get commit.cleanup"}
	${String.raw`git config --null --get-regexp ^core\.comment(char|string)$`}
	${"git rev-parse --verify --quiet HEAD"}
	${"git rev-parse --verify --quiet MERGE_HEAD"}
	${"git var GIT_AUTHOR_IDENT"}
	${"git var GIT_COMMITTER_IDENT"}
`("when the '$command' command raises an unexpected error", (props: { command: string }) => {
	let actualError: unknown

	beforeEach(async () => {
		vi.stubEnv("GIT_EDITOR", NO_EDITOR)
		mockFile(messageFilePath, "Release the robot butler\n")
		mockCommand(props.command, { exitCode: 128 })
		mockGitPendingCommit()
		actualError = await getGitPendingCrudeCommits(messageFilePath).catch((error: unknown) => error)
	})

	it("raises the error", () => {
		expect(actualError).toHaveProperty(
			"message",
			`Command '${props.command}' failed with exit code 128`,
		)
	})
})
