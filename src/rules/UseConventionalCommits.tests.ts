import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { fakeTokenConfiguration } from "#commits/TokenConfiguration.fakes.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import { subjectConcern } from "#rules/concerns/SubjectConcern.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"
import { fakeCommitSha } from "#types/CommitSha.fakes.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "useConventionalCommits"

const disabled = emptyRulesetConfiguration()
const enabled = emptyRulesetConfiguration({ [rule]: { level: "error" } })

const fakeCommit = fakeCommitFactory()
const fakeCommitWithoutTypes = fakeCommitFactory(
	fakeTokenConfiguration({ conventionalCommits: { types: [] } }),
)

describe.each`
	subject              | expectedRange
	${""}                | ${[0, 1]}
	${" "}               | ${[1, 2]}
	${"\t\t"}            | ${[2, 3]}
	${"fixup! "}         | ${[7, 8]}
	${" squash!  "}      | ${[10, 11]}
	${"fixup! squash! "} | ${[15, 16]}
`(
	"when the subject of $subject is blank",
	(props: { subject: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subject })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the beginning of the subject", () => {
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
	subject                                   | expectedRange
	${"Release the robot butler"}             | ${[0, 1]}
	${"feat(): Add a snooze button"}          | ${[0, 1]}
	${"#42 feat: Export the monthly report"}  | ${[0, 1]}
	${"Add feat: a calendar view"}            | ${[0, 1]}
	${"printer: Add duplex printing"}         | ${[0, 1]}
	${"`feat: Cache the weather forecast`"}   | ${[0, 1]}
	${"Rotate the signing key before Friday"} | ${[0, 1]}
	${"squash! Fix the calendar sync"}        | ${[8, 9]}
	${"  fixup! Fix the email digest"}        | ${[9, 10]}
`(
	"when the subject of $subject has no conventional prefix",
	(props: { subject: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subject })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the first word", () => {
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
	subject                                    | expectedRange
	${"feat:Add a settings page"}              | ${[4, 5]}
	${"feat:Enable CSV export"}                | ${[4, 5]}
	${"feat:\tAdd a calendar view"}            | ${[4, 5]}
	${"feat(api)!:Retire the stale cache"}     | ${[10, 11]}
	${"  feat:Add a daily backup"}             | ${[6, 7]}
	${"fixup! feat:Publish the release notes"} | ${[11, 12]}
`(
	"when the subject of $subject has no space after its conventional prefix",
	(props: { subject: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommit({ message: props.subject })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern at the colon of the prefix", () => {
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
	subject                                    | expectedRange
	${"feat: Add daily backups"}               | ${[0, 1]}
	${"fix(api)!: Retire the coffee endpoint"} | ${[0, 1]}
	${"fixup! feat: Add a quiet-hours option"} | ${[7, 8]}
`(
	"when the subject of $subject uses a conventional prefix and no conventional types are configured",
	(props: { subject: string; expectedRange: CharacterRange }) => {
		const commit = fakeCommitWithoutTypes({ message: props.subject })

		describe("and the rule is enabled", () => {
			const actualConcerns = mapCommitsToConcerns([commit], enabled)

			it("raises a concern about the first word", () => {
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
	${"feat: Add a dark mode toggle"}
	${"fix(api)!: Retire the coffee endpoint"}
	${"chore(deps): Bump vite to 8.0.0"}
	${"FiX: Stop the nightly job from yelling"}
	${"fixup! squash! feat: Convince the printer to stop eating receipts"}
	${"  feat: Add an export for sticky notes"}
	${"docs: Explain fix: prefixes"}
	${"feat: fix: Repair the notification badge"}
	${"fix: #42 Calm the `BadgeFactory`"}
	${"feat:"}
	${"feat: "}
	${"feat:  Increase the timeout"}
`("when the subject of $subject has a valid conventional prefix", (props: { subject: string }) => {
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

describe.each`
	subject
	${'Revert "Add a timeout to the calendar sync"'}
	${'fixup! Revert "feat: Fold receipts into the monthly report"'}
`("when the subject of $subject contains a revert marker", (props: { subject: string }) => {
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

describe("when verifying a set of multiple commits and some subjects have invalid conventional prefixes", () => {
	const commits: Vector<Commit, 4> = [
		fakeCommit({ message: "feat: Add a compact table view" }),
		fakeCommit({ message: "Export the quarterly report" }),
		fakeCommit({ message: "feat(): Close the dormant preview endpoint" }),
		fakeCommit({ message: "fixup! Rewrite the migration notes" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about each invalid conventional prefix", () => {
			expect(actualConcerns).toEqual<Concerns>([
				subjectConcern(rule, commits[1].sha, { range: [0, 1] }),
				subjectConcern(rule, commits[2].sha, { range: [0, 1] }),
				subjectConcern(rule, commits[3].sha, { range: [7, 8] }),
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

describe("when verifying a set of multiple commits and all subjects have valid conventional prefixes", () => {
	const commits: Vector<Commit, 4> = [
		fakeCommit({ message: "feat: Sort archived photos by capture date" }),
		fakeCommit({ message: "fix(parser)!: Accept escaped quotes in YAML" }),
		fakeCommit({ message: 'Revert "Reduce the report retention window"' }),
		fakeCommit({ message: "Merge branch 'main'", parents: [fakeCommitSha(), fakeCommitSha()] }),
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
