import { beforeEach, describe, expect, it } from "vitest"
import type { CrudeCommit } from "#commits/CrudeCommit.ts"
import { getGithubPullRequestCrudeCommits } from "#commits/github/GetGithubPullRequestCrudeCommits.ts"
import { fakeCommitSha } from "#types/CommitSha.fakes.ts"
import type { CommitSha } from "#types/CommitSha.ts"
import type { Vector } from "#types/Vector.ts"
import { fakeGithubCommitDtos } from "#utilities/github/api/dtos/GithubCommitDto.fakes.ts"
import type { GithubCommitUserDto } from "#utilities/github/api/dtos/GithubCommitUserDto.ts"
import type { GithubParentCommitDto } from "#utilities/github/api/dtos/GithubParentCommitDto.ts"
import { mockGithubPullRequestCommitDtos } from "#utilities/github/api/FetchGithubPullRequestCommitDtos.fakes.ts"
import {
	mockNonexistingGithubResourceDto,
	mockSabotagedGithubResourceDto,
} from "#utilities/github/api/FetchGithubResourceDto.fakes.ts"
import type { GithubUrlString } from "#utilities/github/api/GithubUrlString.ts"
import { mockGithubPullRequestEventDto } from "#utilities/github/event/FetchGithubEventDto.fakes.ts"
import type { GithubPullRequestReference } from "#utilities/github/event/GithubPullRequestReference.fakes.ts"

describe.each`
	sha
	${fakeCommitSha()}
	${fakeCommitSha()}
`("when the commit SHA is $sha", (props: { sha: CommitSha }) => {
	const sha = props.sha

	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ sha }])
	})

	it("preserves the commit SHA", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.sha).toBe(sha)
	})
})

describe("when the commit does not have a parent", () => {
	const parents: Vector<GithubParentCommitDto, 0> = []

	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ parents }])
	})

	it("has no parent SHAs", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.parents).toEqual([])
	})
})

describe.each`
	parentSha
	${fakeCommitSha()}
	${fakeCommitSha()}
`("when the commit has 1 parent with a SHA of $parentSha", (props: { parentSha: CommitSha }) => {
	const parents: Vector<GithubParentCommitDto, 1> = [{ sha: props.parentSha }]

	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ parents }])
	})

	it("preserves the parent SHA", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.parents).toEqual([parents[0].sha])
	})
})

describe("when the commit has 2 parents", () => {
	const parents: Vector<GithubParentCommitDto, 2> = [
		{ sha: fakeCommitSha() },
		{ sha: fakeCommitSha() },
	]

	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ parents }])
	})

	it("preserves both parent SHAs", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.parents).toEqual([parents[0].sha, parents[1].sha])
	})
})

describe("when the commit has 3 parents", () => {
	const parents: Vector<GithubParentCommitDto, 3> = [
		{ sha: fakeCommitSha() },
		{ sha: fakeCommitSha() },
		{ sha: fakeCommitSha() },
	]

	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ parents }])
	})

	it("preserves all parent SHAs", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.parents).toEqual([parents[0].sha, parents[1].sha, parents[2].sha])
	})
})

describe.each`
	message
	${"Release the robot butler"}
	${"some refactoring"}
`("when the commit message of $message has a single line", (props: { message: string }) => {
	const message = props.message

	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ commit: { message } }])
	})

	it("preserves the commit message as is", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
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
			mockGithubPullRequestCommitDtos([{ commit: { message } }])
		})

		it("preserves the commit message as is", async () => {
			const [commit] = await getGithubPullRequestCrudeCommits()
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
		mockGithubPullRequestCommitDtos([{ commit: { message } }])
	})

	it("preserves the commit message as is", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
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
		mockGithubPullRequestCommitDtos([{ commit: { message } }])
	})

	it("preserves the commit message as is", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
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
			mockGithubPullRequestCommitDtos([{ commit: { message } }])
		})

		it("preserves the commit message as is", async () => {
			const [commit] = await getGithubPullRequestCrudeCommits()
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
		mockGithubPullRequestCommitDtos([{ commit: { message } }])
	})

	it("preserves the commit message as is", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
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

		const author: GithubCommitUserDto = {
			name: authorName,
			email: authorEmail,
		}

		beforeEach(() => {
			mockGithubPullRequestCommitDtos([{ commit: { author } }])
		})

		it("preserves the author's name", async () => {
			const [commit] = await getGithubPullRequestCrudeCommits()
			expect(commit?.authorName).toBe(authorName)
		})

		it("preserves the author's email address", async () => {
			const [commit] = await getGithubPullRequestCrudeCommits()
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

		const author: GithubCommitUserDto = {
			name: authorName,
			email: authorEmail,
		}

		beforeEach(() => {
			mockGithubPullRequestCommitDtos([{ commit: { author } }])
		})

		it("preserves the author's name as is", async () => {
			const [commit] = await getGithubPullRequestCrudeCommits()
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

	const author: GithubCommitUserDto = {
		name: authorName,
		email: authorEmail,
	}

	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ commit: { author } }])
	})

	it("preserves the author's name as is", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.authorName).toBe(authorName)
	})
})

describe("when the author's name is absent", () => {
	const authorEmail = "25199993+noname@users.noreply.github.com"

	const author: GithubCommitUserDto = {
		email: authorEmail,
	}

	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ commit: { author } }])
	})

	it("omits the author's name", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.authorName).toBe("")
	})

	it("preserves the author's email address", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
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

		const author: GithubCommitUserDto = {
			name: authorName,
			email: authorEmail,
		}

		beforeEach(() => {
			mockGithubPullRequestCommitDtos([{ commit: { author } }])
		})

		it("preserves the author's email address as is", async () => {
			const [commit] = await getGithubPullRequestCrudeCommits()
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

	const author: GithubCommitUserDto = {
		name: authorName,
		email: authorEmail,
	}

	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ commit: { author } }])
	})

	it("preserves the author's email address as is", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.authorEmail).toBe(authorEmail)
	})
})

describe("when the author's email address is absent", () => {
	const authorName = "Unnamed 1"

	const author: GithubCommitUserDto = {
		name: authorName,
	}

	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ commit: { author } }])
	})

	it("preserves the author's name", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.authorName).toBe(authorName)
	})

	it("omits the author's email address", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.authorEmail).toBe("")
	})
})

describe("when the author is absent", () => {
	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ commit: { author: null } }])
	})

	it("omits the author's name", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.authorName).toBe("")
	})

	it("omits the author's email address", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
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

		const committer: GithubCommitUserDto = {
			name: committerName,
			email: committerEmail,
		}

		beforeEach(() => {
			mockGithubPullRequestCommitDtos([{ commit: { committer } }])
		})

		it("preserves the committer's name", async () => {
			const [commit] = await getGithubPullRequestCrudeCommits()
			expect(commit?.committerName).toBe(committerName)
		})

		it("preserves the committer's email address", async () => {
			const [commit] = await getGithubPullRequestCrudeCommits()
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

		const committer: GithubCommitUserDto = {
			name: committerName,
			email: committerEmail,
		}

		beforeEach(() => {
			mockGithubPullRequestCommitDtos([{ commit: { committer } }])
		})

		it("preserves the committer's name as is", async () => {
			const [commit] = await getGithubPullRequestCrudeCommits()
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

	const committer: GithubCommitUserDto = {
		name: committerName,
		email: committerEmail,
	}

	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ commit: { committer } }])
	})

	it("preserves the committer's name as is", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.committerName).toBe(committerName)
	})
})

describe("when the committer's name is absent", () => {
	const committerEmail = "25199993+noname@users.noreply.github.com"

	const committer: GithubCommitUserDto = {
		email: committerEmail,
	}

	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ commit: { committer } }])
	})

	it("omits the committer's name", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.committerName).toBe("")
	})

	it("preserves the committer's email address", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
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

		const committer: GithubCommitUserDto = {
			name: committerName,
			email: committerEmail,
		}

		beforeEach(() => {
			mockGithubPullRequestCommitDtos([{ commit: { committer } }])
		})

		it("preserves the committer's email address as is", async () => {
			const [commit] = await getGithubPullRequestCrudeCommits()
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

		const committer: GithubCommitUserDto = {
			name: committerName,
			email: committerEmail,
		}

		beforeEach(() => {
			mockGithubPullRequestCommitDtos([{ commit: { committer } }])
		})

		it("preserves the committer's email address as is", async () => {
			const [commit] = await getGithubPullRequestCrudeCommits()
			expect(commit?.committerEmail).toBe(committerEmail)
		})
	},
)

describe("when the committer's email address is absent", () => {
	const committerName = "Unnamed 2"

	const committer: GithubCommitUserDto = {
		name: committerName,
	}

	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ commit: { committer } }])
	})

	it("preserves the committer's name", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.committerName).toBe(committerName)
	})

	it("omits the committer's email address", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.committerEmail).toBe("")
	})
})

describe("when the committer is absent", () => {
	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ commit: { committer: null } }])
	})

	it("omits the committer's name", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.committerName).toBe("")
	})

	it("omits the committer's email address", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.committerEmail).toBe("")
	})
})

describe.each`
	signature
	${"-----BEGIN SSH SIGNATURE-----\nN2ViNGVjNmYtMzk2NC00YjUxLTg5ZTItZmJmYmQ2M2YyZGZk\n-----END SSH SIGNATURE-----"}
	${"-----BEGIN PGP SIGNATURE-----\n\nMmE2NDljNTctZTJkNi00YTg2LTllOGMtMjkyYjc3YjlhOGJiYzc3NGRiZGMtNjcxNC00NjI5LWI1ODMtNDFlMGI3YTI2ZmYw\n-----END PGP SIGNATURE-----"}
`("when the commit has a signature of $signature", (props: { signature: string }) => {
	const signature = props.signature

	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ commit: { verification: { signature } } }])
	})

	it("preserves the signature", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.signatures).toEqual([signature])
	})
})

describe("when the commit does not have a signature", () => {
	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ commit: { verification: { signature: null } } }])
	})

	it("omits the signatures", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.signatures).toEqual([])
	})
})

describe("when the commit verification object is absent", () => {
	beforeEach(() => {
		mockGithubPullRequestCommitDtos([{ commit: {} }])
	})

	it("omits the signatures", async () => {
		const [commit] = await getGithubPullRequestCrudeCommits()
		expect(commit?.signatures).toEqual([])
	})
})

describe("when the pull request does not have any commits", () => {
	const commitDtos = fakeGithubCommitDtos(0)

	beforeEach(() => {
		mockGithubPullRequestCommitDtos(commitDtos, { pageSize: 5 })
	})

	it("returns an empty array of commits", async () => {
		const commits = await getGithubPullRequestCrudeCommits()
		expect(commits).toEqual([])
	})
})

describe("when the pull request has 1 commit", () => {
	const commitDtos = fakeGithubCommitDtos(1)

	beforeEach(() => {
		mockGithubPullRequestCommitDtos(commitDtos, { pageSize: 5 })
	})

	it("returns an array of 1 commit", async () => {
		const commits = await getGithubPullRequestCrudeCommits()
		expect(commits).toHaveLength(1)
		expect(commits).toMatchObject<[Partial<CrudeCommit>]>([
			{ sha: commitDtos[0].sha, message: "Commit 1\n\nMore lines of text." },
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
`(
	"when the pull request has $count commits with an API page size of 5",
	(props: { count: number }) => {
		const count = props.count
		const commitDtos = fakeGithubCommitDtos(count)

		beforeEach(() => {
			mockGithubPullRequestCommitDtos(commitDtos, { pageSize: 5 })
		})

		it(`returns an array of ${count} commits`, async () => {
			const commits = await getGithubPullRequestCrudeCommits()
			expect(commits).toHaveLength(count)
			expect(commits).toMatchObject(
				commitDtos.map((dto, index): Partial<CrudeCommit> => ({
					sha: dto.sha,
					message: `Commit ${index + 1}\n\nMore lines of text.`,
				})),
			)
		})
	},
)

describe.each`
	count
	${3}
	${30}
	${31}
	${60}
	${61}
`(
	"when the pull request has $count commits with an API page size of 30",
	(props: { count: number }) => {
		const count = props.count
		const commitDtos = fakeGithubCommitDtos(count)

		beforeEach(() => {
			mockGithubPullRequestCommitDtos(commitDtos, { pageSize: 30 })
		})

		it(`returns an array of ${count} commits`, async () => {
			const commits = await getGithubPullRequestCrudeCommits()
			expect(commits).toHaveLength(count)
			expect(commits).toMatchObject(
				commitDtos.map((dto, index): Partial<CrudeCommit> => ({
					sha: dto.sha,
					message: `Commit ${index + 1}\n\nMore lines of text.`,
				})),
			)
		})
	},
)

describe.each`
	reference
	${"rainstormy/comet#5629"}
	${"spdiswal/vitus#239"}
`(
	"when the pull request $reference does not exist",
	(props: { reference: GithubPullRequestReference }) => {
		let resourceUrl: `${GithubUrlString}/${string}`

		beforeEach(() => {
			resourceUrl = mockGithubPullRequestEventDto(props.reference)
			mockNonexistingGithubResourceDto(resourceUrl, {
				documentationUrl: "https://docs.github.com/rest/pulls/pulls#list-commits-on-a-pull-request",
			})
		})

		it("throws an error", async () => {
			await expect(getGithubPullRequestCrudeCommits()).rejects.toThrow(
				`Failed to fetch '${resourceUrl}': 404 Not Found`,
			)
		})
	},
)

describe("when a network error occurs", () => {
	beforeEach(() => {
		const resourceUrl = mockGithubPullRequestEventDto()
		mockSabotagedGithubResourceDto(resourceUrl)
	})

	it("throws an error", async () => {
		await expect(getGithubPullRequestCrudeCommits()).rejects.toThrow("Network timeout")
	})
})
