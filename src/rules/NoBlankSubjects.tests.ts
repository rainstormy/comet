import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import { subjectConcern } from "#rules/concerns/SubjectConcern.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "noBlankSubjects"

const disabled = emptyRulesetConfiguration()
const enabled = emptyRulesetConfiguration({ [rule]: { level: "error" } })

const fakeCommit = fakeCommitFactory()

describe.each`
	subject    | expectedRange
	${""}      | ${[0, 1]}
	${" "}     | ${[0, 1]}
	${"     "} | ${[0, 5]}
	${"\t\t"}  | ${[0, 2]}
	${"_"}     | ${[0, 1]}
	${"-"}     | ${[0, 1]}
	${"'"}     | ${[0, 1]}
	${"??"}    | ${[0, 2]}
	${"..."}   | ${[0, 3]}
	${"``"}    | ${[0, 2]}
`(
	"when the subject of $subject only contains whitespace or punctuation characters",
	(props: { subject: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subject })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the first character in the subject", () => {
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
	subject                                      | expectedRange
	${"#1"}                                      | ${[2, 3]}
	${"(GH-17)  "}                               | ${[7, 9]}
	${"#2 #3 (GL-1)"}                            | ${[12, 13]}
	${"fixup!"}                                  | ${[6, 7]}
	${"squash!  "}                               | ${[7, 9]}
	${"  amend!"}                                | ${[8, 9]}
	${'Revert ""'}                               | ${[6, 9]}
	${'Revert "Revert """'}                      | ${[14, 18]}
	${"fixup! fixup! "}                          | ${[13, 14]}
	${" squash!  "}                              | ${[8, 10]}
	${'amend! Revert " "'}                       | ${[13, 17]}
	${'squash!fixup! revert " revert " GH-67 "'} | ${[37, 39]}
`(
	"when the subject of $subject starts with insignificant tokens and is blank otherwise",
	(props: { subject: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subject })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the first character after the insignificant tokens", () => {
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
	${"test"}
	${"bugfix "}
	${"`1`"}
	${"init project"}
	${"Add a search feature for the recipe database"}
	${" Fix authentication bug in login flow"}
	${"Update the soft ice machine firmware"}
	${"Let `SoftIceMachineAdapter` produce the goods"}
	${"resolve issues in #21 to make the code work"}
	${"Refactor `HotChocolateMachine`"}
	${"https://github.com/rainstormy/comet/pull/42"}
	${"mailto:noreply@github.com"}
	${"Clone ssh://git@github.com/rainstormy/comet.git"}
`("when the subject of $subject is not blank", (props: { subject: string }) => {
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

describe("when verifying a set of multiple commits and some commits have blank subjects", () => {
	const commits: Vector<Commit, 6> = [
		fakeCommit({ message: "" }),
		fakeCommit({ message: "#29  " }),
		fakeCommit({ message: "Add a vending machine for ideas" }),
		fakeCommit({ message: " refactor the onboarding wizard" }),
		fakeCommit({ message: " " }),
		fakeCommit({ message: "Introduce a popcorn-based error recovery strategy" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about the commits with blank subjects", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectConcern(rule, commits[0].sha, { range: [0, 1] }),
				subjectConcern(rule, commits[1].sha, { range: [3, 5] }),
				subjectConcern(rule, commits[4].sha, { range: [0, 1] }),
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

describe("when verifying a set of multiple commits and no commits have blank subjects", () => {
	const commits: Vector<Commit, 4> = [
		fakeCommit({ message: "init" }),
		fakeCommit({ message: "Enable the coffee machine integration tests" }),
		fakeCommit({ message: 'Revert "Add a second rubber duck to the debugging kit"' }),
		fakeCommit({ message: " Drop the legacy spaghetti tower module" }),
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
