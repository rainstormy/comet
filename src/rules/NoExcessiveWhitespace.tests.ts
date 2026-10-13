import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { bodyLineConcern, bodyLineConcerns } from "#rules/concerns/BodyLineConcern.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import { subjectConcern, subjectConcerns } from "#rules/concerns/SubjectConcern.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "noExcessiveWhitespace"

const disabled = emptyRulesetConfiguration()
const enabled = emptyRulesetConfiguration({ [rule]: { level: "error" } })

const fakeCommit = fakeCommitFactory()

describe.each`
	message                                                                                 | expectedSubjectRanges                                                            | expectedBodyLineRanges
	${" "}                                                                                  | ${[[0, 1]]}                                                                      | ${[]}
	${"         "}                                                                          | ${[[0, 9]]}                                                                      | ${[]}
	${"\t\t"}                                                                               | ${[[0, 2]]}                                                                      | ${[]}
	${" fix it"}                                                                            | ${[[0, 1]]}                                                                      | ${[]}
	${" Unsubscribe from the service"}                                                      | ${[[0, 1]]}                                                                      | ${[]}
	${"   Write docs"}                                                                      | ${[[0, 3]]}                                                                      | ${[]}
	${"  `SoftIceMachine` updated"}                                                         | ${[[0, 2]]}                                                                      | ${[]}
	${" fixup!"}                                                                            | ${[[0, 1]]}                                                                      | ${[]}
	${"  amend! Put the counter back"}                                                      | ${[[0, 2]]}                                                                      | ${[]}
	${'    Revert "Repair the soft ice machine"'}                                           | ${[[0, 4]]}                                                                      | ${[]}
	${" #903 Solve the problem"}                                                            | ${[[0, 1]]}                                                                      | ${[]}
	${"  GH-15 GL-392 extra spicy code detected"}                                           | ${[[0, 2]]}                                                                      | ${[]}
	${"I have fixed it "}                                                                   | ${[[15, 16]]}                                                                    | ${[]}
	${"add readme   "}                                                                      | ${[[10, 13]]}                                                                    | ${[]}
	${"Support colourful outputs in `MoneyPrinter`    "}                                    | ${[[43, 47]]}                                                                    | ${[]}
	${"Update React to 19.2.0  "}                                                           | ${[[22, 24]]}                                                                    | ${[]}
	${"Keep  waffles in  sync "}                                                            | ${[[4, 6], [16, 18], [22, 23]]}                                                  | ${[]}
	${"#42  Update `BadgePrinter` to 3.1.4"}                                                | ${[[3, 5]]}                                                                      | ${[]}
	${"fixup!  Tighten the toaster bolts"}                                                  | ${[[6, 8]]}                                                                      | ${[]}
	${'Revert  "Add the  espresso switch"   '}                                              | ${[[6, 8], [16, 18], [34, 37]]}                                                  | ${[]}
	${' Revert   "Repair the soft ice machine"'}                                            | ${[[0, 1], [7, 10]]}                                                             | ${[]}
	${"  squash!   #019  butter  chicken  with softice  &&  bearnaise "}                    | ${[[0, 2], [9, 12], [16, 18], [24, 26], [33, 35], [47, 49], [51, 53], [62, 63]]} | ${[]}
	${"Update the pantry\n\nNeed  tiny adapters"}                                           | ${[]}                                                                            | ${[{ line: 1, range: [4, 6] }]}
	${"Tune the jukebox\n\nMove sauce  left and bolts   right"}                             | ${[]}                                                                            | ${[{ line: 1, range: [10, 12] }, { line: 1, range: [26, 29] }]}
	${"Refill the candy drawer\n\nPixel  ghosts appear\nStill okay\nBear  patrol   online"} | ${[]}                                                                            | ${[{ line: 1, range: [5, 7] }, { line: 3, range: [4, 6] }, { line: 3, range: [12, 15] }]}
	${"Calibrate vending machine\n\nOne line is neat\nTwo  spaces sneak in"}                | ${[]}                                                                            | ${[{ line: 2, range: [3, 5] }]}
	${"Polish arcade cabinet\n\nLevel  1 starts now"}                                       | ${[]}                                                                            | ${[{ line: 1, range: [5, 7] }]}
	${"refactor the tea engine\n\nAlpha   beta\nGamma is fine"}                             | ${[]}                                                                            | ${[{ line: 1, range: [5, 8] }]}
	${"keep logistic bots in sync\n\nClean line\nOops  double  trouble"}                    | ${[]}                                                                            | ${[{ line: 2, range: [4, 6] }, { line: 2, range: [12, 14] }]}
	${"Ship tiny fix\n\nReviewed-by:  Gon Freecss <rock.paper.scissors@hunters.com>"}       | ${[]}                                                                            | ${[{ line: 1, range: [12, 14] }]}
	${"Document bolt offsets\n\nCo-authored-by:   Killua Zoldyck <killua@godspeed.net>"}    | ${[]}                                                                            | ${[{ line: 1, range: [15, 18] }]}
	${"finetune the release script\n\nRef:  #6201"}                                         | ${[]}                                                                            | ${[{ line: 1, range: [4, 6] }]}
	${"Fix  valves quickly\n\nBody  has trouble"}                                           | ${[[3, 5]]}                                                                      | ${[{ line: 1, range: [4, 6] }]}
	${"  GH-88  Patch queue\n\nTrailer:  value\nAnother-Trailer:  Another value"}           | ${[[0, 2], [7, 9]]}                                                              | ${[{ line: 1, range: [8, 10] }, { line: 2, range: [16, 18] }]}
	${"squash!  rewire the drones\n\nOne  two\nSigned-off-by:  Hisoka <no4@phantom.com>"}   | ${[[7, 9]]}                                                                      | ${[{ line: 1, range: [3, 5] }, { line: 2, range: [14, 16] }]}
	${"Reboot kiosk  nightly\n\nAll good\nBut  not quite"}                                  | ${[[12, 14]]}                                                                    | ${[{ line: 2, range: [3, 5] }]}
`(
	"when the commit message of $message has excessive whitespace characters",
	(props: {
		message: string
		expectedSubjectRanges: Array<CharacterRange>
		expectedBodyLineRanges: Array<{ line: number; range: CharacterRange }>
	}) => {
		const commit = fakeCommit({ message: props.message })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises concerns about the blocks of excessive whitespace characters", () => {
				expect(actualConcerns).toEqual<Concerns>([
					...subjectConcerns(rule, commit.sha, props.expectedSubjectRanges),
					...bodyLineConcerns(rule, commit.sha, props.expectedBodyLineRanges),
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
	${""}
	${"Formatting."}
	${"WIP"}
	${"Fix the bug"}
	${"All done!"}
	${"add a new feature"}
	${"Keep the kitchen clean"}
	${"Refactor the taxi module"}
	${"fixup! Repair the soft ice machine"}
	${'Revert "Repair the soft ice machine"'}
	${"Update the pantry\n\n  Keep the example indented."}
	${"Refresh checklist\n\n\t- Keep the checklist aligned."}
	${"Rewrite release notes\n\nThis Markdown body keeps trailing crumbs  "}
	${"Improve logs\nA tab follows this line\t"}
	${"Patch snack scheduler\n\nEverything is normal.\nSpacing is sensible."}
`(
	"when the commit message of $message does not contain excessive whitespace characters",
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

describe("when verifying a set of multiple commits and some commits contain excessive whitespace characters", () => {
	const commits: Vector<Commit, 6> = [
		fakeCommit({ message: "write docs" }),
		fakeCommit({ message: "   -" }),
		fakeCommit({ message: "Organise the bookshelf \n\nThe body is tidy." }),
		fakeCommit({
			message:
				"Explain the widget\n\nIt needs  space.\nAlso fine.\n But afterwards,  it's all down hill from   here...",
		}),
		fakeCommit({ message: " #17  Patch the kiosk\n\nRefs:  #17" }),
		fakeCommit({
			message: "Indent body\n\n  This is indented, but that's okay after all.\n\nChange-Id: abc123",
		}),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about all blocks of excessive whitespace characters", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectConcern(rule, commits[1].sha, { range: [0, 3] }),
				subjectConcern(rule, commits[2].sha, { range: [22, 23] }),
				bodyLineConcern(rule, commits[3].sha, { line: 1, range: [8, 10] }),
				bodyLineConcern(rule, commits[3].sha, { line: 3, range: [16, 18] }),
				bodyLineConcern(rule, commits[3].sha, { line: 3, range: [41, 44] }),
				subjectConcern(rule, commits[4].sha, { range: [0, 1] }),
				subjectConcern(rule, commits[4].sha, { range: [4, 6] }),
				bodyLineConcern(rule, commits[4].sha, { line: 1, range: [5, 7] }),
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

describe("when verifying a set of multiple commits and no commits contain excessive whitespace", () => {
	const commits: Vector<Commit, 4> = [
		fakeCommit({ message: "Build the dashboard" }),
		fakeCommit({ message: "GH-17 Update `BadgePrinter` to 3.1.4" }),
		fakeCommit({ message: "Document the setup\n\n  Keep the example indented." }),
		fakeCommit({
			message:
				"Write release notes\n\nReviewed-by: Donatello <42069849+gogogadget@users.noreply.github.com>",
		}),
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
