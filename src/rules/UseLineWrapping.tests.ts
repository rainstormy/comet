import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { bodyLineConcern, bodyLineConcerns } from "#rules/concerns/BodyLineConcern.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"
import { fakeCommitSha } from "#types/CommitSha.fakes.ts"
import type { CommitSha } from "#types/CommitSha.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "useLineWrapping"

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
	message                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | expectedRanges20                                                                                                | expectedRanges50                                                               | expectedRanges72
	${"prepare the launch checklist\n\nit was just a matter of time before it would cause customers to complain.\nthe monitoring dashboard now reports every tiny hiccup.\nShort note.\n\n```text\nThis fenced code line is intentionally long but remains outside the prose limit.\n```"}                                                                                                                                                                                  | ${[{ lineNumber: 1, range: [20, 73] }, { lineNumber: 2, range: [20, 55] }]}                                     | ${[{ lineNumber: 1, range: [50, 73] }, { lineNumber: 2, range: [50, 55] }]}    | ${[{ lineNumber: 1, range: [72, 73] }]}
	${"squash! refine the deploy notes\n\nthe deploy bot left a very long note about sandwiches and spectral keyboards.\nthe release train leaves at noon with snacks."}                                                                                                                                                                                                                                                                                                    | ${[{ lineNumber: 1, range: [20, 77] }, { lineNumber: 2, range: [20, 45] }]}                                     | ${[{ lineNumber: 1, range: [50, 77] }]}                                        | ${[{ lineNumber: 1, range: [72, 77] }]}
	${"Leave a breadcrumb\n\nThis line leaves a single `backtick wandering through a very long paragraph for the validator.\nThe parser now records every button click for later inspection."}                                                                                                                                                                                                                                                                              | ${[{ lineNumber: 1, range: [20, 94] }, { lineNumber: 2, range: [20, 63] }]}                                     | ${[{ lineNumber: 1, range: [50, 94] }, { lineNumber: 2, range: [50, 63] }]}    | ${[{ lineNumber: 1, range: [72, 94] }]}
	${"#42 Document the launch diary\n\nIt was just a matter of time before it would cause customers to complain.\nthe deploy bot left a very long note about sandwiches and spectral keyboards.\nA small footnote keeps the robots calm."}                                                                                                                                                                                                                                 | ${[{ lineNumber: 1, range: [20, 73] }, { lineNumber: 2, range: [20, 77] }, { lineNumber: 3, range: [20, 39] }]} | ${[{ lineNumber: 1, range: [50, 73] }, { lineNumber: 2, range: [50, 77] }]}    | ${[{ lineNumber: 1, range: [72, 73] }, { lineNumber: 2, range: [72, 77] }]}
	${'Revert "Clarify the support handoff"\n\nthe pager now points at the right team.\nThe escalation policy includes a surprisingly detailed weekend exception for tiny emergencies.\nthanks to everyone who tested the new alarm through Friday.'}                                                                                                                                                                                                                       | ${[{ lineNumber: 1, range: [20, 39] }, { lineNumber: 2, range: [20, 94] }, { lineNumber: 3, range: [20, 59] }]} | ${[{ lineNumber: 2, range: [50, 94] }, { lineNumber: 3, range: [50, 59] }]}    | ${[{ lineNumber: 2, range: [72, 94] }]}
	${"Audit the release breadcrumb\n\nRead https://github.com/rainstormy/comet/pull/42 before lunch while robots nap beside the sleepy console after midnight.\nSee https://docs.github.com/en/rest while the release captain checks every quiet corner before sunrise.\nShort note.\n\n```text\nhttps://example.com/a/very/long/fenced/path that the robot archives without complaint\nThe fenced example may continue for another line without raising a concern.\n```"} | ${[{ lineNumber: 1, range: [63, 120] }, { lineNumber: 2, range: [51, 103] }]}                                   | ${[{ lineNumber: 1, range: [93, 120] }, { lineNumber: 2, range: [81, 103] }]}  | ${[{ lineNumber: 1, range: [115, 120] }]}
	${"Document the adapter notes\n\nDocument the `RapidTransportService` adapter while the migration crew checks every quiet corner before midnight.\nThe `ReleaseLedger` parser records every button click for later inspection before sunrise.\nShort note.\n\n```markdown\n- `this` long fenced line remains outside the prose calculation.\nA second fenced line keeps the example delightfully verbose.\n```"}                                                        | ${[{ lineNumber: 1, range: [43, 112] }, { lineNumber: 2, range: [35, 90] }]}                                    | ${[{ lineNumber: 1, range: [73, 112] }, { lineNumber: 2, range: [65, 90] }]}   | ${[{ lineNumber: 1, range: [95, 112] }, { lineNumber: 2, range: [87, 90] }]}
	${"#42 Preserve the audit breadcrumb\n\nRead https://github.com/rainstormy/comet/pull/42 and keep the `ReleaseLedger` adapter available while the robots inspect the quiet archive before sunrise.\nUse `--dry-run` with https://docs.example.com/ops before the midnight deployment, then check the logs again.\nShort note.\n\n```shell\ncomet --help --verbose --explain-everything\nanother fenced line keeps the robot documentation cheerful.\n```"}              | ${[{ lineNumber: 1, range: [78, 154] }, { lineNumber: 2, range: [59, 108] }]}                                   | ${[{ lineNumber: 1, range: [108, 154] }, { lineNumber: 2, range: [89, 108] }]} | ${[{ lineNumber: 1, range: [130, 154] }]}
`(
	"when the commit message of $message contains body lines that exceed 72 characters",
	(props: {
		message: string
		expectedRanges20: Array<{ lineNumber: number; range: CharacterRange }>
		expectedRanges50: Array<{ lineNumber: number; range: CharacterRange }>
		expectedRanges72: Array<{ lineNumber: number; range: CharacterRange }>
	}) => {
		const commit = fakeCommit({ message: props.message })

		describe("and the rule is enabled with a maximum length of 20 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled20)

			it("raises concerns about the characters that exceed the limit", () => {
				expect(actualConcerns).toEqual<Concerns>(
					bodyLineConcerns(rule, commit.sha, props.expectedRanges20),
				)
			})
		})

		describe("and the rule is enabled with a maximum length of 50 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled50)

			it("raises concerns about the characters that exceed the limit", () => {
				expect(actualConcerns).toEqual<Concerns>(
					bodyLineConcerns(rule, commit.sha, props.expectedRanges50),
				)
			})
		})

		describe("and the rule is enabled with a maximum length of 72 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled72)

			it("raises concerns about the characters that exceed the limit", () => {
				expect(actualConcerns).toEqual<Concerns>(
					bodyLineConcerns(rule, commit.sha, props.expectedRanges72),
				)
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
	message                                                                                                                                                                                                                                                                                                                                  | expectedRanges20                                                                                                | expectedRanges50
	${"Bump parser to 4.12.0\n\nthe parser now records every button click for later inspection.\nShort note.\n\n```text\nThis fenced code line is intentionally long but remains outside the prose limit.\n```"}                                                                                                                             | ${[{ lineNumber: 1, range: [20, 63] }]}                                                                         | ${[{ lineNumber: 1, range: [50, 63] }]}
	${"audit nightly import\n\nthe first batch completed before sunrise.\nthe second batch needed another review before shipping.\nthe final status is green."}                                                                                                                                                                              | ${[{ lineNumber: 1, range: [20, 41] }, { lineNumber: 2, range: [20, 55] }, { lineNumber: 3, range: [20, 26] }]} | ${[{ lineNumber: 2, range: [50, 55] }]}
	${"Refresh the onboarding guide\n\n- Explain the new token rules to everyone.\n- Keep examples short and pleasantly readable for reviewers.\n- Celebrate when the robots stop complaining."}                                                                                                                                             | ${[{ lineNumber: 1, range: [20, 42] }, { lineNumber: 2, range: [20, 60] }, { lineNumber: 3, range: [20, 45] }]} | ${[{ lineNumber: 2, range: [50, 60] }]}
	${"Bump 4.12.0-beta.3 release notes\n\nversion 4.12.0-beta.3 keeps the migration notes pleasantly concise.\nthe rollback command remains available to nervous operators."}                                                                                                                                                               | ${[{ lineNumber: 1, range: [20, 67] }, { lineNumber: 2, range: [20, 60] }]}                                     | ${[{ lineNumber: 1, range: [50, 67] }, { lineNumber: 2, range: [50, 60] }]}
	${"WIP: warm the cache\n\nthe cache now warms in time for lunch and stops surprising the build."}                                                                                                                                                                                                                                        | ${[{ lineNumber: 1, range: [20, 69] }]}                                                                         | ${[{ lineNumber: 1, range: [50, 69] }]}
	${"fixup! #901 sync release metadata\n\nversion 3.8.1 is ready: ship it after lunch after one final check."}                                                                                                                                                                                                                             | ${[{ lineNumber: 1, range: [20, 66] }]}                                                                         | ${[{ lineNumber: 1, range: [50, 66] }]}
	${"Explain the release\n\nRead https://github.com/rainstormy/comet/pull/42 before lunch while robots nap beside the sleepy console"}                                                                                                                                                                                                     | ${[{ lineNumber: 1, range: [63, 104] }]}                                                                        | ${[{ lineNumber: 1, range: [93, 104] }]}
	${"Send a note\n\nReach mailto:maintainers@comet-lab.test before the deployment ceremony begins at noon"}                                                                                                                                                                                                                                | ${[{ lineNumber: 1, range: [53, 85] }]}                                                                         | ${[{ lineNumber: 1, range: [83, 85] }]}
	${"Clone the repository\n\nUse ssh://git@github.com/rainstormy/comet.git to retrieve the release notes before lunch for the team"}                                                                                                                                                                                                       | ${[{ lineNumber: 1, range: [61, 101] }]}                                                                        | ${[{ lineNumber: 1, range: [91, 101] }]}
	${"Document the curious adapter\n\nDocument the `RapidTransportService` adapter while the migration crew checks every quiet corner"}                                                                                                                                                                                                     | ${[{ lineNumber: 1, range: [43, 95] }]}                                                                         | ${[{ lineNumber: 1, range: [73, 95] }]}
	${"review the migration\n\nReview GH-291 before the migration ships and leave the audit trail clear"}                                                                                                                                                                                                                                    | ${[{ lineNumber: 1, range: [26, 72] }]}                                                                         | ${[{ lineNumber: 1, range: [56, 72] }]}
	${"Review the release\n\nRead https://github.com/rainstormy/comet/pull/42 before lunch while robots nap beside the sleepy console\nShort note.\n\n```text\nThis fenced code line is intentionally long but remains outside the prose limit.\n```"}                                                                                       | ${[{ lineNumber: 1, range: [63, 104] }]}                                                                        | ${[{ lineNumber: 1, range: [93, 104] }]}
	${"Trace the handoff\n\nRead https://github.com/rainstormy/comet/pull/42 before lunch while robots nap beside the sleepy console\nReach mailto:maintainers@comet-lab.test before the deployment ceremony begins at noon\nShort note.\n\n```text\nThis fenced code line is intentionally long but remains outside the prose limit.\n```"} | ${[{ lineNumber: 1, range: [63, 104] }, { lineNumber: 2, range: [53, 85] }]}                                    | ${[{ lineNumber: 1, range: [93, 104] }, { lineNumber: 2, range: [83, 85] }]}
`(
	"when the commit message of $message contains body lines that exceed 50 characters, but not 72 characters",
	(props: {
		message: string
		expectedRanges20: Array<{ lineNumber: number; range: CharacterRange }>
		expectedRanges50: Array<{ lineNumber: number; range: CharacterRange }>
	}) => {
		const commit = fakeCommit({ message: props.message })

		describe("and the rule is enabled with a maximum length of 20 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled20)

			it("raises concerns about the characters that exceed the limit", () => {
				expect(actualConcerns).toEqual<Concerns>(
					bodyLineConcerns(rule, commit.sha, props.expectedRanges20),
				)
			})
		})

		describe("and the rule is enabled with a maximum length of 50 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled50)

			it("raises concerns about the characters that exceed the limit", () => {
				expect(actualConcerns).toEqual<Concerns>(
					bodyLineConcerns(rule, commit.sha, props.expectedRanges50),
				)
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
	message                                                                                                                                                                                                                                                 | expectedRanges20
	${"WIP\n\nthe release train leaves at noon with snacks.\nShort note.\n\n```text\nThis fenced code line is intentionally long but remains outside the prose limit.\n```"}                                                                                | ${[{ lineNumber: 1, range: [20, 45] }]}
	${"Schedule the maintenance\n\nThe backup finishes before the morning shift.\nwatch the logs.\n\n```sh\ncomet check\n```"}                                                                                                                              | ${[{ lineNumber: 1, range: [20, 45] }]}
	${"review the cache policy\n\ncache misses now trigger a retry before lunch.\nThe warmup remains optional.\nNote.\n\n```yaml\ncache: warm\n```"}                                                                                                        | ${[{ lineNumber: 1, range: [20, 46] }, { lineNumber: 2, range: [20, 28] }]}
	${"Document one edge case\n\nthe new flag is opt-in.\nAPI note.\n\n```text\nThis example is deliberately much longer than the prose limit.\n```"}                                                                                                       | ${[{ lineNumber: 1, range: [20, 23] }]}
	${"Document the rollback\n\nThe release notes explain the fallback in detail!\nkeep it brief.\n\n```text\nA fenced example can be much longer without raising a concern.\n```"}                                                                         | ${[{ lineNumber: 1, range: [20, 49] }]}
	${"Explain the release\n\nRead https://github.com/rainstormy/comet/pull/42 before lunch and smile"}                                                                                                                                                     | ${[{ lineNumber: 1, range: [63, 71] }]}
	${"Send a note\n\nReach mailto:maintainers@comet-lab.test before noon and wave"}                                                                                                                                                                        | ${[{ lineNumber: 1, range: [53, 60] }]}
	${"Clone the repository\n\nUse ssh://git@github.com/rainstormy/comet.git before lunch and smile"}                                                                                                                                                       | ${[{ lineNumber: 1, range: [61, 68] }]}
	${"Document the curious adapter\n\nDocument the `RapidTransportService` adapter for the team"}                                                                                                                                                          | ${[{ lineNumber: 1, range: [43, 57] }]}
	${"review the migration\n\nReview GH-291 before shipping the fix"}                                                                                                                                                                                      | ${[{ lineNumber: 1, range: [26, 37] }]}
	${"Review the release\n\nRead https://github.com/rainstormy/comet/pull/42 before lunch and smile\nShort note.\n\n```text\nThis fenced code line is intentionally long but remains outside the prose limit.\n```"}                                       | ${[{ lineNumber: 1, range: [63, 71] }]}
	${"Check the release\n\nRead https://github.com/rainstormy/comet/pull/42 before lunch and smile\nReview GH-291 before shipping the fix\nShort note.\n\n```text\nThis fenced code line is intentionally long but remains outside the prose limit.\n```"} | ${[{ lineNumber: 1, range: [63, 71] }, { lineNumber: 2, range: [26, 37] }]}
`(
	"when the commit message of $message contains body lines that exceed 20 characters, but not 50 characters",
	(props: {
		message: string
		expectedRanges20: Array<{ lineNumber: number; range: CharacterRange }>
	}) => {
		const commit = fakeCommit({ message: props.message })
		describe("and the rule is enabled with a maximum length of 20 characters", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled20)

			it("raises concerns about the characters that exceed the limit", () => {
				expect(actualConcerns).toEqual<Concerns>(
					bodyLineConcerns(rule, commit.sha, props.expectedRanges20),
				)
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
	message
	${"Explain the release\n\nhttps://github.com/rainstormy/comet/releases"}
	${"Send a note\n\nmailto:maintainers@comet-lab.test"}
	${"Clone the repository\n\nssh://git@github.com/rainstormy/comet.git"}
	${"Document the curious adapter\n\n`RapidTransportService`"}
	${"Compare the list of items to the objects downloaded from the server\n\nThe line is short."}
	${"Update the handbook\n\n```text\nThis line is intentionally enormous because the robot archivist stores it verbatim without asking anyone's permission.\n```"}
	${"Record the repair command\n\nBefore the patch.\n\n```shell\ninstall --exact @elements/hydrogen@1.0.0 @elements/nitrogen@2.5.0 @elements/oxygen@2.6.0\n```\n\nAfter the patch."}
	${"Record the release review\n\nThe note stays calm.\nReviewed-by: April O'Neil <april.oneil@fastforward.com>"}
	${"Prepare the archive\n\nShort context.\nCo-authored-by: Everloving Easter Bunny <everloving.easter.bunny@example.com>\nSigned-off-by: Hamato Yoshi <hamato@nycsewers.com>"}
	${"Document the migration\n\nKeep this brief.\nBREAKING CHANGE: The old seating chart has retired after years of squeaking."}
`(
	"when the commit message of $message contains body lines that do not exceed 20 characters",
	(props: { message: string }) => {
		const commit = fakeCommit({ message: props.message })

		describe.each`
			rules
			${enabled20}
			${enabled50}
			${enabled72}
		`(
			"and the rule is enabled with a maximum length of $rules.useLineWrapping.maxLength characters",
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
	parents                                                | message
	${[fakeCommitSha(), fakeCommitSha()]}                  | ${"Merge the branches\n\nIt was just a matter of time before it would cause customers to complain."}
	${[fakeCommitSha(), fakeCommitSha(), fakeCommitSha()]} | ${"Keep the branches tidy\n\nThe deploy bot left a very long note about sandwiches and spectral keyboards."}
`(
	"when the commit is a merge commit with $parents.length parents",
	(props: { parents: Array<CommitSha>; message: string }) => {
		const commit = fakeCommit({ message: props.message, parents: props.parents })

		describe.each`
			rules
			${enabled20}
			${enabled50}
			${enabled72}
		`(
			"and the rule is enabled with a maximum length of $rules.useLineWrapping.maxLength characters",
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

describe("when verifying a set of multiple commits and some body lines are too long", () => {
	const commits: Vector<Commit, 7> = [
		fakeCommit({
			message:
				"Prepare the launch checklist\n\nIt was just a matter of time before it would cause customers to complain.",
		}),
		fakeCommit({
			message:
				"Polish the arcade cabinet\n\nThe parser now writes cheerful audit notes before opening the gate.",
		}),
		fakeCommit({
			message:
				"Refine the deploy notes\n\nThe deploy bot left a very long note about sandwiches and spectral keyboards.",
		}),
		fakeCommit({
			message: "Explain the release\n\nhttps://github.com/rainstormy/comet/releases",
		}),
		fakeCommit({
			message: "Document the curious adapter\n\n`RapidTransportService`",
		}),
		fakeCommit({
			message:
				"Leave a breadcrumb\n\nThis line leaves a single `backtick wandering through a very long paragraph for the validator.",
		}),
		fakeCommit({
			message:
				"Review the release ledger\n\nRead https://github.com/rainstormy/comet/pull/42 before lunch while robots nap beside the sleepy console after midnight.\nDocument the `RapidTransportService` adapter while the migration crew checks every quiet corner before midnight.\nShort note.\n\n```text\nA fenced example can remain long without raising a concern.\nAnother fenced line keeps the sample pleasantly verbose.\n```",
		}),
	]

	describe("and the rule is enabled with a maximum length of 20 characters", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled20)

		it("raises concerns about the commits whose body lines exceed 20 characters", () => {
			expect(actualConcerns).toEqual<Concerns>([
				bodyLineConcern(rule, commits[0].sha, { lineNumber: 1, range: [20, 73] }),
				bodyLineConcern(rule, commits[1].sha, { lineNumber: 1, range: [20, 67] }),
				bodyLineConcern(rule, commits[2].sha, { lineNumber: 1, range: [20, 77] }),
				bodyLineConcern(rule, commits[5].sha, { lineNumber: 1, range: [20, 94] }),
				bodyLineConcern(rule, commits[6].sha, { lineNumber: 1, range: [63, 120] }),
				bodyLineConcern(rule, commits[6].sha, { lineNumber: 2, range: [43, 112] }),
			])
		})
	})

	describe("and the rule is enabled with a maximum length of 50 characters", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled50)

		it("raises concerns about the commits whose body lines exceed 50 characters", () => {
			expect(actualConcerns).toEqual<Concerns>([
				bodyLineConcern(rule, commits[0].sha, { lineNumber: 1, range: [50, 73] }),
				bodyLineConcern(rule, commits[1].sha, { lineNumber: 1, range: [50, 67] }),
				bodyLineConcern(rule, commits[2].sha, { lineNumber: 1, range: [50, 77] }),
				bodyLineConcern(rule, commits[5].sha, { lineNumber: 1, range: [50, 94] }),
				bodyLineConcern(rule, commits[6].sha, { lineNumber: 1, range: [93, 120] }),
				bodyLineConcern(rule, commits[6].sha, { lineNumber: 2, range: [73, 112] }),
			])
		})
	})

	describe("and the rule is enabled with a maximum length of 72 characters", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled72)

		it("raises concerns about the commits whose body lines exceed 72 characters", () => {
			expect(actualConcerns).toEqual<Concerns>([
				bodyLineConcern(rule, commits[0].sha, { lineNumber: 1, range: [72, 73] }),
				bodyLineConcern(rule, commits[2].sha, { lineNumber: 1, range: [72, 77] }),
				bodyLineConcern(rule, commits[5].sha, { lineNumber: 1, range: [72, 94] }),
				bodyLineConcern(rule, commits[6].sha, { lineNumber: 1, range: [115, 120] }),
				bodyLineConcern(rule, commits[6].sha, { lineNumber: 2, range: [95, 112] }),
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

describe("when verifying a set of multiple commits and all body lines are acceptable", () => {
	const commits: Vector<Commit, 9> = [
		fakeCommit({ message: "Refactor the taxi module" }),
		fakeCommit({ message: "Refactor the taxi module\n\nThe line is short." }),
		fakeCommit({ message: "Compare the release ledger\n\nAll systems behave." }),
		fakeCommit({
			message: "Explain the release\n\nSee https://github.com/rainstormy/comet/releases now",
		}),
		fakeCommit({
			message: "Document the curious adapter\n\nUse the `RapidTransportService`",
		}),
		fakeCommit({
			message:
				"Update the handbook\n\n```text\nThis line is intentionally enormous because the robot archivist stores it verbatim without asking anyone's permission.\nA second fenced line keeps the archive pleasantly verbose.\n```",
		}),
		fakeCommit({
			message:
				"Refresh the status board\n\nAll systems behave.\nSee https://status.example.com now.",
		}),
		fakeCommit({
			message: "Prepare the robot handbook\n\nKeep this tidy.\nUse the `ReleaseLedger`.",
		}),
		fakeCommit({
			message: "Capture the recipe\n\n```yaml\nsteps: tiny\nowner: robot\n```",
		}),
	]

	describe.each`
		rules
		${enabled20}
		${enabled50}
		${enabled72}
	`(
		"and the rule is enabled with a maximum length of $rules.useLineWrapping.maxLength characters",
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
