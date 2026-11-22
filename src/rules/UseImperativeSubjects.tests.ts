import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import { subjectConcern } from "#rules/concerns/SubjectConcern.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "useImperativeSubjects"

const disabled = emptyRulesetConfiguration()
const enabled = emptyRulesetConfiguration({
	[rule]: {
		level: "error",
		options: { whitelist: [] },
	},
})
const enabledWhitelist = emptyRulesetConfiguration({
	[rule]: {
		level: "error",
		options: { whitelist: ["chatify", "DECKENIZE"] },
	},
})

const enabledModalVerbWhitelist = emptyRulesetConfiguration({
	[rule]: {
		level: "error",
		options: { whitelist: ["Should", "won't", "does", "do not"] },
	},
})

const fakeCommit = fakeCommitFactory()

describe.each`
	subject                                           | expectedRange
	${"WIP"}                                          | ${[0, 3]}
	${"init"}                                         | ${[0, 4]}
	${"Bugfix"}                                       | ${[0, 6]}
	${"some refactoring"}                             | ${[0, 4]}
	${"Added a new feature"}                          | ${[0, 5]}
	${"Updated some dependencies"}                    | ${[0, 7]}
	${" never give up!!"}                             | ${[1, 6]}
	${"finally..."}                                   | ${[0, 7]}
	${"Formatting."}                                  | ${[0, 10]}
	${"  It works"}                                   | ${[2, 4]}
	${"always validate"}                              | ${[0, 6]}
	${"`Fix` it"}                                     | ${[0, 5]}
	${"`Service`"}                                    | ${[0, 9]}
	${"squash!  Added some extra love to the code"}   | ${[9, 14]}
	${"fixup! Solved the problem"}                    | ${[7, 13]}
	${"GH-12 organised the calendar"}                 | ${[6, 15]}
	${"amend! GH-55: made the console less dramatic"} | ${[14, 18]}
	${"upgraded react to 19.2.5"}                     | ${[0, 8]}
	${"I'd rather not!"}                              | ${[0, 3]}
	${"99 hot air balloons"}                          | ${[0, 2]}
	${"fixup! squash! #987 1 2 3 this is a test"}     | ${[20, 21]}
	${"https://github.com/rainstormy/comet/pull/42"}  | ${[0, 43]}
	${"feat: Released robots"}                        | ${[6, 14]}
	${"fixup! fix(api)!: Fixed sourdough starters"}   | ${[18, 23]}
	${"Can the legacy printer driver"}                | ${[0, 3]}
	${"should retry failed uploads"}                  | ${[0, 6]}
	${"  Will hatch the quarterly roadmap"}           | ${[2, 6]}
	${"Must not forget the umbrella"}                 | ${[0, 4]}
	${"fixup! GH-8 Won't panic on empty input"}       | ${[12, 17]}
	${"Do not feed the build server after midnight"}  | ${[0, 6]}
	${"squash! do  NOT compile on Tuesdays"}          | ${[8, 15]}
	${"feat: DO NOT water the office plants"}         | ${[6, 12]}
	${"Does not compile on Tuesdays"}                 | ${[0, 4]}
	${"Would you mind reviewing this?"}               | ${[0, 5]}
`(
	"when the subject of $subject does not start with an imperative verb",
	(props: { subject: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subject })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the first word", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectConcern(rule, commit.sha, { range: props.expectedRange }),
				])
			})
		})

		describe("and the rule is enabled with a custom whitelist", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledWhitelist)

			it("raises a concern about the first word", () => {
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
	${"fix"}
	${"test"}
	${"Add a new feature"}
	${" Format the code"}
	${"make it work"}
	${"Do the validation every time"}
	${" squash!  Unsubscribe from the service"}
	${"Merge branch 'main' into feature/office-overhaul"}
	${"GH-12 Organise the bookshelf"}
	${"fixup! Resolve a bug that thought it was a feature"}
	${" Let `SoftIceMachineAdapter` produce the goods that we need"}
	${"amend!Apply strawberry jam to make the code sweeter"}
	${"Throw a tantrum;"}
	${"Bump vite from 4.1.1 to 4.3.2"}
	${"feat: Release robots"}
	${"fixup! fix(api)!: Calm pigeons"}
	${"Do nothing until the kettle whistles"}
	${"Do notes about the release"}
	${"squash! Do  the groundwork"}
`("when the subject of $subject starts with an imperative verb", (props: { subject: string }) => {
	const commit = fakeCommit({ message: props.subject })

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns([commit], enabled)

		it("does not raise any concerns", () => {
			expect(actualConcerns).toEqual<Concerns>([])
		})
	})

	describe("and the rule is enabled with a custom whitelist", () => {
		const actualConcerns = mapCommitsToConcerns([commit], enabledWhitelist)

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
	subject                                                     | expectedRange
	${"Chatify the release notes"}                              | ${[0, 7]}
	${"GL-11 chatify the release notes into a little radio ad"} | ${[6, 13]}
	${"fixup! Deckenize the module"}                            | ${[7, 16]}
	${"dEcKeNiZe eVeRyThInG"}                                   | ${[0, 9]}
`(
	"when the subject of $subject starts with a custom whitelisted word",
	(props: { subject: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subject })

		describe("and the rule is enabled without a custom whitelist", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the first word", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectConcern(rule, commit.sha, { range: props.expectedRange }),
				])
			})
		})

		describe("and the rule is enabled with a custom whitelist", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledWhitelist)

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
	subject                                          | expectedRange
	${"should we rename the coffee machine?"}        | ${[0, 6]}
	${"squash! Won't leak secrets into the logs"}    | ${[8, 13]}
	${"Does not compile on Tuesdays"}                | ${[0, 4]}
	${"Do not feed the build server after midnight"} | ${[0, 6]}
	${"DO NOT water the office plants"}              | ${[0, 6]}
	${"feat: Do not crash on empty input"}           | ${[6, 12]}
	${"fixup! do  NOT panic at the disco"}           | ${[7, 14]}
`(
	"when the subject of $subject starts with a whitelisted word or the phrase `do not`",
	(props: { subject: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subject })

		describe("and the rule is enabled with a custom whitelist", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledModalVerbWhitelist)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		})

		describe("and the rule is enabled without a whitelist", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the first word", () => {
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
	subject                                   | expectedRange
	${"Did not mean to commit this"}          | ${[0, 3]}
	${"Doing not so well today"}              | ${[0, 5]}
	${"Don't crash on empty input"}           | ${[0, 5]}
	${"don't panic at the disco"}             | ${[0, 5]}
	${"Doesn't compile on Mondays"}           | ${[0, 7]}
	${"feat: Doesn't flush the cache"}        | ${[6, 13]}
	${"Could not reproduce the crash"}        | ${[0, 5]}
	${"Will not hold the release"}            | ${[0, 4]}
	${"Shouldn't leak secrets into the logs"} | ${[0, 9]}
	${"fixup! Must not forget the umbrella"}  | ${[7, 11]}
	${"feat: Cannot decide on a name"}        | ${[6, 12]}
`(
	"when the subject of $subject starts with a word other than the phrase `do not`",
	(props: { subject: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subject })

		describe("and the rule is enabled with a custom whitelist", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledModalVerbWhitelist)

			it("raises a concern about the first word", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectConcern(rule, commit.sha, { range: props.expectedRange }),
				])
			})
		})
	},
)

describe.each`
	subject
	${'revert ""'}
	${'Revert "dadada"'}
	${'revert "made the console less dramatic"'}
	${'Revert "Revert "release""'}
	${'amend! Revert " formatted the code with a tiny hammer"'}
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
	${""}
	${" "}
	${"\t\t"}
	${"fixup! "}
	${"#12"}
`("when the subject of $subject contains no significant words", (props: { subject: string }) => {
	const commit = fakeCommit({ message: props.subject })

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns([commit], enabled)

		it("does not raise any concerns", () => {
			expect(actualConcerns).toEqual<Concerns>([])
		})
	})

	describe("and the rule is enabled with a custom whitelist", () => {
		const actualConcerns = mapCommitsToConcerns([commit], enabledWhitelist)

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

describe("when verifying a set of multiple commits and some commits do not start with an imperative verb", () => {
	const commits: Vector<Commit, 7> = [
		fakeCommit({ message: "Add a new feature" }),
		fakeCommit({ message: "formatting" }),
		fakeCommit({ message: "fixup! resolve the confusing test fixture" }),
		fakeCommit({ message: "Always validate before release" }),
		fakeCommit({ message: 'Revert "Added a noisy experiment"' }),
		fakeCommit({ message: "amend! GH-55: made the console less dramatic" }),
		fakeCommit({ message: "GL-11 chatify the release notes into a little radio ad" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about the commits with non-imperative subjects", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectConcern(rule, commits[1].sha, { range: [0, 10] }),
				subjectConcern(rule, commits[3].sha, { range: [0, 6] }),
				subjectConcern(rule, commits[5].sha, { range: [14, 18] }),
				subjectConcern(rule, commits[6].sha, { range: [6, 13] }),
			])
		})
	})

	describe("and the rule is enabled with a custom whitelist", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabledWhitelist)

		it("raises concerns about the commits with non-imperative and non-whitelisted subjects", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectConcern(rule, commits[1].sha, { range: [0, 10] }),
				subjectConcern(rule, commits[3].sha, { range: [0, 6] }),
				subjectConcern(rule, commits[5].sha, { range: [14, 18] }),
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

describe("when verifying a set of multiple commits and all commits start with an imperative verb", () => {
	const commits: Vector<Commit, 6> = [
		fakeCommit({ message: "Establish the repository" }),
		fakeCommit({ message: "Enable the coffee machine integration tests" }),
		fakeCommit({ message: 'Revert "Add a second rubber duck to the debugging kit"' }),
		fakeCommit({ message: "fixup! Paint the eggs with suspicious enthusiasm" }),
		fakeCommit({ message: " Drop the legacy spaghetti tower module" }),
		fakeCommit({ message: "Help fix the annoying bug" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("does not raise any concerns", () => {
			expect(actualConcerns).toEqual<Concerns>([])
		})
	})

	describe("and the rule is enabled with a custom whitelist", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabledWhitelist)

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
