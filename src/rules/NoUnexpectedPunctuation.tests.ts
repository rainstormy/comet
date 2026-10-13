import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import { subjectConcern } from "#rules/concerns/SubjectConcern.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "noUnexpectedPunctuation"

const disabled = emptyRulesetConfiguration()
const enabled = emptyRulesetConfiguration({ [rule]: { level: "error" } })

const fakeCommit = fakeCommitFactory()

describe.each`
	subject                                              | expectedRange
	${"-"}                                               | ${[0, 1]}
	${" ... "}                                           | ${[1, 4]}
	${"??"}                                              | ${[0, 2]}
	${"Make the program act like a clown."}              | ${[33, 34]}
	${"spotted the UFO,"}                                | ${[15, 16]}
	${"issues:"}                                         | ${[6, 7]}
	${"Throw a tantrum;"}                                | ${[15, 16]}
	${"refreshed cache!"}                                | ${[15, 16]}
	${"Apply strawberry jam to make the code sweeter~"}  | ${[45, 46]}
	${"Is the coffee ready?"}                            | ${[19, 20]}
	${"Set the output ="}                                | ${[15, 16]}
	${"  Begin the implementation with more to come+  "} | ${[44, 45]}
	${"Mark the placeholder *"}                          | ${[21, 22]}
	${"the old route -> "}                               | ${[14, 16]}
	${"Join the channels &&"}                            | ${[18, 20]}
	${"Ignore the flag _"}                               | ${[16, 17]}
	${"loops short-circuit with ||"}                     | ${[25, 27]}
	${"Math.pow() -> **"}                                | ${[14, 16]}
	${"line comments should start with //"}              | ${[32, 34]}
	${"Expose the metric event$"}                        | ${[23, 24]}
	${"Polish the moon laser! #42"}                      | ${[21, 22]}
	${"Rewire the pantry? GH-7 #42"}                     | ${[17, 18]}
	${"Update the README!!  "}                           | ${[17, 19]}
	${"Hide a cheerful easter egg :joy:"}                | ${[27, 32]}
	${"Leave a note :slightly_smiling_face:"}            | ${[13, 36]}
	${"Signal success :-)"}                              | ${[15, 18]}
	${"Signal approval =)"}                              | ${[16, 18]}
	${"Celebrate the tiny victory ^_^"}                  | ${[27, 30]}
	${"Leave a note)"}                                   | ${[12, 13]}
	${"Queue the parcel] GL-20"}                         | ${[16, 17]}
	${"Close the brace}"}                                | ${[15, 16]}
	${"Send the value>"}                                 | ${[14, 15]}
	${'Rename the label"'}                               | ${[16, 17]}
	${"we rule`"}                                        | ${[7, 8]}
	${"fixup! Reheat the leftovers!"}                    | ${[27, 28]}
`(
	"when the subject of $subject contains unexpected trailing punctuation",
	(props: { subject: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subject })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the unexpected punctuation", () => {
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
	${""}
	${" "}
	${"Release the robot butler"}
	${" Recalibrate the espresso machine "}
	${"Rewire the pantry (after lunch) #42"}
	${"Archive the clues [for later]"}
	${"Document the payload {as JSON}"}
	${"Compare the values <carefully>"}
	${"Rename the 'strategy'"}
	${'Quote the "strategy"'}
	${"Use the `strategy` adapter"}
	${"Keep the «old» label"}
	${"Preserve the »legacy«"}
	${"Increase the tax to 100%"}
	${"improvements by 1337% #42"}
	${'Set the print margin to 2"'}
	${'the display is 6.3"'}
	${"Allow guests aged 3+"}
	${"Show 120 as the result of 5!"}
	${"Compile the parser with C++"}
	${"Ship the parser in C#"}
	${"Rewrite the service in F# "}
	${"Prove the theorem in F*"}
	${"Validate the model in VDM++"}
	${"Build the dashboard with Vite+"}
	${"Publish version 1.2.0-beta.1"}
	${"Point the docs at https://example.com"}
	${"Close issue #42"}
	${"fixup!"}
	${"fixup! Reheat the leftovers"}
	${"squash! squash!"}
	${'Revert "Release the robot butler!"'}
`(
	"when the subject of $subject does not contain unexpected trailing punctuation",
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
	subject                                 | body
	${"Document the escape hatch"}          | ${"The fallback now ends with a tidy period."}
	${"Recalibrate the espresso machine"}   | ${"Does the pressure gauge finally behave?"}
	${"Tame the release robot"}             | ${"The webhook now announces success!"}
	${"Archive the suspicious breadcrumbs"} | ${"Use (parentheses), [brackets], and {braces} when describing the clues."}
	${"Explain the `Tokeniser` contract"}   | ${"Inline `code` remains ordinary prose here."}
`(
	"when the message body of $body contains punctuation",
	(props: { subject: string; body: string }) => {
		const commit = fakeCommit({ message: `${props.subject}\n${props.body}` })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("does not raise any concerns about punctuation in the message body", () => {
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

describe("when verifying a set of multiple commits and some subjects contain unexpected trailing punctuation", () => {
	const commits: Vector<Commit, 6> = [
		fakeCommit({ message: "Fix the robot." }),
		fakeCommit({ message: "Keep the robot cheerful" }),
		fakeCommit({ message: "fixup! Fix the gears!" }),
		fakeCommit({ message: 'Revert "Fix the robot!"' }),
		fakeCommit({ message: "Fix the robot (carefully)" }),
		fakeCommit({ message: "Fix the robot?" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about each unexpected punctuation suffix", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectConcern(rule, commits[0].sha, { range: [13, 14] }),
				subjectConcern(rule, commits[2].sha, { range: [20, 21] }),
				subjectConcern(rule, commits[5].sha, { range: [13, 14] }),
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

describe("when verifying a set of multiple commits and no subjects contain unexpected trailing punctuation", () => {
	const commits: Vector<Commit, 5> = [
		fakeCommit({ message: "Fix the robot" }),
		fakeCommit({ message: "Fix the robot carefully" }),
		fakeCommit({ message: 'Revert "Fix the robot!"' }),
		fakeCommit({ message: "fixup! Fix the gears" }),
		fakeCommit({ message: "Release 2.1.0" }),
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
