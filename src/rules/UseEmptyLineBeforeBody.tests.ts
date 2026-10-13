import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { bodyLineConcern } from "#rules/concerns/BodyLineConcern.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "useEmptyLineBeforeBody"

const disabled = emptyRulesetConfiguration()
const enabled = emptyRulesetConfiguration({ [rule]: { level: "error" } })

const fakeCommit = fakeCommitFactory()

describe.each`
	message
	${"init"}
	${"fix some bugs"}
	${"Upgrade Vite to 8.0.0"}
	${"Consolidate `BadgeFactory` with `BadgeService` and count to ten"}
	${'#1 Revert "Add an amazing feature"'}
	${"   squash!  organise the bookshelf"}
`("when the commit message of $message does not have a body", (props: { message: string }) => {
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
})

describe.each`
	message
	${"\n\n"}
	${"  \n\n\n   "}
	${"Establish the repository\n"}
	${"GH-34 open the hotel room\n\n"}
	${"a majestic bottle of water \n \n "}
	${"fixup! Apply strawberry jam to make the code sweeter\n\n\n"}
`("when the commit message of $message only has a blank body", (props: { message: string }) => {
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
})

describe.each`
	message                                                                                                             | expectedLine | expectedRange
	${"bugfix #614\nattempt 2"}                                                                                         | ${0}         | ${[0, 1]}
	${"Write unit tests\n Finally..."}                                                                                  | ${0}         | ${[0, 1]}
	${"Refactor the taxi module\nThe roof sign now flashes politely."}                                                  | ${0}         | ${[0, 1]}
	${"Install React\n```\npnpm add --save \\\n  @types/react \\\n  @types/react-dom \\\n  react \\\n  react-dom\n```"} | ${0}         | ${[0, 1]}
	${'Revert "Repair the soft ice machine"\nThis commit undoes the changes made in revision 6227ca0.'}                 | ${0}         | ${[0, 1]}
	${"squash! serve the tiny sandwiches\n guests get fewer crumbs in the keyboard"}                                    | ${0}         | ${[0, 1]}
	${"Release the notes\nhttps://github.com/rainstormy/comet/releases"}                                                | ${0}         | ${[0, 1]}
`(
	"when the commit message $message does not have an empty line before the body",
	(props: { message: string; expectedLine: number; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.message })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the first body line", () => {
				expect(actualConcerns).toEqual<Concerns>([
					bodyLineConcern(rule, commit.sha, {
						line: props.expectedLine,
						range: props.expectedRange,
					}),
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
	message                                                                                                                                                                                                                                                                                                                                                                                                         | expectedLine | expectedRange
	${"Bring it   on  \n\n\nThe code is prepared for anything."}                                                                                                                                                                                                                                                                                                                                                    | ${1}         | ${[0, 1]}
	${"Replace guesswork with a chart\n\n\n\nThe chart uses three excellent dots."}                                                                                                                                                                                                                                                                                                                                 | ${2}         | ${[0, 1]}
	${"Update src/main.ts\n \n \nCo-Authored-By: Everloving Easter Bunny <everloving.easter.bunny@example.com>"}                                                                                                                                                                                                                                                                                                    | ${1}         | ${[0, 1]}
	${"Bump @typescript-eslint/parser from 5.52.0 to 5.59.1\n\n\n\n\nBumps [@typescript-eslint/parser](https://github.com/typescript-eslint/typescript-eslint/tree/HEAD/packages/parser) from 5.52.0 to 5.59.1.\n- [Release notes](https://github.com/typescript-eslint/typescript-eslint/releases)\n- [Changelog](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/parser/CHANGELOG.md)"} | ${3}         | ${[0, 1]}
	${"transport the fragile and expensive goods\n\n\n\n   \n\nThis commit moves the goods from one place to another via the `RapidTransportService`."}                                                                                                                                                                                                                                                             | ${4}         | ${[0, 1]}
	${"Install Vite\n\n\n```shell\npnpm add --save-dev vite\n```\n\nThis commit also uses Vite as bundler."}                                                                                                                                                                                                                                                                                                        | ${1}         | ${[0, 1]}
`(
	"when the commit message $message has multiple blank lines before the body",
	(props: { message: string; expectedLine: number; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.message })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the first non-blank body line", () => {
				expect(actualConcerns).toEqual<Concerns>([
					bodyLineConcern(rule, commit.sha, {
						line: props.expectedLine,
						range: props.expectedRange,
					}),
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
	message
	${"fix a longstanding bug\n\nit was just a matter of time before it would cause customers to complain "}
	${"Refactor the taxi module\n\nThe meter now accepts exact change."}
	${"Resolve the conflicts\n\nConflicts:\n\n src/grumpy-cat.ts\n src/summer-vacation-plans.ts"}
	${"Teach the changelog to whisper\n\nThe noisy bits moved to the release notes.\n\nFooter: charming"}
`(
	"when the commit message $message has exactly one empty line before the body",
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

describe("when verifying a set of multiple commits and some commits do not have exactly one empty line before the body", () => {
	const commits: Vector<Commit, 5> = [
		fakeCommit({ message: "Refactor the taxi module" }),
		fakeCommit({ message: "Install a quieter keyboard\nThe old one sounded like hail." }),
		fakeCommit({ message: "Update the docs\n\nThe example now uses a bowl of fresh hot soup." }),
		fakeCommit({ message: "Clean the tiny dashboard\n\n\nThe widgets sparkle." }),
		fakeCommit({ message: "Use precise names\n" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about the commits with unexpected body lines", () => {
			expect(actualConcerns).toEqual<Concerns>([
				bodyLineConcern(rule, commits[1].sha, { line: 0, range: [0, 1] }),
				bodyLineConcern(rule, commits[3].sha, { line: 1, range: [0, 1] }),
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

describe("when verifying a set of multiple commits and all commits has exactly one empty line before the body", () => {
	const commits: Vector<Commit, 5> = [
		fakeCommit({ message: "Refactor the taxi module" }),
		fakeCommit({ message: "Install a quieter keyboard\n\nThe old one sounded like hail." }),
		fakeCommit({ message: "Update the docs\n\nThe example now uses a bowl of fresh hot soup." }),
		fakeCommit({ message: "Clean the tiny dashboard\n\nThe widgets sparkle." }),
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
