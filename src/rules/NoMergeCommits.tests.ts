import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { commitConcern } from "#rules/concerns/CommitConcern.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import { fakeCommitSha } from "#types/CommitSha.fakes.ts"
import type { CommitSha } from "#types/CommitSha.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "noMergeCommits"

const disabled = emptyRulesetConfiguration()
const enabled = emptyRulesetConfiguration({ [rule]: { level: "error" } })

const fakeCommit = fakeCommitFactory()

describe.each`
	parents                                                | subject
	${[fakeCommitSha(), fakeCommitSha()]}                  | ${"Merge branch 'main' into bugfix/dance-party-playlist"}
	${[fakeCommitSha(), fakeCommitSha()]}                  | ${"Merge pull request #440 from renovate/battle-shell-7.x"}
	${[fakeCommitSha(), fakeCommitSha(), fakeCommitSha()]} | ${"amend! Merge branch 'feature/new-coffee-machine' into feature/office-overhaul"}
	${[fakeCommitSha(), fakeCommitSha(), fakeCommitSha()]} | ${"Keep my branch up to date"}
`(
	"when the commit is a merge commit with $parents.length parents and has a subject of $subject",
	(props: { parents: Array<CommitSha>; subject: string }) => {
		const commit = fakeCommit({ message: props.subject, parents: props.parents })

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
	parents              | subject
	${[]}                | ${"init"}
	${[]}                | ${"Establish the repository"}
	${[fakeCommitSha()]} | ${"just an ordinary commit"}
	${[fakeCommitSha()]} | ${"Release the robot butler"}
`(
	"when the commit is not a merge commit and has a subject of $subject",
	(props: { parents: Array<CommitSha>; subject: string }) => {
		const commit = fakeCommit({ message: props.subject, parents: props.parents })

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

describe("when verifying a set of multiple commits and some commits are merge commits", () => {
	const commits: Vector<Commit, 6> = [
		fakeCommit({ parents: [fakeCommitSha()] }),
		fakeCommit({ parents: [fakeCommitSha(), fakeCommitSha()] }),
		fakeCommit({ parents: [fakeCommitSha()] }),
		fakeCommit({ parents: [fakeCommitSha(), fakeCommitSha(), fakeCommitSha()] }),
		fakeCommit({ parents: [fakeCommitSha(), fakeCommitSha()] }),
		fakeCommit({ parents: [] }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about the merge commits", () => {
			expect(actualConcerns).toEqual<Concerns>([
				commitConcern(rule, commits[1].sha),
				commitConcern(rule, commits[3].sha),
				commitConcern(rule, commits[4].sha),
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

describe("when verifying a set of multiple commits and no commits are merge commits", () => {
	const commits: Vector<Commit, 4> = [
		fakeCommit({ parents: [fakeCommitSha()] }),
		fakeCommit({ parents: [fakeCommitSha()] }),
		fakeCommit({ parents: [fakeCommitSha()] }),
		fakeCommit({ parents: [] }),
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
