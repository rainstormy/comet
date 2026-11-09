import { describe, expect, it } from "vitest"
import { mapCrudeCommitToCommit } from "#commits/Commit.ts"
import { fakeCrudeCommit } from "#commits/CrudeCommit.fakes.ts"
import { fakeTokenConfiguration } from "#commits/TokenConfiguration.fakes.ts"
import { fakeCommitSha } from "#types/CommitSha.fakes.ts"
import type { CommitSha } from "#types/CommitSha.ts"

const configuration = fakeTokenConfiguration()

describe.each`
	sha
	${fakeCommitSha()}
	${fakeCommitSha()}
`("when the commit SHA is $sha", (props: { sha: CommitSha }) => {
	const crudeCommit = fakeCrudeCommit({ sha: props.sha })

	it("preserves the commit SHA", () => {
		const commit = mapCrudeCommitToCommit(crudeCommit, configuration)
		expect(commit.sha).toBe(props.sha)
	})
})

describe("when the commit has no parents", () => {
	const crudeCommit = fakeCrudeCommit({ parents: [] })

	it("is not a merge commit", () => {
		const commit = mapCrudeCommitToCommit(crudeCommit, configuration)
		expect(commit.isMergeCommit).toBe(false)
	})
})

describe("when the commit has one parent", () => {
	const crudeCommit = fakeCrudeCommit({ parents: [fakeCommitSha()] })

	it("is not a merge commit", () => {
		const commit = mapCrudeCommitToCommit(crudeCommit, configuration)
		expect(commit.isMergeCommit).toBe(false)
	})
})

describe("when the commit has two parents", () => {
	const crudeCommit = fakeCrudeCommit({ parents: [fakeCommitSha(), fakeCommitSha()] })

	it("is a merge commit", () => {
		const commit = mapCrudeCommitToCommit(crudeCommit, configuration)
		expect(commit.isMergeCommit).toBe(true)
	})
})

describe("when the commit has three parents", () => {
	const crudeCommit = fakeCrudeCommit({
		parents: [fakeCommitSha(), fakeCommitSha(), fakeCommitSha()],
	})

	it("is a merge commit", () => {
		const commit = mapCrudeCommitToCommit(crudeCommit, configuration)
		expect(commit.isMergeCommit).toBe(true)
	})
})

describe.each`
	authorName
	${"tmnt"}
	${"renovate[bot]"}
	${"Nimbus (Bot)"}
`("when the author's name is $authorName", (props: { authorName: string }) => {
	const crudeCommit = fakeCrudeCommit({ authorName: props.authorName })

	it("preserves the author's name", () => {
		const commit = mapCrudeCommitToCommit(crudeCommit, configuration)
		expect(commit.authorName).toBe(props.authorName)
	})
})

describe.each`
	authorEmail
	${"tmnt@fastforward.com"}
	${"29139614+renovate[bot]@users.noreply.github.com"}
	${"146315497+rainstormybot-nimbus@users.noreply.github.com"}
`("when the author's email address is $authorEmail", (props: { authorEmail: string }) => {
	const crudeCommit = fakeCrudeCommit({ authorEmail: props.authorEmail })

	it("preserves the author's email address", () => {
		const commit = mapCrudeCommitToCommit(crudeCommit, configuration)
		expect(commit.authorEmail).toBe(props.authorEmail)
	})
})

describe.each`
	committerName
	${"baxter.stockman"}
	${"GitHub"}
	${"Michelangelo di Lodovico Buonarroti Simoni"}
`("when the committer's name is $committerName", (props: { committerName: string }) => {
	const crudeCommit = fakeCrudeCommit({ committerName: props.committerName })

	it("preserves the committer's name", () => {
		const commit = mapCrudeCommitToCommit(crudeCommit, configuration)
		expect(commit.committerName).toBe(props.committerName)
	})
})

describe.each`
	committerEmail
	${"baxter.stockman@fastforward.com"}
	${"noreply@github.com"}
	${"28317649+cowabunga@users.noreply.github.com"}
`("when the committer's email address is $committerEmail", (props: { committerEmail: string }) => {
	const crudeCommit = fakeCrudeCommit({ committerEmail: props.committerEmail })

	it("preserves the committer's email address", () => {
		const commit = mapCrudeCommitToCommit(crudeCommit, configuration)
		expect(commit.committerEmail).toBe(props.committerEmail)
	})
})

describe("when the commit signature is non-empty", () => {
	const crudeCommit = fakeCrudeCommit({
		signature:
			"-----BEGIN SSH SIGNATURE-----\n" +
			"MzEwM2JkMTMtNmJiMy00N2YxLWEyNTUtOWMxZmFmYTAyMGZlNDI3MWYyMmEtMjU4MS00YTky\n" +
			"LWFhNTEtMjI5YjRiZWIxYzMxNTZiMzAwYmMtYmU5ZC00NjUxLWFmODAtY2U3N2I2NmZmNDIy\n" +
			"-----END SSH SIGNATURE-----",
	})

	it("has a signature", () => {
		const commit = mapCrudeCommitToCommit(crudeCommit, configuration)
		expect(commit.hasSignature).toBe(true)
	})
})

describe("when the commit signature is empty", () => {
	const crudeCommit = fakeCrudeCommit({ signature: "" })

	it("does not have a signature", () => {
		const commit = mapCrudeCommitToCommit(crudeCommit, configuration)
		expect(commit.hasSignature).toBe(false)
	})
})

describe("when the commit signature is unknown", () => {
	const crudeCommit = fakeCrudeCommit({ signature: null })

	it("has an unknown signature", () => {
		const commit = mapCrudeCommitToCommit(crudeCommit, configuration)
		expect(commit.hasSignature).toBeNull()
	})
})
