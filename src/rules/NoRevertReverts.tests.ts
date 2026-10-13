import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import { subjectConcern } from "#rules/concerns/SubjectConcern.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "noRevertReverts"

const disabled = emptyRulesetConfiguration()
const enabled = emptyRulesetConfiguration({ [rule]: { level: "error" } })

const fakeCommit = fakeCommitFactory()

describe.each`
	subject                                                                                       | expectedRange
	${'Revert "Revert "Fix the bug""'}                                                            | ${[0, 14]}
	${'Revert  "revert "Repair the soft ice machine""'}                                           | ${[0, 15]}
	${' revert " revert "Apply strawberry jam to make the code sweeter " " '}                     | ${[1, 16]}
	${'  rEvErT "REVERT   "Refactor the authentication module""'}                                 | ${[2, 16]}
	${'Revert "Revert "Revert "Fix the nasty bug"""'}                                             | ${[0, 22]}
	${' revert "revert  "revert "revert "Repair the soft ice machine """"'}                       | ${[1, 32]}
	${'fixup! Revert "Revert "Add an amazing feature""'}                                          | ${[7, 21]}
	${' squash!amend!  revert  "revert  "retrieve data from the exclusive third-party service""'} | ${[16, 31]}
`(
	"when the subject of $subject contains a revert marker with 2 or more 'revert' occurrences",
	(props: { subject: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subject })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the revert marker", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectConcern(rule, commit.sha, { range: props.expectedRange }),
				])
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
	subject
	${'Revert "Repair the soft ice machine"'}
	${'Revert "Fix a nasty bug"'}
	${'revert "Fix a nasty bug"'}
	${'REVERT "Refactor the authentication module"'}
	${' Revert "Apply strawberry jam to make the code sweeter" '}
	${'Revert  "Make the program act like a clown"'}
	${'fixup! Revert "Add an amazing feature"'}
`(
	"when the subject of $subject contains a revert marker with 1 'revert' occurrence",
	(props: { subject: string }) => {
		const commit = fakeCommit({ message: props.subject })

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

describe.each`
	subject
	${""}
	${" "}
	${"\t\t"}
	${"Refactor the taxi module"}
	${" Unsubscribe from the service"}
	${"Formatting."}
	${"WIP"}
	${"Fix the bug"}
	${"   Hunt down the bugs "}
	${"fixup! Add an amazing feature"}
	${"squash! Make the program act like a clown"}
	${'#7044: Revert "Unsolve the problem"'}
	${"Time to revert it"}
	${'Not a Revert "thing"'}
	${"Revert the last change"}
	${"Reverted some secret stuff"}
	${'fix: Revert "something"'}
`("when the subject of $subject does not contain a revert marker", (props: { subject: string }) => {
	const commit = fakeCommit({ message: props.subject })

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
})

describe("when verifying a set of multiple commits and some commits have revert markers with 2 or more 'revert' occurrences", () => {
	const commits: Vector<Commit, 9> = [
		fakeCommit({ message: 'Revert "Revert "Fix the bug""' }),
		fakeCommit({ message: 'Revert "Repair the soft ice machine"' }),
		fakeCommit({ message: "Refactor the taxi module" }),
		fakeCommit({ message: 'squash! Revert "Revert "Fix the bug""' }),
		fakeCommit({ message: "WIP" }),
		fakeCommit({ message: ' revert "revert "WIP""' }),
		fakeCommit({ message: 'Revert "Revert "Revert "Add an amazing feature"""' }),
		fakeCommit({ message: " Unsubscribe from the service" }),
		fakeCommit({ message: "Fix the bug" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about the commits with double revert markers", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectConcern(rule, commits[0].sha, { range: [0, 14] }),
				subjectConcern(rule, commits[3].sha, { range: [8, 22] }),
				subjectConcern(rule, commits[5].sha, { range: [1, 15] }),
				subjectConcern(rule, commits[6].sha, { range: [0, 22] }),
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

describe("when verifying a set of multiple commits and no commits have revert markers with 2 or more 'revert' occurrences", () => {
	const commits: Vector<Commit, 6> = [
		fakeCommit({ message: 'Revert "Repair the soft ice machine"' }),
		fakeCommit({ message: "Fix the bug" }),
		fakeCommit({ message: 'fixup! Revert "Repair the soft ice machine"' }),
		fakeCommit({ message: "Time to revert it" }),
		fakeCommit({ message: 'Revert "Time to revert it"' }),
		fakeCommit({ message: "1 2 3 this is a test" }),
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
