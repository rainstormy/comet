import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import { subjectConcern } from "#rules/concerns/SubjectConcern.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"
import { fakeCommitSha } from "#types/CommitSha.fakes.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "noCapitalisedSubjects"

const disabled = emptyRulesetConfiguration()
const enabled = emptyRulesetConfiguration({ [rule]: { level: "error" } })

const fakeCommit = fakeCommitFactory()

describe.each`
	subject                                                     | expectedRange
	${"Test"}                                                   | ${[0, 1]}
	${"Release the robot butler"}                               | ${[0, 1]}
	${"  Some refactoring "}                                    | ${[2, 3]}
	${"Fix this confusing plate of spaghetti"}                  | ${[0, 1]}
	${"Never give up!!"}                                        | ${[0, 1]}
	${"fixup! Resolve a bug that thought it was a feature"}     | ${[7, 8]}
	${"squash! Make the program act like a clown"}              | ${[8, 9]}
	${"GH-12 Organise the bookshelf."}                          | ${[6, 7]}
	${"amend! Solve the problem!"}                              | ${[7, 8]}
	${" Fix it"}                                                | ${[1, 2]}
	${"#7 #8 Resolve a bug that thought it was a feature"}      | ${[6, 7]}
	${"amend! GH-55: Make the program act like a clown"}        | ${[14, 15]}
	${"I thought this was a good idea"}                         | ${[0, 1]}
	${"   WIP"}                                                 | ${[3, 4]}
	${"Ünïcödé is fun"}                                         | ${[0, 1]}
	${"`SoftIceMachineAdapter` Produce the goods that we need"} | ${[24, 25]}
	${"fixup!squash! Reapply the soft ice machine"}             | ${[14, 15]}
	${"amend!(#42)Soften the API boundaries"}                   | ${[11, 12]}
	${"`BadgeFactory` Needs a nap"}                             | ${[15, 16]}
	${"feat: Release robots"}                                   | ${[6, 7]}
	${"fixup! fix(api)!: Calm goats"}                           | ${[18, 19]}
`(
	"when the subject of $subject starts with an uppercase letter",
	(props: { subject: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subject })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the first capitalised character", () => {
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
	${"refactor the taxi module"}
	${" unsubscribe from the service"}
	${"formatting."}
	${"wip"}
	${"  fixup!  added some extra love to the code"}
	${"squash! GH-3 make the formatter happy again :)"}
	${"#7044: solve the problem"}
	${"   hunt down the bugs "}
	${"resolve issues in #21 to make the code work better"}
	${"finally..."}
	${"let `SoftIceMachineAdapter` produce the goods that we need"}
	${"`BadgeFactory` needs a nap"}
	${"feat: release rubber ducks"}
	${"fixup! fix(api)!: calm robots"}
	${"iPhone support is Ready"}
`("when the subject of $subject starts with a lowercase letter", (props: { subject: string }) => {
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
	${"..."}
	${"1337"}
	${"1 2 3 This is a test"}
	${"99 Reasons to upgrade the framework, but this is not one of them"}
	${"!WIP"}
	${"_ Marks the spot"}
	${"https://github.com/rainstormy/comet/pull/42 Release the robot butler"}
`(
	"when the subject of $subject starts with a non-letter or a hyperlink",
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
	${'Revert "Release the robot butler"'}
	${'revert "Release the robot butler"'}
	${'Revert "release the robot butler"'}
	${'fixup! Revert "Resolve a bug that thought it was a feature"'}
	${'squash!fixup! Revert "Revert "Repair the soft ice machine""'}
`("when the subject of $subject is a revert commit", (props: { subject: string }) => {
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
	${"Merge branch 'main' into feature/robot-butler"}
	${"Merge pull request #42 from rainstormy/release-the-kraken"}
	${"merge the branches"}
`(
	"when the commit with the subject of $subject is a merge commit",
	(props: { subject: string }) => {
		const commit = fakeCommit({
			message: props.subject,
			parents: [fakeCommitSha(), fakeCommitSha()],
		})

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
	${"amend!"}
	${"#12"}
`("when the subject of $subject is blank", (props: { subject: string }) => {
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

describe("when verifying a set of multiple commits and some commits have capitalised subjects", () => {
	const commits: Vector<Commit, 8> = [
		fakeCommit({ message: "Test" }),
		fakeCommit({ message: "refactor the taxi module" }),
		fakeCommit({ message: "wip" }),
		fakeCommit({ message: "Fix this confusing plate of spaghetti" }),
		fakeCommit({ message: " unsubscribe from the service" }),
		fakeCommit({
			message: "fixup! Resolve a bug that thought it was a feature",
		}),
		fakeCommit({ message: "squash! make the program act like a clown" }),
		fakeCommit({
			message: "Merge branch 'main'",
			parents: [fakeCommitSha(), fakeCommitSha()],
		}),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about the commits with capitalised subjects", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectConcern(rule, commits[0].sha, { range: [0, 1] }),
				subjectConcern(rule, commits[3].sha, { range: [0, 1] }),
				subjectConcern(rule, commits[5].sha, { range: [7, 8] }),
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

describe("when verifying a set of multiple commits and all commits have lowercase subjects", () => {
	const commits: Vector<Commit, 4> = [
		fakeCommit({ message: "always use the newest data" }),
		fakeCommit({ message: "it works!" }),
		fakeCommit({ message: 'Revert "bugfix"' }),
		fakeCommit({ message: "ignore the parameter with _" }),
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
