import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commit } from "#commits/Commit.ts"
import { emptyRulesetConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { commitConcern } from "#rules/concerns/CommitConcern.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import { fakeCommitSha } from "#types/CommitSha.fakes.ts"
import type { Vector } from "#types/Vector.ts"

const rule: RuleKey = "noRepeatedSubjects"

const disabled = emptyRulesetConfiguration()
const enabled = emptyRulesetConfiguration({ [rule]: { level: "error" } })

const fakeCommit = fakeCommitFactory()

describe("when verifying a set of multiple commits and some commits have repeated subject lines", () => {
	const commits: Vector<Commit, 10> = [
		fakeCommit({ message: "test" }),
		fakeCommit({ message: "another bugfix" }),
		fakeCommit({ message: "Upgrade React to 19.2.6" }),
		fakeCommit({ message: "#15 make some toast" }),
		fakeCommit({ message: " Tune the kettle" }),
		fakeCommit({ message: "#15 make some toast" }),
		fakeCommit({ message: "Label the mystery switch" }),
		fakeCommit({ message: "#15 make some toast" }),
		fakeCommit({ message: "Upgrade React to 19.2.6" }),
		fakeCommit({ message: " Tune the kettle" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about the commits with repeated subject lines", () => {
			expect(actualConcerns).toEqual<Concerns>([
				commitConcern(rule, commits[5].sha),
				commitConcern(rule, commits[7].sha),
				commitConcern(rule, commits[8].sha),
				commitConcern(rule, commits[9].sha),
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

describe("when verifying a set of multiple commits and some commits have repeated subject lines differing only by whitespace or case", () => {
	const commits: Vector<Commit, 12> = [
		fakeCommit({ message: "test" }),
		fakeCommit({ message: "another bugfix" }),
		fakeCommit({ message: "GL-27 Make some toast" }),
		fakeCommit({ message: "tune the kettle" }),
		fakeCommit({ message: "AnOtHeR bUgFiX" }),
		fakeCommit({ message: "GL-27   make  some    toast" }),
		fakeCommit({ message: "Label the mystery switch" }),
		fakeCommit({ message: "  GL-27  make some TOAST  " }),
		fakeCommit({ message: " Tune the kettle" }),
		fakeCommit({ message: "TEST!!" }),
		fakeCommit({ message: "tune           the kettle     " }),
		fakeCommit({ message: "    ANOTHER bugfix" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about the commits with repeated subject lines being whitespace- and case-insensitive", () => {
			expect(actualConcerns).toEqual<Concerns>([
				commitConcern(rule, commits[4].sha),
				commitConcern(rule, commits[5].sha),
				commitConcern(rule, commits[7].sha),
				commitConcern(rule, commits[8].sha),
				commitConcern(rule, commits[10].sha),
				commitConcern(rule, commits[11].sha),
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

describe("when verifying a set of multiple commits and merge commits have repeated subject lines", () => {
	const commits: Vector<Commit, 9> = [
		fakeCommit({ message: "upgrade the snack dispenser" }),
		fakeCommit({
			message: "Calibrate the waffle dial",
			parents: [fakeCommitSha(), fakeCommitSha()],
		}),
		fakeCommit({ message: "Calibrate the waffle dial" }),
		fakeCommit({ message: "install the `PantryDashboard`" }),
		fakeCommit({
			message: "install the `PantryDashboard`",
			parents: [fakeCommitSha(), fakeCommitSha(), fakeCommitSha()],
		}),
		fakeCommit({
			message: "Calibrate the waffle dial",
			parents: [fakeCommitSha(), fakeCommitSha()],
		}),
		fakeCommit({ message: "upgrade the snack dispenser" }),
		fakeCommit({ message: "install the `PantryDashboard`" }),
		fakeCommit({
			message: "install the `PantryDashboard`",
			parents: [fakeCommitSha(), fakeCommitSha()],
		}),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about the commits with repeated subject lines, but ignores merge commits", () => {
			expect(actualConcerns).toEqual<Concerns>([
				commitConcern(rule, commits[2].sha),
				commitConcern(rule, commits[6].sha),
				commitConcern(rule, commits[7].sha),
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

describe("when verifying a set of multiple commits and revert commits have repeated subject lines", () => {
	const commits: Vector<Commit, 8> = [
		fakeCommit({ message: "Refactor the office playlist scheduler" }),
		fakeCommit({ message: "upgrade the snack dispenser" }),
		fakeCommit({ message: 'Revert "upgrade the snack dispenser"' }),
		fakeCommit({ message: "Revert the snack dispenser manually" }),
		fakeCommit({ message: "Refactor the office playlist scheduler" }),
		fakeCommit({ message: "upgrade the snack dispenser" }),
		fakeCommit({ message: 'Revert "upgrade the snack dispenser"' }),
		fakeCommit({ message: "upgrade the snack dispenser" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about the commits with repeated subject lines, but ignores commits with revert markers", () => {
			expect(actualConcerns).toEqual<Concerns>([
				commitConcern(rule, commits[4].sha),
				commitConcern(rule, commits[5].sha),
				commitConcern(rule, commits[7].sha),
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

describe("when verifying a set of multiple commits and squash commits have repeated subject lines", () => {
	const commits: Vector<Commit, 12> = [
		fakeCommit({ message: "Refactor the office playlist scheduler" }),
		fakeCommit({ message: "fixup! Refactor the office playlist scheduler" }),
		fakeCommit({ message: "test" }),
		fakeCommit({ message: "upgrade the snack dispenser" }),
		fakeCommit({ message: "squash! Refactor the office playlist scheduler" }),
		fakeCommit({ message: "fixup! Refactor the office playlist scheduler" }),
		fakeCommit({ message: "upgrade the snack dispenser" }),
		fakeCommit({ message: "fixup! squash! Refactor the office playlist scheduler" }),
		fakeCommit({ message: "test" }),
		fakeCommit({ message: "amend!test" }),
		fakeCommit({ message: "amend!amend!test" }),
		fakeCommit({ message: "  Test" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about the commits with repeated subject lines, but ignores commits with squash markers", () => {
			expect(actualConcerns).toEqual<Concerns>([
				commitConcern(rule, commits[6].sha),
				commitConcern(rule, commits[8].sha),
				commitConcern(rule, commits[11].sha),
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

describe("when verifying a set of multiple commits and some commits have repeated subject lines, but different issue links", () => {
	const commits: Vector<Commit, 4> = [
		fakeCommit({ message: "#1 replace guesswork with a tiny chart" }),
		fakeCommit({ message: "#2 replace guesswork with a tiny chart" }),
		fakeCommit({ message: "#1 replace guesswork with a tiny chart" }),
		fakeCommit({ message: "#3 replace guesswork with a tiny chart" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises concerns about the commits with repeated subject lines, but ignores commits with different issue links", () => {
			expect(actualConcerns).toEqual<Concerns>([commitConcern(rule, commits[2].sha)])
		})
	})

	describe("and the rule is disabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, disabled)

		it("does not raise any concerns", () => {
			expect(actualConcerns).toEqual<Concerns>([])
		})
	})
})

describe("when verifying a set of multiple commits and some commits have repeated hyperlinks", () => {
	const commits: Vector<Commit, 3> = [
		fakeCommit({ message: "Read https://docs.github.com/en/rest before lunch" }),
		fakeCommit({
			message: "Read https://developer.mozilla.org/en-US/docs/Web/JavaScript before lunch",
		}),
		fakeCommit({ message: "Read https://docs.github.com/en/rest before lunch" }),
	]

	describe("and the rule is enabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, enabled)

		it("raises a concern about the repeated subject line", () => {
			expect(actualConcerns).toEqual<Concerns>([commitConcern(rule, commits[2].sha)])
		})
	})

	describe("and the rule is disabled", () => {
		const actualConcerns = mapCommitsToConcerns(commits, disabled)

		it("does not raise any concerns", () => {
			expect(actualConcerns).toEqual<Concerns>([])
		})
	})
})

describe("when verifying a set of multiple commits and no commits have repeated subject lines", () => {
	const commits: Vector<Commit, 10> = [
		fakeCommit({ message: "init" }),
		fakeCommit({ message: "Install the pastry metrics panel" }),
		fakeCommit({ message: "bugfix, sorry!!" }),
		fakeCommit({ message: "replace guesswork with a tiny chart" }),
		fakeCommit({ message: "Bring order to the button drawer" }),
		fakeCommit({ message: "fixup! Bring order to the button drawer" }),
		fakeCommit({ message: "fixup! Bring order to the button drawer" }),
		fakeCommit({ message: " explain why the build needs socks" }),
		fakeCommit({ message: "Test 1 2 3" }),
		fakeCommit({ message: "fixup! replace guesswork with a tiny chart" }),
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
