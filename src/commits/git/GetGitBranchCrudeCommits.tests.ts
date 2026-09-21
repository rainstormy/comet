import { beforeEach, describe, expect, it } from "vitest"
import type { CrudeCommit } from "#commits/CrudeCommit.ts"
import { getGitBranchCrudeCommits } from "#commits/git/GetGitBranchCrudeCommits.ts"
import { fakeCommitSha } from "#types/CommitSha.fakes.ts"
import type { CommitSha } from "#types/CommitSha.ts"
import type { Vector } from "#types/Vector.ts"
import { fakeGitLogCommitDtos } from "#utilities/git/cli/dtos/GitLogCommitDto.fakes.ts"
import { mockGitLog, mockSabotagedGitLog } from "#utilities/git/cli/GetGitLog.fakes.ts"
import { mockGitCommand } from "#utilities/git/cli/RunGitCommand.fakes.ts"

describe("when a default branch is provided", () => {
	beforeEach(() => {
		mockGitCommand("--no-pager log --format=raw --no-color upstream/release..HEAD", { output: "" })
	})

	it("gets commits from the provided branch", async () => {
		const commits = await getGitBranchCrudeCommits("upstream/release")
		expect(commits).toEqual([])
	})
})

describe.each`
	sha
	${fakeCommitSha()}
	${fakeCommitSha()}
`("when the commit SHA is $sha", (props: { sha: CommitSha }) => {
	const sha = props.sha

	beforeEach(() => {
		mockGitLog([{ commit: [sha] }])
	})

	it("preserves the commit SHA", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.sha).toBe(sha)
	})
})

describe("when the commit does not have a parent", () => {
	const parents: Vector<CommitSha, 0> = []

	beforeEach(() => {
		mockGitLog([{ parent: parents }])
	})

	it("has no parent SHAs", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.parents).toEqual([])
	})
})

describe.each`
	parentSha
	${fakeCommitSha()}
	${fakeCommitSha()}
`("when the commit has 1 parent with a SHA of $parentSha", (props: { parentSha: CommitSha }) => {
	const parents: Vector<CommitSha, 1> = [props.parentSha]

	beforeEach(() => {
		mockGitLog([{ parent: parents }])
	})

	it("preserves the parent SHA", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.parents).toEqual([parents[0]])
	})
})

describe("when the commit has 2 parents", () => {
	const parents: Vector<CommitSha, 2> = [fakeCommitSha(), fakeCommitSha()]

	beforeEach(() => {
		mockGitLog([{ parent: parents }])
	})

	it("preserves both parent SHAs", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.parents).toEqual([parents[0], parents[1]])
	})
})

describe("when the commit has 3 parents", () => {
	const parents: Vector<CommitSha, 3> = [fakeCommitSha(), fakeCommitSha(), fakeCommitSha()]

	beforeEach(() => {
		mockGitLog([{ parent: parents }])
	})

	it("preserves all parent SHAs", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.parents).toEqual([parents[0], parents[1], parents[2]])
	})
})

describe.each`
	message
	${"Release the robot butler"}
	${"some refactoring"}
`("when the commit message of $message has a single line", (props: { message: string }) => {
	const message = props.message

	beforeEach(() => {
		mockGitLog([{ message: [message] }])
	})

	it("preserves the commit message as is", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.message).toBe(message)
	})
})

describe.each`
	message
	${"  Make more spaghetti to feed the ever-growing code monster "}
	${" bugfixes  "}
`(
	"when the commit message of $message has a single line with leading and trailing whitespace",
	(props: { message: string }) => {
		const message = props.message

		beforeEach(() => {
			mockGitLog([{ message: [message] }])
		})

		it("preserves the commit message as is", async () => {
			const [commit] = await getGitBranchCrudeCommits()
			expect(commit?.message).toBe(message)
		})
	},
)

describe.each`
	message
	${""}
	${"   "}
`("when the commit message of $message is blank", (props: { message: string }) => {
	const message = props.message

	beforeEach(() => {
		mockGitLog([{ message: [message] }])
	})

	it("preserves the commit message as is", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.message).toBe(message)
	})
})

describe.each`
	message
	${"Apply strawberry jam to make the code sweeter\nSweetness went to a 8 out of 10, as we held back a bit to avoid turning the code diabetic."}
	${"fixup!  added some extra love to the code\n\nSome improvements that we made:\n  - The code is more readable now.\n  - The function is much faster now.\n  - The architecture is much more flexible now."}
`("when the commit message of $message has multiple lines", (props: { message: string }) => {
	const message = props.message

	beforeEach(() => {
		mockGitLog([{ message: [message] }])
	})

	it("preserves the commit message as is", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.message).toBe(message)
	})
})

describe.each`
	message
	${"Fix typo: survice -> service\n  I'm a survivor! \n  I'm not gon' give up! "}
	${"more bugfixes\n the customer has asked for these bugfixes and we deliver  \nanother line"}
`(
	"when the commit message of $message has a body line with leading and trailing whitespace",
	(props: { message: string }) => {
		const message = props.message

		beforeEach(() => {
			mockGitLog([{ message: [message] }])
		})

		it("preserves the commit message as is", async () => {
			const [commit] = await getGitBranchCrudeCommits()
			expect(commit?.message).toBe(message)
		})
	},
)

describe.each`
	message
	${"Test\n\nIt works now."}
	${"Test\n    \nIt works now."}
`("when the commit message of $message has a blank body line", (props: { message: string }) => {
	const message = props.message

	beforeEach(() => {
		mockGitLog([{ message: [message] }])
	})

	it("preserves the commit message as is", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.message).toBe(message)
	})
})

describe.each`
	authorName         | authorEmail
	${"tmnt"}          | ${"tmnt@fastforward.com"}
	${"renovate[bot]"} | ${"29139614+renovate[bot]@users.noreply.github.com"}
	${"Nimbus (Bot)"}  | ${"146315497+rainstormybot-nimbus@users.noreply.github.com"}
`(
	"when the author's name is $authorName and the author's email address is $authorEmail",
	(props: { authorName: string; authorEmail: string }) => {
		const authorName = props.authorName
		const authorEmail = props.authorEmail

		beforeEach(() => {
			mockGitLog([{ author: [`${authorName} <${authorEmail}> 1769801867 -0500`] }])
		})

		it("preserves the author's name", async () => {
			const [commit] = await getGitBranchCrudeCommits()
			expect(commit?.authorName).toBe(authorName)
		})

		it("preserves the author's email address", async () => {
			const [commit] = await getGitBranchCrudeCommits()
			expect(commit?.authorEmail).toBe(authorEmail)
		})
	},
)

describe.each`
	authorName
	${"  bmo "}
	${" Kgl. Hofnar  "}
`(
	"when the author's name of $authorName has leading and trailing whitespace",
	(props: { authorName: string }) => {
		const authorName = props.authorName
		const authorEmail = "25199993+noname@users.noreply.github.com"

		beforeEach(() => {
			mockGitLog([{ author: [`${authorName} <${authorEmail}> 1769801867 -0500`] }])
		})

		it("preserves the author's name as is", async () => {
			const [commit] = await getGitBranchCrudeCommits()
			expect(commit?.authorName).toBe(authorName)
		})
	},
)

describe.each`
	authorName
	${""}
	${"   "}
`("when the author's name of $authorName is blank", (props: { authorName: string }) => {
	const authorName = props.authorName
	const authorEmail = "25199993+noname@users.noreply.github.com"

	beforeEach(() => {
		mockGitLog([{ author: [`${authorName} <${authorEmail}> 1769801867 -0500`] }])
	})

	it("preserves the author's name as is", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.authorName).toBe(authorName)
	})
})

describe("when the author's name is absent", () => {
	const authorEmail = "25199993+noname@users.noreply.github.com"

	beforeEach(() => {
		mockGitLog([{ author: [`<${authorEmail}> 1769801867 -0500`] }])
	})

	it("omits the author's name", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.authorName).toBe("")
	})

	it("preserves the author's email address", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.authorEmail).toBe(authorEmail)
	})
})

describe.each`
	authorEmail
	${"  tmnt@fastforward.com "}
	${" 25199993+noname@users.noreply.github.com  "}
`(
	"when the author's email address of $authorEmail has leading and trailing whitespace",
	(props: { authorEmail: string }) => {
		const authorName = "Unnamed 1"
		const authorEmail = props.authorEmail

		beforeEach(() => {
			mockGitLog([{ author: [`${authorName} <${authorEmail}> 1769801867 -0500`] }])
		})

		it("preserves the author's email address as is", async () => {
			const [commit] = await getGitBranchCrudeCommits()
			expect(commit?.authorEmail).toBe(authorEmail)
		})
	},
)

describe.each`
	authorEmail
	${""}
	${"   "}
`("when the author's email address of $authorEmail is blank", (props: { authorEmail: string }) => {
	const authorName = "Unnamed 1"
	const authorEmail = props.authorEmail

	beforeEach(() => {
		mockGitLog([{ author: [`${authorName} <${authorEmail}> 1769801867 -0500`] }])
	})

	it("preserves the author's email address as is", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.authorEmail).toBe(authorEmail)
	})
})

describe("when the author's email address is absent", () => {
	const authorName = "Unnamed 1"

	beforeEach(() => {
		mockGitLog([{ author: [`${authorName} 1769801867 -0500`] }])
	})

	it("preserves the author's name", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.authorName).toBe(authorName)
	})

	it("omits the author's email address", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.authorEmail).toBe("")
	})
})

describe("when the author is absent", () => {
	beforeEach(() => {
		mockGitLog([{ author: [] }])
	})

	it("omits the author's name", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.authorName).toBe("")
	})

	it("omits the author's email address", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.authorEmail).toBe("")
	})
})

describe.each`
	committerName                                   | committerEmail
	${"baxter.stockman"}                            | ${"baxter.stockman@fastforward.com"}
	${"GitHub"}                                     | ${"noreply@github.com"}
	${"Michelangelo di Lodovico Buonarroti Simoni"} | ${"28317649+cowabunga@users.noreply.github.com"}
`(
	"when the committer name is $committerName and the committer email address is $committerEmail",
	(props: { committerName: string; committerEmail: string }) => {
		const committerName = props.committerName
		const committerEmail = props.committerEmail

		beforeEach(() => {
			mockGitLog([{ committer: [`${committerName} <${committerEmail}> 1769801867 -0500`] }])
		})

		it("preserves the committer's name", async () => {
			const [commit] = await getGitBranchCrudeCommits()
			expect(commit?.committerName).toBe(committerName)
		})

		it("preserves the committer's email address", async () => {
			const [commit] = await getGitBranchCrudeCommits()
			expect(commit?.committerEmail).toBe(committerEmail)
		})
	},
)

describe.each`
	committerName
	${"  fut "}
	${" April O'Neil  "}
`(
	"when the committer's name of $committerName has leading and trailing whitespace",
	(props: { committerName: string }) => {
		const committerName = props.committerName
		const committerEmail = "25199993+noname@users.noreply.github.com"

		beforeEach(() => {
			mockGitLog([{ committer: [`${committerName} <${committerEmail}> 1769801867 -0500`] }])
		})

		it("preserves the committer's name as is", async () => {
			const [commit] = await getGitBranchCrudeCommits()
			expect(commit?.committerName).toBe(committerName)
		})
	},
)

describe.each`
	committerName
	${""}
	${"   "}
`("when the committer's name of $committerName is blank", (props: { committerName: string }) => {
	const committerName = props.committerName
	const committerEmail = "25199993+noname@users.noreply.github.com"

	beforeEach(() => {
		mockGitLog([{ committer: [`${committerName} <${committerEmail}> 1769801867 -0500`] }])
	})

	it("preserves the committer's name as is", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.committerName).toBe(committerName)
	})
})

describe("when the committer's name is absent", () => {
	const committerEmail = "25199993+noname@users.noreply.github.com"

	beforeEach(() => {
		mockGitLog([{ committer: [`<${committerEmail}> 1769801867 -0500`] }])
	})

	it("omits the committer's name", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.committerName).toBe("")
	})

	it("preserves the committer's email address", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.committerEmail).toBe(committerEmail)
	})
})

describe.each`
	committerEmail
	${"  baxter.stockman@fastforward.com "}
	${" 25199993+noname@users.noreply.github.com  "}
`(
	"when the committer's email address of $committerEmail has leading and trailing whitespace",
	(props: { committerEmail: string }) => {
		const committerName = "Unnamed 2"
		const committerEmail = props.committerEmail

		beforeEach(() => {
			mockGitLog([{ committer: [`${committerName} <${committerEmail}> 1769801867 -0500`] }])
		})

		it("preserves the committer's email address as is", async () => {
			const [commit] = await getGitBranchCrudeCommits()
			expect(commit?.committerEmail).toBe(committerEmail)
		})
	},
)

describe.each`
	committerEmail
	${""}
	${"   "}
`(
	"when the committer's email address of $committerEmail is blank",
	(props: { committerEmail: string }) => {
		const committerName = "Unnamed 2"
		const committerEmail = props.committerEmail

		beforeEach(() => {
			mockGitLog([{ committer: [`${committerName} <${committerEmail}> 1769801867 -0500`] }])
		})

		it("preserves the committer's email address as is", async () => {
			const [commit] = await getGitBranchCrudeCommits()
			expect(commit?.committerEmail).toBe(committerEmail)
		})
	},
)

describe("when the committer's email address is absent", () => {
	const committerName = "Unnamed 2"

	beforeEach(() => {
		mockGitLog([{ committer: [`${committerName} 1769801867 -0500`] }])
	})

	it("preserves the committer's name", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.committerName).toBe(committerName)
	})

	it("omits the committer's email address", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.committerEmail).toBe("")
	})
})

describe("when the committer is absent", () => {
	beforeEach(() => {
		mockGitLog([{ committer: [] }])
	})

	it("omits the committer's name", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.committerName).toBe("")
	})

	it("omits the committer's email address", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.committerEmail).toBe("")
	})
})

describe.each`
	signature
	${"-----BEGIN SSH SIGNATURE-----\nNjI1ZTMxMzctODU1ZS00YmVmLWI0MTMtY2Q4MmI4YjZlYzE0\n-----END SSH SIGNATURE-----"}
	${"-----BEGIN PGP SIGNATURE-----\n\nNGU2NWQ0YzctN2I0OC00YWExLWE2NmUtZjg3MTZmNGY2MWJhODM4NTI1ZTEtZWY4OS00YjVjLTgwMWItOTgxNTBmOGJiOTZk\n-----END PGP SIGNATURE-----"}
`("when the commit has a signature of $signature", (props: { signature: string }) => {
	const signature = props.signature

	beforeEach(() => {
		mockGitLog([{ gpgsig: [signature] }])
	})

	it("preserves the signature", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.signature).toBe(signature)
	})
})

describe("when the commit does not have a signature", () => {
	beforeEach(() => {
		mockGitLog([{}])
	})

	it("omits the signature", async () => {
		const [commit] = await getGitBranchCrudeCommits()
		expect(commit?.signature).toBe("")
	})
})

describe("when the Git log does not have any commits", () => {
	const commitDtos = fakeGitLogCommitDtos(0)

	beforeEach(() => {
		mockGitLog(commitDtos)
	})

	it("returns an empty array of commits", async () => {
		const commits = await getGitBranchCrudeCommits()
		expect(commits).toEqual([])
	})
})

describe("when the Git log has 1 commit", () => {
	const commitDtos = fakeGitLogCommitDtos(1)

	beforeEach(() => {
		mockGitLog(commitDtos)
	})

	it("returns an array of 1 commit", async () => {
		const commits = await getGitBranchCrudeCommits()
		expect(commits).toHaveLength(1)
		expect(commits).toMatchObject<[Partial<CrudeCommit>]>([
			{
				sha: commitDtos[0].commit[0] as CommitSha,
				message: "Commit 1\n\nMore lines of text.",
			},
		])
	})
})

describe.each`
	count
	${2}
	${3}
	${4}
	${5}
	${6}
	${7}
	${8}
	${9}
	${10}
	${11}
	${12}
	${15}
	${18}
	${21}
	${30}
`("when the Git log has $count commits", (props: { count: number }) => {
	const count = props.count
	const commitDtos = fakeGitLogCommitDtos(count)

	beforeEach(() => {
		mockGitLog(commitDtos)
	})

	it(`returns an array of ${count} commits`, async () => {
		const commits = await getGitBranchCrudeCommits()
		expect(commits).toHaveLength(count)
		expect(commits).toMatchObject(
			commitDtos.map((dto, index): Partial<CrudeCommit> => ({
				sha: dto.commit[0] as CommitSha,
				message: `Commit ${index + 1}\n\nMore lines of text.`,
			})),
		)
	})
})

describe("when a Git error occurs", () => {
	beforeEach(() => {
		mockSabotagedGitLog()
	})

	it("throws an error", async () => {
		await expect(getGitBranchCrudeCommits()).rejects.toThrow(
			"Command 'git --no-pager log --format=raw --no-color origin/main..HEAD' failed with exit code 128",
		)
	})
})
