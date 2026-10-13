import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { bodyLineConcern, bodyLineConcerns } from "#rules/concerns/BodyLineConcern.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "noRestrictedTrailers"

const disabled = emptyRulesetConfiguration()
const enabledNone = emptyRulesetConfiguration({
	[rule]: {
		level: "error",
		options: { restrictedKeys: [] },
	},
})
const enabled1 = emptyRulesetConfiguration({
	[rule]: {
		level: "error",
		options: { restrictedKeys: ["signed-off-by"] },
	},
})
const enabled2 = emptyRulesetConfiguration({
	[rule]: {
		level: "error",
		options: { restrictedKeys: ["co-authored-by", "breaking change"] },
	},
})
const enabled3 = emptyRulesetConfiguration({
	[rule]: {
		level: "error",
		options: { restrictedKeys: ["co-authored-by:", "refs:", "reviewed-by"] },
	},
})

const fakeCommit = fakeCommitFactory()

describe.each`
	message                                                                                                                                                                                                                                                        | expectedRanges1                                                                                              | expectedRanges2                                                           | expectedRanges3
	${"keep the audit trail warm\nsigned-off-by: casey jones <casey.jones@fastforward.com>"}                                                                                                                                                                       | ${[{ lineNumber: 0, range: [0, 13] }]}                                                                       | ${[]}                                                                     | ${[]}
	${"Calibrate the hot chocolate machine\nThe pressure now stays pleasantly dramatic.\n Signed-off-by:Michelangelo di Lodovico Buonarroti Simoni <28317649+cowabunga@users.noreply.github.com>"}                                                                 | ${[{ lineNumber: 1, range: [1, 14] }]}                                                                       | ${[]}                                                                     | ${[]}
	${"Document the pizza protocol\n\nFor the record, it goes like this:\n1. Invite everyone over for pizza and movie night.\n2. Order plenty of pizza, especially the legendary no. 12\n3. Have fun!!\n\n  SIGNED-OFF-BY:   Hamato Yoshi <hamato@nycsewers.com>"} | ${[{ lineNumber: 6, range: [2, 15] }]}                                                                       | ${[]}                                                                     | ${[]}
	${"triple-check the sign-off drawer\n\nsigned-off-by :  April O'Neil <april.oneil@fastforward.com>\nsigned-off-by:Casey Jones <casey.jones@fastforward.com>\nSIGNED-OFF-BY: Hamato Yoshi <hamato@nycsewers.com>"}                                              | ${[{ lineNumber: 1, range: [0, 13] }, { lineNumber: 2, range: [0, 13] }, { lineNumber: 3, range: [0, 13] }]} | ${[]}                                                                     | ${[]}
	${"Pack the deploy snacks\n\nAcked-by: Casey Jones <casey.jones@fastforward.com>\nSigned-off-by: April O'Neil <april.oneil@fastforward.com>\nRelates-to: snack table"}                                                                                         | ${[{ lineNumber: 2, range: [0, 13] }]}                                                                       | ${[]}                                                                     | ${[]}
	${"one link and two notes\n\nsigned-off-by: april o'neil <april.oneil@fastforward.com>\nrefs: #668182\nchange-id: deadc0de"}                                                                                                                                   | ${[{ lineNumber: 1, range: [0, 13] }]}                                                                       | ${[]}                                                                     | ${[{ lineNumber: 2, range: [0, 4] }]}
	${"stamp the baseball\n\nChange-Id: cafebeef\nReviewed-by: April O'Neil <april.oneil@fastforward.com>\nSigned-off-by: Casey Jones <casey.jones@example.com>"}                                                                                                  | ${[{ lineNumber: 3, range: [0, 13] }]}                                                                       | ${[]}                                                                     | ${[{ lineNumber: 2, range: [0, 11] }]}
	${"release train part 1\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>\nBREAKING CHANGE: The old seating chart is gone.\nSigned-off-by: April O'Neil <april.oneil@fastforward.com>"}                                                  | ${[{ lineNumber: 3, range: [0, 13] }]}                                                                       | ${[{ lineNumber: 1, range: [0, 14] }, { lineNumber: 2, range: [0, 15] }]} | ${[{ lineNumber: 1, range: [0, 14] }]}
	${"Record the quiet acknowledgements\n\nBREAKING CHANGE:"}                                                                                                                                                                                                     | ${[]}                                                                                                        | ${[{ lineNumber: 1, range: [0, 15] }]}                                    | ${[]}
	${"Teach the build script a new trick\n\n breaking change: The old spell is gone."}                                                                                                                                                                            | ${[]}                                                                                                        | ${[{ lineNumber: 1, range: [1, 16] }]}                                    | ${[]}
	${"Break the old thing twice, politely\n\nBREAKING CHANGE: The old switch has left town.\nbreaking change: The old hallway is also closed."}                                                                                                                   | ${[]}                                                                                                        | ${[{ lineNumber: 1, range: [0, 15] }, { lineNumber: 2, range: [0, 15] }]} | ${[]}
	${"Update src/main.ts\n\nCo-Authored-By: Everloving Easter Bunny <everloving.easter.bunny@example.com>"}                                                                                                                                                       | ${[]}                                                                                                        | ${[{ lineNumber: 1, range: [0, 14] }]}                                    | ${[{ lineNumber: 1, range: [0, 14] }]}
	${"Refine the button wobble\n\nThe wobble is now intentional.\n\nCO-AUTHORED-BY: Michelangelo di Lodovico Buonarroti Simoni <28317649+cowabunga@users.noreply.github.com>"}                                                                                    | ${[]}                                                                                                        | ${[{ lineNumber: 3, range: [0, 14] }]}                                    | ${[{ lineNumber: 3, range: [0, 14] }]}
	${"Wire the release breadcrumb trail\n\nReviewed-By: April O'Neil <april.oneil@fastforward.com>\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>\nSigned-Off-By: Hamato Yoshi <hamato@nycsewers.com>\nRefs: #123"}                                     | ${[{ lineNumber: 3, range: [0, 13] }]}                                                                       | ${[{ lineNumber: 2, range: [0, 14] }]}                                    | ${[{ lineNumber: 1, range: [0, 11] }, { lineNumber: 2, range: [0, 14] }, { lineNumber: 4, range: [0, 4] }]}
	${"link the quiet paperwork\n\nrefs: #123"}                                                                                                                                                                                                                    | ${[]}                                                                                                        | ${[]}                                                                     | ${[{ lineNumber: 1, range: [0, 4] }]}
	${"Upgrade `BadgePrinter`\n\nThe queue no longer panics.\n\n Refs: #1648\nRefs: GH-21523"}                                                                                                                                                                     | ${[]}                                                                                                        | ${[]}                                                                     | ${[{ lineNumber: 3, range: [1, 5] }, { lineNumber: 4, range: [0, 4] }]}
	${"line up the approval stamps\n\nRefs: https://github.com/rainstormy/comet/issues/38"}                                                                                                                                                                        | ${[]}                                                                                                        | ${[]}                                                                     | ${[{ lineNumber: 1, range: [0, 4] }]}
	${"handbook renewed\nthe checklist learned some manners\nREVIEWED-BY: Copilot <223556219+Copilot@users.noreply.github.com>"}                                                                                                                                   | ${[]}                                                                                                        | ${[]}                                                                     | ${[{ lineNumber: 1, range: [0, 11] }]}
	${"Credit the careful reviewers\n\nReviewed-by: April O'Neil <april.oneil@fastforward.com>\nReviewed-By: Raph <theraffaelloexperience@tmnt.com>\nReviewed-by: Donatello <42069849+gogogadget@users.noreply.github.com>"}                                       | ${[]}                                                                                                        | ${[]}                                                                     | ${[{ lineNumber: 1, range: [0, 11] }, { lineNumber: 2, range: [0, 11] }, { lineNumber: 3, range: [0, 11] }]}
`(
	"when the commit message of $message contains restricted trailers",
	(props: {
		message: string
		expectedRanges1: Array<{ lineNumber: number; range: CharacterRange }>
		expectedRanges2: Array<{ lineNumber: number; range: CharacterRange }>
		expectedRanges3: Array<{ lineNumber: number; range: CharacterRange }>
	}) => {
		const commit = fakeCommit({ message: props.message })

		describe.each`
			rules       | expectedRanges
			${enabled1} | ${props.expectedRanges1}
			${enabled2} | ${props.expectedRanges2}
			${enabled3} | ${props.expectedRanges3}
		`(
			"and the rule is enabled with restrictions on $rules.noRestrictedTrailers.restrictedKeys",
			(configProps: {
				rules: RulesetConfiguration
				expectedRanges: Array<{ lineNumber: number; range: CharacterRange }>
			}) => {
				const actualConcerns = mapCommitsToConcerns([commit], configProps.rules)

				it(
					// oxlint-disable-next-line jest/no-conditional-in-test, vitest/valid-title -- The conditional expression only affects the test name.
					configProps.expectedRanges.length > 0
						? "raises concerns about the disallowed trailer keys"
						: "does not raise any concerns",
					() => {
						expect(actualConcerns).toEqual<Concerns>(
							bodyLineConcerns(rule, commit.sha, configProps.expectedRanges),
						)
					},
				)
			},
		)

		describe("and the rule is enabled with no restricted trailers", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledNone)

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
	${"init"}
	${"refs: this looked official for a moment."}
	${"Signed-off-by: April O'Neil <april.oneil@fastforward.com>"}
	${"Explain the suspicious label\nRefs: This looked official for a moment.\nThen the paragraph kept going."}
	${"Do some pair programming\n\nCo-authored-by: Gon Freecss <rock.paper.scissors@hunters.com>\n\nAll participants had fun."}
	${"Resolve the conflicts\n\nConflicts:\n\n src/main.ts\n src/tests.ts"}
	${"move trailers to the garage\n\nchange-id: 0ff1ce\nacked-by: casey jones <casey.jones@example.com>\nrelates-to: snack table"}
	${"Swap the config keys\n\nThe old key now takes a nap."}
`(
	"when the commit message of $message does not contain any restricted trailers",
	(props: { message: string }) => {
		const commit = fakeCommit({ message: props.message })

		describe.each`
			rules
			${enabled1}
			${enabled2}
			${enabled3}
		`(
			"and the rule is enabled with restrictions on $rules.noRestrictedTrailers.restrictedKeys",
			(configProps: { rules: RulesetConfiguration }) => {
				const actualConcerns = mapCommitsToConcerns([commit], configProps.rules)

				it("does not raise any concerns", () => {
					expect(actualConcerns).toEqual<Concerns>([])
				})
			},
		)

		describe("and the rule is enabled with no restricted trailers", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabledNone)

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

describe("when verifying a set of multiple commits and some commits contain restricted trailers", () => {
	const commits: Vector<Commit, 7> = [
		fakeCommit({ message: "Refactor the taxi module\n\nThe meter now accepts exact change." }),
		fakeCommit({
			message:
				"Update src/main.ts\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>\n Reviewed-by: Leonardo da Vinci <71091436+katanaturtle@users.noreply.github.com>",
		}),
		fakeCommit({
			message:
				"credit the careful reviewers\n\nreviewed-by: April O'Neil <april.oneil@fastforward.com>",
		}),
		fakeCommit({
			message:
				"Explain the suspicious label\nRefs: This looked official for a moment.\nThen the paragraph kept going.",
		}),
		fakeCommit({ message: "fix this confusing plate of spaghetti" }),
		fakeCommit({ message: "Record the quiet acknowledgements\n\nBREAKING CHANGE:" }),
		fakeCommit({
			message: "squash! serve the tiny sandwiches\n guests get fewer crumbs in the keyboard",
		}),
	]

	describe.each`
		rules       | expectedConcerns
		${enabled1} | ${[]}
		${enabled2} | ${[bodyLineConcern(rule, commits[1].sha, { lineNumber: 1, range: [0, 14] }), bodyLineConcern(rule, commits[5].sha, { lineNumber: 1, range: [0, 15] })]}
		${enabled3} | ${[bodyLineConcern(rule, commits[1].sha, { lineNumber: 1, range: [0, 14] }), bodyLineConcern(rule, commits[1].sha, { lineNumber: 2, range: [1, 12] }), bodyLineConcern(rule, commits[2].sha, { lineNumber: 1, range: [0, 11] })]}
	`(
		"and the rule is enabled with restrictions on $rules.noRestrictedTrailers.restrictedKeys",
		(configProps: { rules: RulesetConfiguration; expectedConcerns: Concerns }) => {
			const actualConcerns = mapCommitsToConcerns(commits, configProps.rules)

			it(
				// oxlint-disable-next-line jest/no-conditional-in-test, vitest/valid-title -- The conditional expression only affects the test name.
				configProps.expectedConcerns.length > 0
					? "raises concerns about the disallowed trailer keys"
					: "does not raise any concerns",
				() => {
					expect(actualConcerns).toEqual(configProps.expectedConcerns)
				},
			)
		},
	)

	describe("and the rule is enabled with no restricted trailers", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabledNone)

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

describe("when verifying a set of multiple commits and no commits contain restricted trailers", () => {
	const commits: Vector<Commit, 8> = [
		fakeCommit({
			message:
				"fix a longstanding bug\n\nit was just a matter of time before it would cause customers to complain ",
		}),
		fakeCommit({ message: "fixup! Apply strawberry jam to make the code sweeter\n\n\n" }),
		fakeCommit({ message: "Refactor the taxi module\nThe roof sign now flashes politely." }),
		fakeCommit({
			message:
				"Bump @typescript-eslint/parser from 5.52.0 to 5.59.1\n\n\n\n\nBumps [@typescript-eslint/parser](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/parser) from 5.52.0 to 5.59.1.\n- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)\n- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/parser/CHANGELOG.md)",
		}),
		fakeCommit({
			message:
				"Teach the changelog to whisper\n\nThe noisy bits moved to the release notes.\n\nFooter: charming",
		}),
		fakeCommit({ message: "Use precise names\n" }),
		fakeCommit({
			message:
				"Resolve the conflicts\n\nConflicts:\n\n src/grumpy-cat.ts\n src/summer-vacation-plans.ts",
		}),
		fakeCommit({ message: '#1 Revert "Add an amazing feature"' }),
	]

	describe.each`
		rules
		${enabled1}
		${enabled2}
		${enabled3}
	`(
		"and the rule is enabled with restrictions on $rules.noRestrictedTrailers.restrictedKeys",
		(configProps: { rules: RulesetConfiguration }) => {
			const actualConcerns = mapCommitsToConcerns(commits, configProps.rules)

			it("does not raise any concerns", () => {
				expect(actualConcerns).toEqual<Concerns>([])
			})
		},
	)

	describe("and the rule is enabled with no restricted trailers", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabledNone)

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
