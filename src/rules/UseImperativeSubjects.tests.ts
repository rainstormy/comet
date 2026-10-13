import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"
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

const fakeCommit = fakeCommitFactory()

describe.each`
	subjectLine                                       | expectedRange
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
`(
	"when the subject line of $subjectLine does not start with an imperative verb",
	(props: { subjectLine: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subjectLine })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the first word", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRange }),
				])
			})
		})

		describe("and the rule is enabled with a custom whitelist", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledWhitelist)

			it("raises a concern about the first word", () => {
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
`(
	"when the subject line of $subjectLine starts with an imperative verb",
	(props: { subjectLine: string }) => {
		const commit = fakeCommit({ message: props.subjectLine })

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
	},
)

describe.each`
	subjectLine                                                 | expectedRange
	${"Chatify the release notes"}                              | ${[0, 7]}
	${"GL-11 chatify the release notes into a little radio ad"} | ${[6, 13]}
	${"fixup! Deckenize the module"}                            | ${[7, 16]}
	${"dEcKeNiZe eVeRyThInG"}                                   | ${[0, 9]}
`(
	"when the subject line of $subjectLine starts with a custom whitelisted word",
	(props: { subjectLine: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subjectLine })

		describe("and the rule is enabled without a custom whitelist", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the first word", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRange }),
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
	subjectLine
	${'revert ""'}
	${'Revert "dadada"'}
	${'revert "made the console less dramatic"'}
	${'Revert "Revert "release""'}
	${'amend! Revert " formatted the code with a tiny hammer"'}
	${'squash!fixup! revert " revert " GH-67 cleanup"'}
`(
	"when the subject line of $subjectLine contains a revert marker",
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
	${"fixup! "}
	${"#12"}
`(
	"when the subject line of $subjectLine contains no significant words",
	(props: { subjectLine: string }) => {
		const commit = fakeCommit({ message: props.subjectLine })

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
	},
)

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

		it("raises concerns about the commits with non-imperative subject lines", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectLineConcern(rule, commits[1].sha, { range: [0, 10] }),
				subjectLineConcern(rule, commits[3].sha, { range: [0, 6] }),
				subjectLineConcern(rule, commits[5].sha, { range: [14, 18] }),
				subjectLineConcern(rule, commits[6].sha, { range: [6, 13] }),
			])
		})
	})

	describe("and the rule is enabled with a custom whitelist", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabledWhitelist)

		it("raises concerns about the commits with non-imperative and non-whitelisted subject lines", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectLineConcern(rule, commits[1].sha, { range: [0, 10] }),
				subjectLineConcern(rule, commits[3].sha, { range: [0, 6] }),
				subjectLineConcern(rule, commits[5].sha, { range: [14, 18] }),
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
