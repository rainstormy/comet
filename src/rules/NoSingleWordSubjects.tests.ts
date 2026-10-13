import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import { subjectConcern } from "#rules/concerns/SubjectConcern.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "noSingleWordSubjects"

const disabled = emptyRulesetConfiguration()
const enabled = emptyRulesetConfiguration({ [rule]: { level: "error" } })

const fakeCommit = fakeCommitFactory()

describe.each`
	subject                                           | expectedRange
	${"WIP"}                                          | ${[0, 3]}
	${"wip!"}                                         | ${[0, 3]}
	${"init"}                                         | ${[0, 4]}
	${"test"}                                         | ${[0, 4]}
	${"bugfix "}                                      | ${[0, 6]}
	${"Unsubscribe"}                                  | ${[0, 11]}
	${"#flabbergastered"}                             | ${[1, 16]}
	${"HOTFIX"}                                       | ${[0, 6]}
	${" Refactor"}                                    | ${[1, 9]}
	${"  oops "}                                      | ${[2, 6]}
	${"strategy-pattern"}                             | ${[0, 16]}
	${"`Bingo`"}                                      | ${[0, 7]}
	${"`EternalWealth`"}                              | ${[0, 15]}
	${"Revert"}                                       | ${[0, 6]}
	${"#1 fix"}                                       | ${[3, 6]}
	${"(GH-31)   test"}                               | ${[10, 14]}
	${"Closes #362"}                                  | ${[0, 6]}
	${"GL-7 `Unscheduled Maintenance`"}               | ${[5, 30]}
	${"#2 #3 (GL-1) init"}                            | ${[13, 17]}
	${"fixup! WIP"}                                   | ${[7, 10]}
	${"squash!  bad"}                                 | ${[9, 12]}
	${"  amend!Hotfix"}                               | ${[8, 14]}
	${"fixup! fixup! Restored"}                       | ${[14, 22]}
	${" https://github.com/rainstormy/comet/pull/42"} | ${[1, 44]}
`(
	"when the subject of $subject contains exactly one significant word",
	(props: { subject: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subject })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the single word", () => {
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
	${""}
	${" "}
	${"\t\t"}
	${"-"}
	${".."}
	${"#1"}
	${"(GH-31)   "}
	${"#2 #3 (GL-1) "}
	${"  amend!"}
	${"fixup! fixup! "}
`(
	"when the subject of $subject is blank or contains only insignificant tokens",
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
	${'revert ""'}
	${'Revert "dadada"'}
	${'Revert "Revert "release""'}
	${'amend! Revert " redacted"'}
	${'squash!fixup! revert " revert " GH-67 cleanup"'}
`("when the subject of $subject contains a revert marker", (props: { subject: string }) => {
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

describe.each`
	subject
	${"Add a search feature for the recipe database"}
	${"Fix authentication bug in login flow"}
	${"init project"}
	${"WIP fix the dance party playlist endpoint"}
	${"Refactor the taxi booking module"}
	${"Update the soft ice machine firmware"}
	${"Let `SoftIceMachineAdapter` produce the goods"}
	${"resolve issues in #21 to make the code work"}
	${"Refactor `HotChocolateMachine`"}
	${"release 1.0.0"}
	${"amend! Upgrade React to 19.2.0 (#52)"}
	${"merged https://github.com/rainstormy/comet/pull/42"}
`("when the subject of $subject contains more than one word", (props: { subject: string }) => {
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

describe("when verifying a set of multiple commits and some commits have single-word subjects", () => {
	const commits: Vector<Commit, 8> = [
		fakeCommit({ message: "init" }),
		fakeCommit({ message: "WIP!!" }),
		fakeCommit({ message: "Add a vending machine for ideas" }),
		fakeCommit({ message: " hotfixed" }),
		fakeCommit({ message: "Refactor the onboarding wizard" }),
		fakeCommit({ message: "do-over" }),
		fakeCommit({ message: "Introduce a popcorn-based error recovery strategy" }),
		fakeCommit({ message: "do not merge" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about the commits with single-word subjects", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectConcern(rule, commits[0].sha, { range: [0, 4] }),
				subjectConcern(rule, commits[1].sha, { range: [0, 3] }),
				subjectConcern(rule, commits[3].sha, { range: [1, 9] }),
				subjectConcern(rule, commits[5].sha, { range: [0, 7] }),
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

describe("when verifying a set of multiple commits and no commits have single-word subjects", () => {
	const commits: Vector<Commit, 4> = [
		fakeCommit({ message: "Establish the repository" }),
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
