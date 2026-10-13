import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"
import { fakeCommitSha } from "#types/CommitSha.fakes.ts"
import type { CommitSha } from "#types/CommitSha.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "useConciseSubjects"

const disabled = emptyRulesetConfiguration()
const enabled20 = emptyRulesetConfiguration({
	[rule]: {
		level: "error",
		options: { maxLength: 20 },
	},
})
const enabled50 = emptyRulesetConfiguration({
	[rule]: {
		level: "error",
		options: { maxLength: 50 },
	},
})
const enabled72 = emptyRulesetConfiguration({
	[rule]: {
		level: "error",
		options: { maxLength: 72 },
	},
})

const fakeCommit = fakeCommitFactory()

describe.each`
	subjectLine                                                                                                                                                                  | expectedRange20 | expectedRange50 | expectedRange72
	${"Upgrade dependency @opentelemetry/exporter-metrics-otlp-http to the newest version"}                                                                                      | ${[20, 82]}     | ${[50, 82]}     | ${[72, 82]}
	${"make a genuine attempt to fix the bugs that the users were complaining about"}                                                                                            | ${[20, 76]}     | ${[50, 76]}     | ${[72, 76]}
	${"shelve the broken cursor until the warm summer weather makes it shine again"}                                                                                             | ${[20, 75]}     | ${[50, 75]}     | ${[72, 75]}
	${"Read https://github.com/rainstormy/comet/pull/42 the release notes before lunch while robots nap beside the sleepy console"}                                              | ${[63, 122]}    | ${[93, 122]}    | ${[115, 122]}
	${"See https://docs.github.com/en/rest with https://developer.mozilla.org/en-US/docs/Web/JavaScript before lunch while robots nap beside the sleepy console after midnight"} | ${[106, 167]}   | ${[136, 167]}   | ${[158, 167]}
`(
	"when the subject line of $subjectLine exceeds 72 characters",
	(props: {
		subjectLine: string
		expectedRange20: CharacterRange
		expectedRange50: CharacterRange
		expectedRange72: CharacterRange
	}) => {
		const commit = fakeCommit({ message: props.subjectLine })

		describe("and the rule is enabled with a maximum length of 20 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled20)

			it("raises a concern about the characters that exceed the limit", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRange20 }),
				])
			})
		})

		describe("and the rule is enabled with a maximum length of 50 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled50)

			it("raises a concern about the characters that exceed the limit", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRange50 }),
				])
			})
		})

		describe("and the rule is enabled with a maximum length of 72 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled72)

			it("raises a concern about the characters that exceed the limit", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRange72 }),
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
	subjectLine                                                                   | expectedRange20 | expectedRange50
	${"retrieve data from the exclusive third-party service"}                     | ${[20, 52]}     | ${[50, 52]}
	${"Forget to close the backtick section in `RapidTransportService"}           | ${[20, 62]}     | ${[50, 62]}
	${"Compare the list of items to the objects downloaded from the server"}      | ${[20, 67]}     | ${[50, 67]}
	${"Resolve memory issues to make the code work better than it did last year"} | ${[20, 72]}     | ${[50, 72]}
`(
	"when the subject line of $subjectLine exceeds 50 characters, but not 72 characters",
	(props: {
		subjectLine: string
		expectedRange20: CharacterRange
		expectedRange50: CharacterRange
	}) => {
		const commit = fakeCommit({ message: props.subjectLine })

		describe("and the rule is enabled with a maximum length of 20 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled20)

			it("raises a concern about the characters that exceed the limit", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRange20 }),
				])
			})
		})

		describe("and the rule is enabled with a maximum length of 50 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled50)

			it("raises a concern about the characters that exceed the limit", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRange50 }),
				])
			})
		})

		describe("and the rule is enabled with a maximum length of 72 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled72)

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
	subjectLine                                                                                                                                          | expectedRange20 | expectedRange50
	${"Fixed a bug, but have probably introduced another one #510"}                                                                                      | ${[20, 54]}     | ${[50, 54]}
	${"forgot to save my changes in `BonusAdapter` before entering the merge chaos"}                                                                     | ${[20, 75]}     | ${[64, 75]}
	${"GH-291 Resolve memory issues to make the code work better than last year"}                                                                        | ${[26, 72]}     | ${[56, 72]}
	${"See release notes in https://github.com/rainstormy/comet/pull/42 before the majestic robots take a nap"}                                          | ${[20, 102]}    | ${[93, 102]}
	${"read https://docs.github.com/en/rest and https://developer.mozilla.org/en-US/docs/Web/JavaScript while mowing the lawn and feeding the goldfish"} | ${[106, 143]}   | ${[136, 143]}
`(
	"when the subject line of $subjectLine contains insignificant tokens and still exceeds 50 characters, but not 72 characters",
	(props: {
		subjectLine: string
		expectedRange20: CharacterRange
		expectedRange50: CharacterRange
	}) => {
		const commit = fakeCommit({ message: props.subjectLine })

		describe("and the rule is enabled with a maximum length of 20 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled20)

			it("raises a concern about the characters that exceed the limit", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRange20 }),
				])
			})
		})

		describe("and the rule is enabled with a maximum length of 50 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled50)

			it("raises a concern about the characters that exceed the limit", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRange50 }),
				])
			})
		})

		describe("and the rule is enabled with a maximum length of 72 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled72)

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
	subjectLine                                                                                 | expectedRange20
	${"Make the user interface less chaotic (GH-11) (GL-17)"}                                   | ${[20, 45]}
	${"<#71238> free up unclaimed disk space"}                                                  | ${[28, 37]}
	${"#1104: Upgrade rainstormy/updraft in GitHub Actions"}                                    | ${[26, 51]}
	${"`pnpm dlx` is the preferred way now"}                                                    | ${[30, 35]}
	${"revisit the boolean properties in the `IceCreamMachine` constructor"}                    | ${[20, 67]}
	${"Remove redundant call to `wrapper`"}                                                     | ${[20, 25]}
	${"Enable `firewall` protection again"}                                                     | ${[30, 34]}
	${"(GH-72): fix security vulnerability in `BridgeService`"}                                 | ${[28, 39]}
	${"Make a smile to the `camera` again"}                                                     | ${[28, 34]}
	${"revisit the glorious `MaxDPS` algorithm"}                                                | ${[20, 39]}
	${"#30 Make the `MainProgram` act like a clown"}                                            | ${[36, 43]}
	${"monitored https://status.comet-lab.test/health with the release crew"}                   | ${[56, 68]}
	${"Note to self: https://docs.github.com/en/rest to mailto:noreply@github.com after lunch"} | ${[76, 86]}
`(
	"when the subject line of $subjectLine contains insignificant tokens and still exceeds 20 characters, but not 50 characters",
	(props: { subjectLine: string; expectedRange20: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subjectLine })

		describe("and the rule is enabled with a maximum length of 20 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled20)

			it("raises a concern about the characters that exceed the limit", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRange20 }),
				])
			})
		})

		describe("and the rule is enabled with a maximum length of 50 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled50)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		})

		describe("and the rule is enabled with a maximum length of 72 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled72)

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
	${"Bump vite from 4.1.1-beta.0 to 4.3.2"}
	${"Upgrade tsgo to 7.0.0-dev.20260131.1"}
	${"squash! Downgrade the grumpy cat module from 3.1.4 to 3.0.0"}
	${"Pre-release v10.12.22-next"}
	${"Pin the Node.js image to 4af617c"}
	${'Revert "bugfix"'}
	${'revert "Organise the quarterly chaos into a spreadsheet"'}
	${'amend! Revert "retrieve data from the exclusive third-party service"'}
	${'Revert "Revert "Revert "Fix the nasty bug from yesterday"""'}
	${'fixup! revert "keep the lowercase story around long enough to exceed the limit"'}
	${'Revert "Upgrade nginx image digest to 9d739ff1ada6"'}
	${"fixup! forgot to save my changes before entering the merge chaos"}
	${"fixup! GH-291 Resolve memory issues to make the code work better than it did last year"}
	${"Squash! Make the program act like a clown"}
`(
	"when the subject line of $subjectLine contains a revert, semver, or squash token",
	(props: { subjectLine: string }) => {
		const commit = fakeCommit({ message: props.subjectLine })

		describe.each`
			rules
			${enabled20}
			${enabled50}
			${enabled72}
		`(
			"and the rule is enabled with a maximum length of $rules.useConciseSubjects.maxLength characters",
			(configProps: { rules: RulesetConfiguration }) => {
				const actualConcerns = mapCommitsToConcerns([commit], configProps.rules)

				it("does not raise any concerns", () => {
					expect(actualConcerns).toEqual<Concerns>([])
				})
			},
		)

		describe("and the rule is disabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], disabled)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		})
	},
)

describe.each`
	parents                                                | subjectLine
	${[fakeCommitSha(), fakeCommitSha()]}                  | ${"Merge branch 'main' into bugfix/dance-party-playlist"}
	${[fakeCommitSha(), fakeCommitSha(), fakeCommitSha()]} | ${"Keep my branch up to date"}
`(
	"when the commit is a merge commit with $parents.length parents",
	(props: { parents: Array<CommitSha>; subjectLine: string }) => {
		const commit = fakeCommit({ message: props.subjectLine, parents: props.parents })

		describe.each`
			rules
			${enabled20}
			${enabled50}
			${enabled72}
		`(
			"and the rule is enabled with a maximum length of $rules.useConciseSubjects.maxLength characters",
			(configProps: { rules: RulesetConfiguration }) => {
				const actualConcerns = mapCommitsToConcerns([commit], configProps.rules)

				it("does not raise any concerns", () => {
					expect(actualConcerns).toEqual<Concerns>([])
				})
			},
		)

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
	${"clean up"}
	${"test"}
	${"Refactor some stuff"}
	${"Move `RapidTransportService` up"}
	${"Upgrade React"}
	${"read first page of https://interesting.reads/a-very-long-page"}
	${"read https://github.com/rainstormy/comet/pull/42 notes"}
	${"Clone ssh://git@github.com/rainstormy/comet.git and notify mailto:noreply@github.com"}
`(
	"when the subject line of $subjectLine does not exceed 20 characters",
	(props: { subjectLine: string }) => {
		const commit = fakeCommit({ message: props.subjectLine })

		describe.each`
			rules
			${enabled20}
			${enabled50}
			${enabled72}
		`(
			"and the rule is enabled with a maximum length of $rules.useConciseSubjects.maxLength characters",
			(configProps: { rules: RulesetConfiguration }) => {
				const actualConcerns = mapCommitsToConcerns([commit], configProps.rules)

				it("does not raise any concerns", () => {
					expect(actualConcerns).toEqual<Concerns>([])
				})
			},
		)

		describe("and the rule is disabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], disabled)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		})
	},
)

describe("when verifying a set of multiple commits and some commits have long subject lines", () => {
	const commits: Vector<Commit, 12> = [
		fakeCommit({ message: "Retrieve data from the exclusive third-party service" }),
		fakeCommit({ message: "Refactor the taxi module" }),
		fakeCommit({
			message: "Downgrade dependency @opentelemetry/exporter-metrics-otlp-http to 0.100.5-beta.3",
		}),
		fakeCommit({ message: "revisit the boolean properties in the `IceCreamMachine` constructor" }),
		fakeCommit({ message: "test" }),
		fakeCommit({ message: "#728 free up unclaimed disk space" }),
		fakeCommit({ message: "Fix the bug" }),
		fakeCommit({
			message: "Compare the list of items to the objects downloaded from the premium server",
		}),
		fakeCommit({ message: "Unsubscribe from the service" }),
		fakeCommit({ message: "fixup! Unsubscribe from the service" }),
		fakeCommit({
			message:
				"Upgrade `rainstormy/github-action-validate-commit-messages in GitHub Actions` to the newest version",
		}),
		fakeCommit({
			message: "make a genuine attempt to fix the bugs that the users were complaining about",
		}),
	]

	describe("and the rule is enabled with a maximum length of 20 characters", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled20)

		it("raises concerns about the commits whose subject lines exceed 20 characters", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectLineConcern(rule, commits[0].sha, { range: [20, 52] }),
				subjectLineConcern(rule, commits[1].sha, { range: [20, 24] }),
				subjectLineConcern(rule, commits[3].sha, { range: [20, 67] }),
				subjectLineConcern(rule, commits[5].sha, { range: [24, 33] }),
				subjectLineConcern(rule, commits[7].sha, { range: [20, 75] }),
				subjectLineConcern(rule, commits[8].sha, { range: [20, 28] }),
				subjectLineConcern(rule, commits[10].sha, { range: [89, 99] }),
				subjectLineConcern(rule, commits[11].sha, { range: [20, 76] }),
			])
		})
	})

	describe("and the rule is enabled with a maximum length of 50 characters", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled50)

		it("raises concerns about the commits whose subject lines exceed 50 characters", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectLineConcern(rule, commits[0].sha, { range: [50, 52] }),
				subjectLineConcern(rule, commits[7].sha, { range: [50, 75] }),
				subjectLineConcern(rule, commits[11].sha, { range: [50, 76] }),
			])
		})
	})

	describe("and the rule is enabled with a maximum length of 72 characters", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled72)

		it("raises concerns about the commits whose subject lines exceed 72 characters", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectLineConcern(rule, commits[7].sha, { range: [72, 75] }),
				subjectLineConcern(rule, commits[11].sha, { range: [72, 76] }),
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

describe("when verifying a set of multiple commits and all commits have concise subject lines", () => {
	const commits: Vector<Commit, 6> = [
		fakeCommit({ message: "Fix the bug (GH-27)" }),
		fakeCommit({ message: "#444: refactored factory" }),
		fakeCommit({ message: "Upgrade Vitest to 4.1.2" }),
		fakeCommit({ message: 'Revert "Revert "Revert "Fix the nasty bug from yesterday"""' }),
		fakeCommit({ message: "Subscribe to the `RapidTransportService`" }),
		fakeCommit({ message: "amend!! Make the program act like a clown" }),
	]

	describe.each`
		rules
		${enabled20}
		${enabled50}
		${enabled72}
	`(
		"and the rule is enabled with a maximum length of $rules.useConciseSubjects.maxLength characters",
		(configProps: { rules: RulesetConfiguration }) => {
			const actualConcerns = mapCommitsToConcerns(commits, configProps.rules)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		},
	)

	describe("and the rule is disabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, disabled)

		it("does not raise any concerns", () => {
			expect(actualConcerns).toEqual<Concerns>([])
		})
	})
})
