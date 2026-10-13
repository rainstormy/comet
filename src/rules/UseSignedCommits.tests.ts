import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { commitConcern } from "#rules/concerns/CommitConcern.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "useSignedCommits"

const disabled = emptyRulesetConfiguration()
const enabled = emptyRulesetConfiguration({ [rule]: { level: "error" } })

const fakeCommit = fakeCommitFactory()

describe.each`
	subject
	${"Teach the coffee machine to stop judging mugs"}
	${"shipping a tiny fix before lunch"}
`(
	"when the commit does not have a signature and has a subject of $subject",
	(props: { subject: string }) => {
		const commit = fakeCommit({ message: props.subject, signature: "" })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the entire commit", () => {
				expect(actualConcerns).toEqual<Concerns>([commitConcern(rule, commit.sha)])
			})
		})

		describe("and the rule is disabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], disabled)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		})
	},
)

describe.each`
	signature                                                                                                                                                           | subject
	${"-----BEGIN SSH SIGNATURE-----\nNWNhOTk2MWQtMWZiZS00NTg4LThiMmUtNzEzMmExMjJiM2Q5\n-----END SSH SIGNATURE-----"}                                                   | ${"Give the release notes a sensible haircut"}
	${"-----BEGIN PGP SIGNATURE-----\n\nOTI4Zjk0OWMtNjJhOS00OTk1LTkwYzEtNmU1MWYxYWE0MzdkNThmMDM4NGQtOGFjYS00ZDk5LWJjYjMtZmRiNWI1NmEzNTU4\n-----END PGP SIGNATURE-----"} | ${"put the changelog back where it belongs"}
`(
	"when the commit has a signature and has a subject of $subject",
	(props: { signature: string; subject: string }) => {
		const commit = fakeCommit({ message: props.subject, signature: props.signature })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		})

		describe("and the rule is disabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], disabled)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		})
	},
)

describe("when verifying a set of multiple commits and some commits lack a signature", () => {
	const commits: Vector<Commit, 7> = [
		fakeCommit({
			signature:
				"-----BEGIN SSH SIGNATURE-----\nYzhmNjMwODktYzA3MS00YzM5LWEyYzAtNTYyYjNjMmExMjJi\n-----END SSH SIGNATURE-----",
		}),
		fakeCommit({ signature: "" }),
		fakeCommit({ signature: "" }),
		fakeCommit({
			signature:
				"-----BEGIN SSH SIGNATURE-----\nN2YwNDUwYzktYzRhNi00YzNiLWFiMzMtYWEyYjg3MThjMDc0\n-----END SSH SIGNATURE-----",
		}),
		fakeCommit({ signature: "" }),
		fakeCommit({
			signature:
				"-----BEGIN PGP SIGNATURE-----\n\nZmMzMDA1ZjItYzdlNy00NzliLThmOTYtNjk1NWZkMzA0MGNjNmFhYTA2YzUtOWQ1Yi00YmViLWI0MzMtNzJjYmU3ZjA3OGVl\n-----END PGP SIGNATURE-----",
		}),
		fakeCommit({ signature: "" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about the commits without a signature", () => {
			expect(actualConcerns).toEqual<Concerns>([
				commitConcern(rule, commits[1].sha),
				commitConcern(rule, commits[2].sha),
				commitConcern(rule, commits[4].sha),
				commitConcern(rule, commits[6].sha),
			])
		})
	})

	describe("and the rule is disabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, disabled)

		it("does not raise any concerns", () => {
			expect(actualConcerns).toEqual<Concerns>([])
		})
	})
})

describe("when verifying a set of multiple commits and all commits have signatures", () => {
	const commits: Vector<Commit, 4> = [
		fakeCommit({
			signature:
				"-----BEGIN SSH SIGNATURE-----\nOTFhZDVjOGUtMWQxYS00NTY4LWFmNDgtOWU4Y2U2MzU5NGE2\n-----END SSH SIGNATURE-----",
		}),
		fakeCommit({
			signature:
				"-----BEGIN PGP SIGNATURE-----\n\nODk5ZTUwYTAtZDIwNi00ODY2LWEyMGItOGY0NGEwYjlmZDNmMDFkOTQzOGEtNjZiNy00MTk2LTlkYzYtMTc2MDg4MTZkMjgw\n-----END PGP SIGNATURE-----",
		}),
		fakeCommit({
			signature:
				"-----BEGIN SSH SIGNATURE-----\nMmZjYWYxMDktNWUzYS00ZmNiLWFjNTQtMmUzYzA1ODQwMGY4\n-----END SSH SIGNATURE-----",
		}),
		fakeCommit({
			signature:
				"-----BEGIN PGP SIGNATURE-----\n\nODVlYmM5MjgtMDA3NC00MjNhLTlkYTQtYWZjNThkNTJhNzU2NjY4MThlZmYtMTFhYi00ODBmLThlOWEtYzAwNGE5MmMwNjVj\n-----END PGP SIGNATURE-----",
		}),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("does not raise any concerns", () => {
			expect(actualConcerns).toEqual<Concerns>([])
		})
	})

	describe("and the rule is disabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, disabled)

		it("does not raise any concerns", () => {
			expect(actualConcerns).toEqual<Concerns>([])
		})
	})
})
