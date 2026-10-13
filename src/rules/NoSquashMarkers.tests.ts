import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import { subjectConcern } from "#rules/concerns/SubjectConcern.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "noSquashMarkers"

const disabled = emptyRulesetConfiguration()
const enabled = emptyRulesetConfiguration({ [rule]: { level: "error" } })

const fakeCommit = fakeCommitFactory()

describe.each`
	subject                                                 | expectedRange
	${"fixup!"}                                             | ${[0, 6]}
	${"amend! Resolve a bug that thought it was a feature"} | ${[0, 6]}
	${"squash! make the program act like a clown"}          | ${[0, 7]}
	${" Fixup!  Added some extra love to the code"}         | ${[1, 7]}
	${"amend!Solved the problem"}                           | ${[0, 6]}
	${"   squash!  organise the bookshelf"}                 | ${[3, 10]}
	${'!fixup Revert "Bugfix"'}                             | ${[0, 6]}
	${"!amend Wonder if this will work?"}                   | ${[0, 6]}
	${"!SqUaSh retrieve data from third-party service"}     | ${[0, 7]}
	${"fixup!! another attempt"}                            | ${[0, 7]}
	${"amend!!  Update the documentation"}                  | ${[0, 7]}
	${" squash!!! make changes"}                            | ${[1, 10]}
	${"amend!squash!"}                                      | ${[0, 13]}
	${"fixup! FIXUP!! Enforce the linting rules"}           | ${[0, 14]}
	${" squash! amend!     fixup! long polling"}            | ${[1, 26]}
`(
	"when the subject of $subject contains a squash marker",
	(props: { subject: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subject })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the squash marker", () => {
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
	${"\t\t"}
	${"Refactor the taxi module"}
	${" Unsubscribe from the service"}
	${"Formatting."}
	${"WIP"}
	${"Fix the bug"}
	${"Update the documentation"}
	${"Add new feature"}
	${"Make the commit scream fixup! again"}
	${"there's no squash! to see here"}
	${"All done!"}
	${"#7044: Solve the problem"}
	${'Revert "Release the robot butler"'}
	${"   Hunt down the bugs "}
	${"Compare the list of items to the objects downloaded from the server"}
	${"Resolve issues in #21 to make the code work better"}
	${"Finally..."}
	${"Let `SoftIceMachineAdapter` produce the goods that we need"}
	${"fixup the code"}
	${"squash the commits"}
	${"amend the message"}
`("when the subject of $subject does not contain a squash marker", (props: { subject: string }) => {
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

describe("when verifying a set of multiple commits and some commits have squash markers", () => {
	const commits: Vector<Commit, 7> = [
		fakeCommit({ message: "fixup! resolve a bug that thought it was a feature" }),
		fakeCommit({ message: "Squash! Make the program act like a clown" }),
		fakeCommit({ message: "Refactor the taxi module" }),
		fakeCommit({ message: "WIP" }),
		fakeCommit({ message: " amend! update the code" }),
		fakeCommit({ message: " Unsubscribe from the service" }),
		fakeCommit({ message: "Fix the bug" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about the commits with squash markers", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectConcern(rule, commits[0].sha, { range: [0, 6] }),
				subjectConcern(rule, commits[1].sha, { range: [0, 7] }),
				subjectConcern(rule, commits[4].sha, { range: [1, 7] }),
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

describe("when verifying a set of multiple commits and no commits have squash markers", () => {
	const commits: Vector<Commit, 5> = [
		fakeCommit({ message: "let's go!!" }),
		fakeCommit({ message: "squash the bugs" }),
		fakeCommit({ message: 'Revert "Bugfix"' }),
		fakeCommit({ message: "Make the commit scream fixup! again" }),
		fakeCommit({ message: "1 2 3 this is a test" }),
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
