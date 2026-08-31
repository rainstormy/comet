import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { fakeTokenConfiguration } from "#commits/TokenConfiguration.fakes.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"
import { fakeCommitSha } from "#types/CommitSha.fakes.ts"
import type { CommitSha } from "#types/CommitSha.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "useIssueLinks"

const disabled = emptyRulesetConfiguration()
const enabledAnywhere = emptyRulesetConfiguration({
	[rule]: {
		level: "error",
		options: { position: "anywhere" },
	},
})
const enabledPrefix = emptyRulesetConfiguration({
	[rule]: {
		level: "error",
		options: { position: "prefix" },
	},
})
const enabledSuffix = emptyRulesetConfiguration({
	[rule]: {
		level: "error",
		options: { position: "suffix" },
	},
})

const fakeCommit = fakeCommitFactory(
	fakeTokenConfiguration({
		issueLinks: { prefixes: ["#", "GH-", "GL-"], wildcards: ["(no-issue)", "[incident]"] },
	}),
)

describe.each`
	subjectLine                                                  | expectedRangeAnywhere | expectedRangePrefix | expectedRangeSuffix
	${"bugfix"}                                                  | ${[0, 1]}             | ${[0, 1]}           | ${[6, 7]}
	${"Convince the office printer to print in colour"}          | ${[0, 1]}             | ${[0, 1]}           | ${[46, 47]}
	${"accept `pseudocode:` as a valid keyword in the compiler"} | ${[0, 1]}             | ${[0, 1]}           | ${[55, 56]}
	${" squash! "}                                               | ${[9, 10]}            | ${[9, 10]}          | ${[9, 10]}
	${"fixup! Smoothen the rough edges"}                         | ${[7, 8]}             | ${[7, 8]}           | ${[31, 32]}
	${"Read https://github.com/rainstormy/comet/pull/42"}        | ${[0, 1]}             | ${[0, 1]}           | ${[48, 49]}
`(
	"when the subject line of $subjectLine does not contain an issue link",
	(props: {
		subjectLine: string
		expectedRangeAnywhere: CharacterRange
		expectedRangePrefix: CharacterRange
		expectedRangeSuffix: CharacterRange
	}) => {
		const commit = fakeCommit({ message: props.subjectLine })

		describe("and the rule is enabled with position 'anywhere'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledAnywhere)

			it("raises a concern about the beginning of the subject line", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRangeAnywhere }),
				])
			})
		})

		describe("and the rule is enabled with position 'prefix'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledPrefix)

			it("raises a concern about the beginning of the subject line", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRangePrefix }),
				])
			})
		})

		describe("and the rule is enabled with position 'suffix'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledSuffix)

			it("raises a concern about the end of the subject line", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRangeSuffix }),
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
	subjectLine                                                       | expectedRangeSuffix
	${"(GH-7) hotfix"}                                                | ${[13, 14]}
	${"#42 Convince the office printer to print in colour"}           | ${[50, 51]}
	${"GL-1024 keep the hamsters on the wheel"}                       | ${[38, 39]}
	${"(no-issue) you must construct additional pylons!"}             | ${[48, 49]}
	${"[incident] Unable to comply, building in progress"}            | ${[49, 50]}
	${"#1 #2 three go"}                                               | ${[14, 15]}
	${"fixup! GH-88 is the issue that explains why this code exists"} | ${[60, 61]}
`(
	"when the subject line of $subjectLine starts with an issue link",
	(props: { subjectLine: string; expectedRangeSuffix: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subjectLine })

		describe("and the rule is enabled with position 'anywhere'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledAnywhere)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		})

		describe("and the rule is enabled with position 'prefix'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledPrefix)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		})

		describe("and the rule is enabled with position 'suffix'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledSuffix)

			it("raises a concern about the end of the subject line", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRangeSuffix }),
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
	subjectLine                                                        | expectedRangePrefix
	${"hotfix (GH-7)"}                                                 | ${[0, 1]}
	${"Convince the office printer to print in colour #42"}            | ${[0, 1]}
	${"keep the hamsters on the wheel GL-1024"}                        | ${[0, 1]}
	${"one two #3 #4"}                                                 | ${[0, 1]}
	${"construction complete (no-issue)"}                              | ${[0, 1]}
	${"insufficient funds [incident]"}                                 | ${[0, 1]}
	${"squash! the issue that explains why this code exists is GH-88"} | ${[8, 9]}
`(
	"when the subject line of $subjectLine ends with an issue link",
	(props: { subjectLine: string; expectedRangePrefix: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subjectLine })

		describe("and the rule is enabled with position 'anywhere'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledAnywhere)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		})

		describe("and the rule is enabled with position 'prefix'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledPrefix)

			it("raises a concern about the start of the subject line", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRangePrefix }),
				])
			})
		})

		describe("and the rule is enabled with position 'suffix'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledSuffix)

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
	subjectLine                                              | expectedRangePrefix | expectedRangeSuffix
	${"Replace GH-42 the hamster wheel with a turbine"}      | ${[0, 1]}           | ${[46, 47]}
	${"promote #7 from staging to production on a friday"}   | ${[0, 1]}           | ${[49, 50]}
	${"fixup! Override GL-88 by shouting at the monitor"}    | ${[7, 8]}           | ${[48, 49]}
	${"there is (no-issue) here"}                            | ${[0, 1]}           | ${[24, 25]}
	${"squash! Fixed the [incident] in a matter of seconds"} | ${[8, 9]}           | ${[51, 52]}
`(
	"when the subject line of $subjectLine has an issue link in the middle",
	(props: {
		subjectLine: string
		expectedRangePrefix: CharacterRange
		expectedRangeSuffix: CharacterRange
	}) => {
		const commit = fakeCommit({ message: props.subjectLine })

		describe("and the rule is enabled with position 'anywhere'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledAnywhere)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		})

		describe("and the rule is enabled with position 'prefix'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledPrefix)

			it("raises a concern about the start of the subject line", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRangePrefix }),
				])
			})
		})

		describe("and the rule is enabled with position 'suffix'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledSuffix)

			it("raises a concern about the end of the subject line", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRangeSuffix }),
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
	${"#7 polish the rough edges off the api GH-7"}
	${"(GH-42) Admit that the bug was intentional all along [#50]"}
	${"amend! GL-9 Deploy to production on a wing and a prayer GL-9"}
	${"[incident] resolved #58"}
`(
	"when the subject line of $subjectLine starts and ends with an issue link",
	(props: { subjectLine: string }) => {
		const commit = fakeCommit({ message: props.subjectLine })

		describe.each`
			rules
			${enabledAnywhere}
			${enabledPrefix}
			${enabledSuffix}
		`(
			"and the rule is enabled with position $rules.useIssueLinks.position",
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
`(
	"when the subject line of $subjectLine contains a dependency version or a revert marker",
	(props: { subjectLine: string }) => {
		const commit = fakeCommit({ message: props.subjectLine })

		describe.each`
			rules
			${enabledAnywhere}
			${enabledPrefix}
			${enabledSuffix}
		`(
			"and the rule is enabled with position $rules.useIssueLinks.position",
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
	${[fakeCommitSha(), fakeCommitSha()]}                  | ${"Merge branch 'main' into feature/time-machine"}
	${[fakeCommitSha(), fakeCommitSha(), fakeCommitSha()]} | ${"Merge branch 'feature/robot-butler' into feature/office-overhaul"}
	${[fakeCommitSha(), fakeCommitSha()]}                  | ${"Keep the branch up to date (no ticket required)"}
`(
	"when the commit is a merge commit with $parents.length parents and has a subject line of $subjectLine",
	(props: { parents: Array<CommitSha>; subjectLine: string }) => {
		const commit = fakeCommit({ message: props.subjectLine, parents: props.parents })

		describe.each`
			rules
			${enabledAnywhere}
			${enabledPrefix}
			${enabledSuffix}
		`(
			"and the rule is enabled with position $rules.useIssueLinks.position",
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

describe("when verifying a set of multiple commits and some commits are missing issue links", () => {
	const commits: Vector<Commit, 9> = [
		fakeCommit({ message: "#42 Convince the office printer to print in colour" }),
		fakeCommit({ message: "Organise the quarterly chaos into a spreadsheet" }),
		fakeCommit({
			message: "Merge branch 'main' into feature/time-machine",
			parents: [fakeCommitSha(), fakeCommitSha()],
		}),
		fakeCommit({ message: "fixup! GL-3 Polish the rough edges off the API" }),
		fakeCommit({ message: "GH-88 is the issue that explains why this code exists" }),
		fakeCommit({ message: "squash! accept `pseudocode:` as a valid keyword in the compiler" }),
		fakeCommit({ message: "Add a message in the error log GL-99" }),
		fakeCommit({ message: 'revert "Add an emergency eject button to the legacy module"' }),
		fakeCommit({ message: "Replace #21 the hamster wheel with a turbine" }),
	]

	describe("and the rule is enabled with position 'anywhere'", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabledAnywhere)

		it("raises concerns about commits without an issue link", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectLineConcern(rule, commits[1].sha, { range: [0, 1] }),
				subjectLineConcern(rule, commits[5].sha, { range: [8, 9] }),
			])
		})
	})

	describe("and the rule is enabled with position 'prefix'", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabledPrefix)

		it("raises concerns about commits whose issue link is not at the prefix", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectLineConcern(rule, commits[1].sha, { range: [0, 1] }),
				subjectLineConcern(rule, commits[5].sha, { range: [8, 9] }),
				subjectLineConcern(rule, commits[6].sha, { range: [0, 1] }),
				subjectLineConcern(rule, commits[8].sha, { range: [0, 1] }),
			])
		})
	})

	describe("and the rule is enabled with position 'suffix'", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabledSuffix)

		it("raises concerns about commits whose issue link is not at the suffix", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectLineConcern(rule, commits[0].sha, { range: [50, 51] }),
				subjectLineConcern(rule, commits[1].sha, { range: [47, 48] }),
				subjectLineConcern(rule, commits[3].sha, { range: [46, 47] }),
				subjectLineConcern(rule, commits[4].sha, { range: [53, 54] }),
				subjectLineConcern(rule, commits[5].sha, { range: [63, 64] }),
				subjectLineConcern(rule, commits[8].sha, { range: [44, 45] }),
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

describe("when verifying a set of multiple commits and all commits start with an issue link", () => {
	const commits: Vector<Commit, 7> = [
		fakeCommit({ message: "#1 Convince the office printer to print in colour" }),
		fakeCommit({ message: "(GH-2) Organise the quarterly chaos into a spreadsheet" }),
		fakeCommit({ message: "fixup! GL-3 Polish the rough edges off the API" }),
		fakeCommit({
			message: "Merge branch 'feature/robot-butler' into feature/office-overhaul",
			parents: [fakeCommitSha(), fakeCommitSha()],
		}),
		fakeCommit({ message: "(no-issue) Refactor the spacious modules" }),
		fakeCommit({ message: 'revert "Add an emergency eject button to the legacy module"' }),
		fakeCommit({ message: "GH-4 is the issue that explains why this code exists" }),
	]

	describe.each`
		rules
		${enabledAnywhere}
		${enabledPrefix}
	`(
		"and the rule is enabled with position $rules.useIssueLinks.position",
		(configProps: { rules: RulesetConfiguration }) => {
			const actualConcerns = mapCommitsToConcerns(commits, configProps.rules)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		},
	)

	describe("and the rule is enabled with position 'suffix'", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabledSuffix)

		it("raises concerns about commits whose issue link is not at the suffix", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectLineConcern(rule, commits[0].sha, { range: [49, 50] }),
				subjectLineConcern(rule, commits[1].sha, { range: [54, 55] }),
				subjectLineConcern(rule, commits[2].sha, { range: [46, 47] }),
				subjectLineConcern(rule, commits[4].sha, { range: [40, 41] }),
				subjectLineConcern(rule, commits[6].sha, { range: [52, 53] }),
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

describe("when verifying a set of multiple commits and all commits end with an issue link", () => {
	const commits: Vector<Commit, 7> = [
		fakeCommit({
			message: "Keep the branch up to date (no ticket required)",
			parents: [fakeCommitSha(), fakeCommitSha()],
		}),
		fakeCommit({ message: "Convince the office printer to print in colour #1" }),
		fakeCommit({ message: "Organise the quarterly chaos into a spreadsheet (GH-2)" }),
		fakeCommit({ message: "fixup! Polish the rough edges off the API GL-3" }),
		fakeCommit({ message: 'revert "Add an emergency eject button to the legacy module"' }),
		fakeCommit({ message: "Activate the grand beacons [incident]" }),
		fakeCommit({ message: "the issue that explains why this code exists is GH-4" }),
	]

	describe.each`
		rules
		${enabledAnywhere}
		${enabledSuffix}
	`(
		"and the rule is enabled with position $rules.useIssueLinks.position",
		(configProps: { rules: RulesetConfiguration }) => {
			const actualConcerns = mapCommitsToConcerns(commits, configProps.rules)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		},
	)

	describe("and the rule is enabled with position 'prefix'", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabledPrefix)

		it("raises concerns about commits whose issue link is not at the prefix", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectLineConcern(rule, commits[1].sha, { range: [0, 1] }),
				subjectLineConcern(rule, commits[2].sha, { range: [0, 1] }),
				subjectLineConcern(rule, commits[3].sha, { range: [7, 8] }),
				subjectLineConcern(rule, commits[5].sha, { range: [0, 1] }),
				subjectLineConcern(rule, commits[6].sha, { range: [0, 1] }),
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

const fakeJiraStyleCommit = fakeCommitFactory(
	fakeTokenConfiguration({ issueLinks: { prefixes: ["UNICORN-"], wildcards: [] } }),
)

describe.each`
	subjectLine                                                     | expectedRangeAnywhere | expectedRangePrefix | expectedRangeSuffix
	${"#1 bugfix"}                                                  | ${[0, 1]}             | ${[0, 1]}           | ${[9, 10]}
	${"Convince the office printer to print in colour #2"}          | ${[0, 1]}             | ${[0, 1]}           | ${[49, 50]}
	${"#3 accept `pseudocode:` as a valid keyword in the compiler"} | ${[0, 1]}             | ${[0, 1]}           | ${[58, 59]}
	${" squash! "}                                                  | ${[9, 10]}            | ${[9, 10]}          | ${[9, 10]}
	${"fixup! #41 Smoothen the rough edges #42"}                    | ${[7, 8]}             | ${[7, 8]}           | ${[39, 40]}
`(
	"when the subject line of $subjectLine does not contain a Jira-style issue link",
	(props: {
		subjectLine: string
		expectedRangeAnywhere: CharacterRange
		expectedRangePrefix: CharacterRange
		expectedRangeSuffix: CharacterRange
	}) => {
		const commit = fakeJiraStyleCommit({ message: props.subjectLine })

		describe("and the rule is enabled with position 'anywhere'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledAnywhere)

			it("raises a concern about the beginning of the subject line", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRangeAnywhere }),
				])
			})
		})

		describe("and the rule is enabled with position 'prefix'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledPrefix)

			it("raises a concern about the beginning of the subject line", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRangePrefix }),
				])
			})
		})

		describe("and the rule is enabled with position 'suffix'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledSuffix)

			it("raises a concern about the end of the subject line", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRangeSuffix }),
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
	subjectLine                                                            | expectedRangeSuffix
	${"(UNICORN-7) hotfix"}                                                | ${[18, 19]}
	${"UNICORN-42 Convince the office printer to print in colour"}         | ${[57, 58]}
	${"UNICORN-1024 keep the hamsters on the wheel"}                       | ${[43, 44]}
	${"UNICORN-1 UNICORN-2 three go"}                                      | ${[28, 29]}
	${"fixup! UNICORN-88 is the issue that explains why this code exists"} | ${[65, 66]}
`(
	"when the subject line of $subjectLine starts with a Jira-style issue link",
	(props: { subjectLine: string; expectedRangeSuffix: CharacterRange }) => {
		const commit = fakeJiraStyleCommit({ message: props.subjectLine })

		describe("and the rule is enabled with position 'anywhere'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledAnywhere)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		})

		describe("and the rule is enabled with position 'prefix'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledPrefix)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		})

		describe("and the rule is enabled with position 'suffix'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledSuffix)

			it("raises a concern about the end of the subject line", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRangeSuffix }),
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
	subjectLine                                                             | expectedRangePrefix
	${"hotfix (UNICORN-7)"}                                                 | ${[0, 1]}
	${"Convince the office printer to print in colour UNICORN-42"}          | ${[0, 1]}
	${"keep the hamsters on the wheel UNICORN-1024"}                        | ${[0, 1]}
	${"one two UNICORN-3 UNICORN-4"}                                        | ${[0, 1]}
	${"squash! the issue that explains why this code exists is UNICORN-88"} | ${[8, 9]}
`(
	"when the subject line of $subjectLine ends with a Jira-style issue link",
	(props: { subjectLine: string; expectedRangePrefix: CharacterRange }) => {
		const commit = fakeJiraStyleCommit({ message: props.subjectLine })

		describe("and the rule is enabled with position 'anywhere'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledAnywhere)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		})

		describe("and the rule is enabled with position 'prefix'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledPrefix)

			it("raises a concern about the start of the subject line", () => {
				expect(actualConcerns).toEqual<Concerns>([
					subjectLineConcern(rule, commit.sha, { range: props.expectedRangePrefix }),
				])
			})
		})

		describe("and the rule is enabled with position 'suffix'", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledSuffix)

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
