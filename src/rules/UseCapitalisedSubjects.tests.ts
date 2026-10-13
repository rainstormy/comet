import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "useCapitalisedSubjects"

const disabled = emptyRulesetConfiguration()
const enabled = emptyRulesetConfiguration({ [rule]: { level: "error" } })

const fakeCommit = fakeCommitFactory()

describe.each`
	subjectLine                                                      | expectedRange
	${"test"}                                                        | ${[0, 1]}
	${"release the robot butler"}                                    | ${[0, 1]}
	${"  some refactoring "}                                         | ${[2, 3]}
	${"fix this confusing plate of spaghetti"}                       | ${[0, 1]}
	${"never give up!!"}                                             | ${[0, 1]}
	${"fixup! resolve a bug that thought it was a feature"}          | ${[7, 8]}
	${"squash! make the program act like a clown"}                   | ${[8, 9]}
	${"GH-12 organise the bookshelf."}                               | ${[6, 7]}
	${"amend! solve the problem!"}                                   | ${[7, 8]}
	${" fix it"}                                                     | ${[1, 2]}
	${"#7 #8 resolve a bug that thought it was a feature"}           | ${[6, 7]}
	${"amend! GH-55: make the program act like a clown"}             | ${[14, 15]}
	${"i thought this was a good idea"}                              | ${[0, 1]}
	${"   wip"}                                                      | ${[3, 4]}
	${'revert "fix a nasty bug"'}                                    | ${[0, 1]}
	${'squash!fixup! revert "Revert "Repair the soft ice machine""'} | ${[14, 15]}
`(
	"when the subject line of $subjectLine starts with a lowercase letter",
	(props: { subjectLine: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subjectLine })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the first non-capitalised character", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRange }),
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
	subjectLine
	${"Refactor the taxi module"}
	${" Unsubscribe from the service"}
	${"Formatting."}
	${"WIP"}
	${"amend!(#42)Soften the API boundaries"}
	${"  fixup!  Added some extra love to the code"}
	${"squash! GH-3 Make the formatter happy again :)"}
	${"#7044: Solve the problem"}
	${'Revert "Release the robot butler"'}
	${"   Hunt down the bugs "}
	${"Compare the list of items to the objects downloaded from the server"}
	${"Resolve issues in #21 to make the code work better"}
	${"Finally..."}
	${"Let `SoftIceMachineAdapter` produce the goods that we need"}
	${'Revert "release the robot butler"'}
	${'fixup! Revert "Resolve a bug that thought it was a feature"'}
`(
	"when the subject line of $subjectLine starts with an uppercase letter",
	(props: { subjectLine: string }) => {
		const commit = fakeCommit({ message: props.subjectLine })

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
	subjectLine
	${"..."}
	${"1337"}
	${"1 2 3 this is a test"}
	${"99 reasons to upgrade the framework, but this is not one of them"}
	${"!wip"}
	${"_ marks the spot"}
	${"https://github.com/rainstormy/comet/pull/42 release the robot butler"}
`(
	"when the subject line of $subjectLine starts with a non-letter or a hyperlink",
	(props: { subjectLine: string }) => {
		const commit = fakeCommit({ message: props.subjectLine })

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
	subjectLine
	${""}
	${" "}
	${"\t\t"}
	${"amend!"}
	${"#12"}
`("when the subject line of $subjectLine is blank", (props: { subjectLine: string }) => {
	const commit = fakeCommit({ message: props.subjectLine })

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

describe("when verifying a set of multiple commits and some commits have non-capitalised subject lines", () => {
	const commits: Vector<Commit, 7> = [
		fakeCommit({ message: "test" }),
		fakeCommit({ message: "Refactor the taxi module" }),
		fakeCommit({ message: "WIP" }),
		fakeCommit({ message: "fix this confusing plate of spaghetti" }),
		fakeCommit({ message: " Unsubscribe from the service" }),
		fakeCommit({
			message: "fixup! resolve a bug that thought it was a feature",
		}),
		fakeCommit({ message: "squash! Make the program act like a clown" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about the commits with non-capitalised subject lines", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectLineConcern(rule, commits[0].sha, { range: [0, 1] }),
				subjectLineConcern(rule, commits[3].sha, { range: [0, 1] }),
				subjectLineConcern(rule, commits[5].sha, { range: [7, 8] }),
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

describe("when verifying a set of multiple commits and all commits have capitalised subject lines", () => {
	const commits: Vector<Commit, 4> = [
		fakeCommit({ message: "Always use the newest data" }),
		fakeCommit({ message: "It works!" }),
		fakeCommit({ message: 'Revert "Bugfix"' }),
		fakeCommit({ message: "Ignore the parameter with _" }),
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
