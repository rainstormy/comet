import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { bodyLineConcern, bodyLineConcerns } from "#rules/concerns/BodyLineConcern.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "noExcessiveBlankLines"

const disabled = emptyRulesetConfiguration()
const enabled = emptyRulesetConfiguration({ [rule]: { level: "error" } })

const fakeCommit = fakeCommitFactory()

describe.each`
	message                                                                                                          | expectedRanges
	${"Teach the changelog to whisper\n\nThe noisy bits moved.\n\n\nThe quiet bits stayed."}                         | ${[{ lineNumber: 3, range: [0, 1] }]}
	${"Install the doorbell\n\nIt rings.\n\n\n\n\nIt rings loudly."}                                                 | ${[{ lineNumber: 3, range: [0, 1] }]}
	${"made the console less dramatic\n\nFirst paragraph.\n   \nSecond paragraph.\n\t\n \nThird paragraph."}         | ${[{ lineNumber: 5, range: [0, 1] }]}
	${"Release the robot butler\n\nHe is polite.\n  \n    \nHe is punctual."}                                        | ${[{ lineNumber: 3, range: [0, 4] }]}
	${"Bump Vite to 8.0.0\n\nThis is a major release.\n\n\nRefs: #42\nCo-authored-by: Killua <killua@godspeed.net>"} | ${[{ lineNumber: 3, range: [0, 1] }]}
	${"squash! Paint the eggs\n\nBlue.\n\n\nGreen.\n\n\nRed."}                                                       | ${[{ lineNumber: 3, range: [0, 1] }, { lineNumber: 6, range: [0, 1] }]}
	${'Revert "Add the espresso switch"\n\nIt kept brewing.\n\n\n\nThis reverts commit 7e0ff1ce.'}                   | ${[{ lineNumber: 3, range: [0, 1] }]}
	${"Tidy the bookshelf\n\nAlphabetical.\n\n\n"}                                                                   | ${[{ lineNumber: 3, range: [0, 1] }]}
	${"Mix the paint\n\nRed.\n\n\nBlue.\n\n```\n\n\n```\n\n\nPurple."}                                               | ${[{ lineNumber: 3, range: [0, 1] }, { lineNumber: 11, range: [0, 1] }]}
`(
	"when the commit message of $message has consecutive blank lines in the body",
	(props: {
		message: string
		expectedRanges: Array<{ lineNumber: number; range: CharacterRange }>
	}) => {
		const commit = fakeCommit({ message: props.message })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the first excessive blank line in each block", () => {
				expect(actualConcerns).toEqual<Concerns>(
					bodyLineConcerns(rule, commit.sha, props.expectedRanges),
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
	message
	${"init"}
	${"Upgrade Vite to 8.0.0"}
	${"Consolidate `BadgeFactory` with `BadgeService` and count to ten"}
	${"Establish the repository\n"}
	${"Refactor the taxi module\n\nThe meter now accepts exact change."}
	${"fix a longstanding bug\n\nIt was a matter of time.\n\nCustomers complained.\n"}
	${"Tune the jukebox\n\nOne.\n \nTwo.\n\t\nThree."}
	${"Update the pantry\n\nNeed tiny adapters.\n\nRefs: #7\nCo-authored-by: Gon <gon@hunters.com>"}
	${"Replace guesswork with a chart\n\n\nThe chart uses three excellent dots."}
	${"Bring it on\n\n \n  \nThe code is prepared for anything."}
	${"Hold the line\n\n\n\n"}
	${"  \n\n\n\n   "}
	${"Install Vite\n\n```shell\npnpm add --save-dev vite\n\n\npnpm exec vite\n```\n\nVite is installed."}
	${"Document the formats\n\n````\n```\n\n\n\n```\n````"}
	${"Ship the cake\n\n```\n\n   \n\n"}
`(
	"when the commit message of $message has no excessive blank lines",
	(props: { message: string }) => {
		const commit = fakeCommit({ message: props.message })

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

describe("when verifying a set of multiple commits and some commits have consecutive blank lines in the body", () => {
	const commits: Vector<Commit, 5> = [
		fakeCommit({ message: "Refactor the taxi module" }),
		fakeCommit({
			message: "Install a quieter keyboard\n\nThe old one sounded like hail.\n\n\nBye.",
		}),
		fakeCommit({ message: "Update the docs\n\nThe example now uses a bowl of fresh hot soup." }),
		fakeCommit({
			message: "Clean the tiny dashboard\n\nThe widgets sparkle.\n \n \nThe birds sing.",
		}),
		fakeCommit({ message: "Use precise names\n" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises a concern about each violating commit", () => {
			expect(actualConcerns).toEqual<Concerns>([
				bodyLineConcern(rule, commits[1].sha, { lineNumber: 3, range: [0, 1] }),
				bodyLineConcern(rule, commits[3].sha, { lineNumber: 3, range: [0, 1] }),
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

describe("when verifying a set of multiple commits and no commits have excessive blank lines", () => {
	const commits: Vector<Commit, 4> = [
		fakeCommit({ message: "Refactor the taxi module" }),
		fakeCommit({ message: "Install a quieter keyboard\n\nThe old one sounded like hail." }),
		fakeCommit({ message: "Update the docs\n\nOne.\n\nTwo.\n\n```\n\n\n```" }),
		fakeCommit({ message: "Use precise names\n" }),
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
