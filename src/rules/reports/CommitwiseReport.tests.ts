import { bold, gray as grey, red } from "ansis"
import { describe, expect, it } from "vitest"
import { fakeCommitFactory } from "#commits/Commit.fakes.ts"
import type { Commits } from "#commits/Commit.ts"
import { fakeConfiguration } from "#configurations/GetConfiguration.fakes.ts"
import { bodyLineConcern } from "#rules/concerns/BodyLineConcern.ts"
import { commitConcern } from "#rules/concerns/CommitConcern.ts"
import type { Concerns } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"
import { userIdentityConcern } from "#rules/concerns/UserIdentityConcern.ts"
import { commitwiseReport } from "#rules/reports/CommitwiseReport.ts"
import { fakeCommitSha } from "#types/CommitSha.fakes.ts"

describe("when there are no concerns", () => {
	const configuration = fakeConfiguration()

	const commits: Commits = []
	const concerns: Concerns = []

	it("is empty", () => {
		const actualReport = commitwiseReport(concerns, commits, configuration)
		expect(actualReport).toBe("")
	})
})

describe("when 'noBlankSubjectLines' has a concern about characters 0-1 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "52f07a2d665e6d3b3b50b8fca2af298c100ac804",
		message: "",
	})
	const concern = subjectLineConcern("noBlankSubjectLines", commit.sha, { range: [0, 1] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`52f07a2`} 
        ${red`┬`}
        ${red`╰─ Subject lines must contain at least one non-whitespace character.`}
        ${red`   (noBlankSubjectLines)`}
`.trim(),
		)
	})
})

describe("when 'noBlankSubjectLines' has a concern about characters 13-17 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "2ba57d6e3490324db1bacf22ae2884831357ef5c",
		message: 'amend! Revert " "',
	})
	const concern = subjectLineConcern("noBlankSubjectLines", commit.sha, { range: [13, 17] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`2ba57d6`} amend! Revert " "
                     ${red`─┬──`}
                      ${red`╰─ Subject lines must contain at least one non-whitespace character.`}
                      ${red`   (noBlankSubjectLines)`}
`.trim(),
		)
	})
})

describe("when 'noExcessiveCommitsPerBranch' has a concern about an excessive commit when the limit is 1", () => {
	const configuration = fakeConfiguration({
		noExcessiveCommitsPerBranch: { options: { maxCommits: 1 } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "9a7e6aa14b8c6e5dd49d7a68a18443bf1f67c520",
		message: "invite the parser to brunch",
	})
	const concern = commitConcern("noExcessiveCommitsPerBranch", commit.sha)

	it("describes the rule violation in the commit", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`9a7e6aa`} invite the parser to brunch
      ${red`╭────────────────────────────`}
      ${red`╰─ Branches must not contain more than 1 commit.`}
      ${red`   (noExcessiveCommitsPerBranch)`}
`.trim(),
		)
	})
})

describe("when 'noExcessiveCommitsPerBranch' has a concern about an excessive commit when the limit is 3", () => {
	const configuration = fakeConfiguration({
		noExcessiveCommitsPerBranch: { options: { maxCommits: 3 } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "75bedf83e2b573dc812ebba9f14f2b7c6741e670",
		message: "Refactor the jam queue",
	})
	const concern = commitConcern("noExcessiveCommitsPerBranch", commit.sha)

	it("describes the rule violation in the commit", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`75bedf8`} Refactor the jam queue
      ${red`╭───────────────────────`}
      ${red`╰─ Branches must not contain more than 3 commits.`}
      ${red`   (noExcessiveCommitsPerBranch)`}
`.trim(),
		)
	})
})

describe("when 'noExcessiveCommitsPerBranch' has a concern about an excessive commit when the limit is 10", () => {
	const configuration = fakeConfiguration({
		noExcessiveCommitsPerBranch: { options: { maxCommits: 10 } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "f753a247a54bb4c20e9968dc1fa75ef915f2b1ca",
		message: "last minute fix",
	})
	const concern = commitConcern("noExcessiveCommitsPerBranch", commit.sha)

	it("describes the rule violation in the commit", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`f753a24`} last minute fix
      ${red`╭────────────────`}
      ${red`╰─ Branches must not contain more than 10 commits.`}
      ${red`   (noExcessiveCommitsPerBranch)`}
`.trim(),
		)
	})
})

describe("when 'noExcessiveWhitespace' has a concern about characters 0-1 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "47722cd548b381520b85ee01001400d0df224531",
		message: " Recalibrate the espresso machine",
	})
	const concern = subjectLineConcern("noExcessiveWhitespace", commit.sha, { range: [0, 1] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`47722cd`}  Recalibrate the espresso machine
        ${red`┬`}
        ${red`╰─ Subject lines must not start with whitespace.`}
        ${red`   (noExcessiveWhitespace)`}
`.trim(),
		)
	})
})

describe("when 'noExcessiveWhitespace' has a concern about characters 39-40 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "067ab0c953eab2c17c16aad10dc78bd7d4d91077",
		message: "make the office fern require less water ",
	})
	const concern = subjectLineConcern("noExcessiveWhitespace", commit.sha, { range: [39, 40] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`067ab0c`} make the office fern require less water 
                                               ${red`┬`}
  ${red`Subject lines must not end with whitespace. ─╯`}
  ${red`(noExcessiveWhitespace)`}
`.trim(),
		)
	})
})

describe("when 'noExcessiveWhitespace' has a concern about characters 18-20 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "50bd2ccaeaf34476184a7cce6ad71a733d93c76a",
		message: "taught the toaster  to write haiku",
	})
	const concern = subjectLineConcern("noExcessiveWhitespace", commit.sha, { range: [18, 20] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`50bd2cc`} taught the toaster  to write haiku
                          ${red`┬─`}
                          ${red`╰─ Subject lines must not contain excessive whitespace.`}
                          ${red`   (noExcessiveWhitespace)`}
`.trim(),
		)
	})
})

describe("when 'noExcessiveWhitespace' has a concern about characters 23-26 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "c687be901727c887614061a5f099b5f5dbac4510",
		message: "Install tiny disco ball   in build room",
	})
	const concern = subjectLineConcern("noExcessiveWhitespace", commit.sha, { range: [23, 26] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`c687be9`} Install tiny disco ball   in build room
                               ${red`─┬─`}
                                ${red`╰─ Subject lines must not contain excessive whitespace.`}
                                ${red`   (noExcessiveWhitespace)`}
`.trim(),
		)
	})
})

describe("when 'noExcessiveWhitespace' has a concern about characters 9-12 of a body line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "41548802d6bb14a3032403e6fc0fcc69534e22e4",
		message: "Polish the arcade cabinet\n\nThe prize   counter now accepts coupons.",
	})
	const concern = bodyLineConcern("noExcessiveWhitespace", commit.sha, { line: 1, range: [9, 12] })

	it("describes the rule violation in the body line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`4154880`} Polish the arcade cabinet
    ${grey`╭──`}
  ${grey`1 │ `}
${red`•`} ${grey`${bold`2`} │`} The prize   counter now accepts coupons.
    ${grey`· `}         ${red`─┬─`}
    ${grey`· `}          ${red`╰─ Message bodies must not contain excessive whitespace.`}
    ${grey`· `}          ${red`   (noExcessiveWhitespace)`}
    ${grey`╰──`}
`.trim(),
		)
	})
})

describe("when 'noExcessiveWhitespace' has a concern about characters 14-18 of a body line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "100634682b66756712fa4664de8fc6cc47332c73",
		message:
			"Map the museum heist\n\nFirst note is perfectly ordinary.\nThe blue vault    needs a quieter alarm.\nLast note keeps watch.",
	})
	const concern = bodyLineConcern("noExcessiveWhitespace", commit.sha, { line: 2, range: [14, 18] })

	it("describes the rule violation in the body line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`1006346`} Map the museum heist
    ${grey`╭──`}
  ${grey`2 │ First note is perfectly ordinary.`}
${red`•`} ${grey`${bold`3`} │`} The blue vault    needs a quieter alarm.
    ${grey`· `}              ${red`─┬──`}
    ${grey`· `}               ${red`╰─ Message bodies must not contain excessive whitespace.`}
    ${grey`· `}               ${red`   (noExcessiveWhitespace)`}
  ${grey`4 │ Last note keeps watch.`}
    ${grey`╰──`}
`.trim(),
		)
	})
})

describe("when 'noMergeCommits' has a concern about the commit", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "507c835ff93e38ed1540ff58fb72f71837f9af13",
		parents: [fakeCommitSha(), fakeCommitSha()],
		message: "Merge branch 'main' into bugfix/dance-party-playlist",
	})
	const concern = commitConcern("noMergeCommits", commit.sha)

	it("describes the rule violation in the commit", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`507c835`} Merge branch 'main' into bugfix/dance-party-playlist
      ${red`╭─────────────────────────────────────────────────────`}
      ${red`╰─ Merge commits are not allowed.`}
      ${red`   (noMergeCommits)`}
`.trim(),
		)
	})
})

describe("when 'noMergeCommits' has a concern about the commit with a long subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "71516e17c94c69de4eeafff6cc420fac072764d2",
		parents: [fakeCommitSha(), fakeCommitSha(), fakeCommitSha()],
		message: "amend! Merge branch 'feature/new-coffee-machine' into feature/office-overhaul",
	})
	const concern = commitConcern("noMergeCommits", commit.sha)

	it("describes the rule violation in the commit", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`71516e1`} amend! Merge branch 'feature/new-coffee-machine' into feature/office-overhaul
      ${red`╭──────────────────────────────────────────────────────────────────────────────`}
      ${red`╰─ Merge commits are not allowed.`}
      ${red`   (noMergeCommits)`}
`.trim(),
		)
	})
})

describe("when 'noRepeatedSubjectLines' has a concern about the commit", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "8c1fbd48d21686c574a01fd2d5db4be1c991d897",
		message: "test",
	})
	const concern = commitConcern("noRepeatedSubjectLines", commit.sha)

	it("describes the rule violation in the commit", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`8c1fbd4`} test
      ${red`╭─────`}
      ${red`╰─ Commits must have unique subject lines within a branch.`}
      ${red`   (noRepeatedSubjectLines)`}
`.trim(),
		)
	})
})

describe("when 'noRepeatedSubjectLines' has a concern about the commit with a long subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "f3359c9a89b46736a36fa2117515afda202f5c93",
		message:
			"GH-246 Replace guesswork with a tiny chart and upgrade the `ButterflyService` to 8.0.31",
	})
	const concern = commitConcern("noRepeatedSubjectLines", commit.sha)

	it("describes the rule violation in the commit", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`f3359c9`} GH-246 Replace guesswork with a tiny chart and upgrade the \`ButterflyService\` to 8.0.31
      ${red`╭────────────────────────────────────────────────────────────────────────────────────────`}
      ${red`╰─ Commits must have unique subject lines within a branch.`}
      ${red`   (noRepeatedSubjectLines)`}
`.trim(),
		)
	})
})

describe("when 'noRestrictedTrailers' has a concern about a body line with a 'Co-authored-by' trailer", () => {
	const configuration = fakeConfiguration({
		noRestrictedTrailers: {
			options: { restrictedKeys: ["CO-AUTHORED-BY:"] },
		},
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "a04ada44cc2d13336a7b28cfb7bd8059649aa1bb",
		message:
			"Wire the release breadcrumb trail\n\nReviewed-By: April O'Neil <april.oneil@fastforward.com>\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>\nSigned-Off-By: Hamato Yoshi <hamato@nycsewers.com>\nRefs: #123",
	})
	const concern = bodyLineConcern("noRestrictedTrailers", commit.sha, { line: 2, range: [0, 14] })

	it("describes the rule violation in the body line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`a04ada4`} Wire the release breadcrumb trail
    ${grey`╭──`}
  ${grey`2 │ Reviewed-By: April O'Neil <april.oneil@fastforward.com>`}
${red`•`} ${grey`${bold`3`} │`} Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
    ${grey`· `}${red`──────┬───────`}
    ${grey`· `}      ${red`╰─ Message bodies must not contain disallowed trailers.`}
    ${grey`· `}      ${red`   (noRestrictedTrailers)`}
    ${grey`· `}      ${red`   `}
    ${grey`· `}      ${red`   Disallowed trailers:`}
    ${grey`· `}      ${red`     ∙ Co-authored-by`}
    ${grey`· `}      ${red`   `}
  ${grey`4 │ Signed-Off-By: Hamato Yoshi <hamato@nycsewers.com>`}
    ${grey`╰──`}
`.trim(),
		)
	})
})

describe("when 'noRestrictedTrailers' has a concern about a body line with a 'Refs' trailer", () => {
	const configuration = fakeConfiguration({
		noRestrictedTrailers: {
			options: { restrictedKeys: ["signed-off-by", "co-authored-by", "refs", "reviewed-by"] },
		},
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "344eaa9c854379fbd1af02092aaf093fbad974c3",
		message:
			"one link and two notes\nwith overpowered statements\nno one can beat us now hahaha\n\n  change-id: deadbeef\n  signed-off-by: baxter.stockman <baxter.stockman@fastforward.com>\n  refs: #668182",
	})
	const concern = bodyLineConcern("noRestrictedTrailers", commit.sha, { line: 5, range: [2, 6] })

	it("describes the rule violation in the body line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`344eaa9`} one link and two notes
    ${grey`╭──`}
  ${grey`5 │   signed-off-by: baxter.stockman <baxter.stockman@fastforward.com>`}
${red`•`} ${grey`${bold`6`} │`}   refs: #668182
    ${grey`· `}  ${red`─┬──`}
    ${grey`· `}   ${red`╰─ Message bodies must not contain disallowed trailers.`}
    ${grey`· `}   ${red`   (noRestrictedTrailers)`}
    ${grey`· `}   ${red`   `}
    ${grey`· `}   ${red`   Disallowed trailers:`}
    ${grey`· `}   ${red`     ∙ Co-authored-by`}
    ${grey`· `}   ${red`     ∙ Refs`}
    ${grey`· `}   ${red`     ∙ Reviewed-by`}
    ${grey`· `}   ${red`     ∙ Signed-off-by`}
    ${grey`· `}   ${red`   `}
    ${grey`╰──`}
`.trim(),
		)
	})
})

describe("when 'noRevertRevertCommits' has a concern about characters 0-14 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "d4e7a978cea34b727ea52f90c92a78fd535e4aee",
		message: 'Revert "Revert "Make the program act like a clown""',
	})
	const concern = subjectLineConcern("noRevertRevertCommits", commit.sha, { range: [0, 14] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`d4e7a97`} Revert "Revert "Make the program act like a clown""
        ${red`──────┬───────`}
              ${red`╰─ Cherry-pick the original commit instead of reverting it over.`}
              ${red`   (noRevertRevertCommits)`}
`.trim(),
		)
	})
})

describe("when 'noRevertRevertCommits' has a concern about characters 1-24 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "34aa41b818c40682cabeecd562e3dfe51df7a4a5",
		message: ' revert "revert  "revert "repair the soft ice machine """',
	})
	const concern = subjectLineConcern("noRevertRevertCommits", commit.sha, { range: [1, 24] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`34aa41b`}  revert "revert  "revert "repair the soft ice machine """
         ${red`───────────┬───────────`}
                    ${red`╰─ Cherry-pick the original commit instead of reverting it over.`}
                    ${red`   (noRevertRevertCommits)`}
`.trim(),
		)
	})
})

describe("when 'noSingleWordSubjectLines' has a concern about characters 0-3 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "964bce7ef85bb434b57a0882c5d43c8cece4938f",
		message: "WIP",
	})
	const concern = subjectLineConcern("noSingleWordSubjectLines", commit.sha, { range: [0, 3] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`964bce7`} WIP
        ${red`─┬─`}
         ${red`╰─ Subject lines must contain at least two words.`}
         ${red`   (noSingleWordSubjectLines)`}
`.trim(),
		)
	})
})

describe("when 'noSingleWordSubjectLines' has a concern about characters 11-17 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "a4b6d0e1aee11f7bc39dfd68858257e236256fbf",
		message: "fixup! #17 bugfix",
	})
	const concern = subjectLineConcern("noSingleWordSubjectLines", commit.sha, { range: [11, 17] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`a4b6d0e`} fixup! #17 bugfix
                   ${red`──┬───`}
                     ${red`╰─ Subject lines must contain at least two words.`}
                     ${red`   (noSingleWordSubjectLines)`}
`.trim(),
		)
	})
})

describe("when 'noSquashMarkers' has a concern about characters 0-6 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "ffebad193fe7d02aa9b19b70ee132a26f14f8caf",
		message: "amend!Apply strawberry jam to make the code sweeter",
	})
	const concern = subjectLineConcern("noSquashMarkers", commit.sha, { range: [0, 6] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`ffebad1`} amend!Apply strawberry jam to make the code sweeter
        ${red`──┬───`}
          ${red`╰─ Combine squash commits with their ancestors.`}
          ${red`   (noSquashMarkers)`}
`.trim(),
		)
	})
})

describe("when 'noSquashMarkers' has a concern about characters 1-14 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "56c750b0811fbcad2b237b2b99fc77d3fc91b926",
		message: " fixup! fixup! found a funny easter egg",
	})
	const concern = subjectLineConcern("noSquashMarkers", commit.sha, { range: [1, 14] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`56c750b`}  fixup! fixup! found a funny easter egg
         ${red`──────┬──────`}
               ${red`╰─ Combine squash commits with their ancestors.`}
               ${red`   (noSquashMarkers)`}
`.trim(),
		)
	})
})

describe("when 'noUnexpectedPunctuation' has a concern about characters 8-9 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "41c3cb1f09a1e33fa6bfd13c6223506d89673729",
		message: "fixed it!",
	})
	const concern = subjectLineConcern("noUnexpectedPunctuation", commit.sha, { range: [8, 9] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`41c3cb1`} fixed it!
                ${red`┬`}
                ${red`╰─ Subject lines must not end with punctuation.`}
                ${red`   (noUnexpectedPunctuation)`}
`.trim(),
		)
	})
})

describe("when 'noUnexpectedPunctuation' has a concern about characters 10-11 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "9b83d7cd4b0f0749c629afdb712b19df2b7782ab",
		message: "Formatting.",
	})
	const concern = subjectLineConcern("noUnexpectedPunctuation", commit.sha, { range: [10, 11] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`9b83d7c`} Formatting.
                  ${red`┬`}
                  ${red`╰─ Subject lines must not end with punctuation.`}
                  ${red`   (noUnexpectedPunctuation)`}
`.trim(),
		)
	})
})

describe("when 'noUnexpectedPunctuation' has a concern about characters 14-16 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "94486b7f620ad99ef8598a2bd6a3adb5b3b8d3e4",
		message: "the old route -> ",
	})
	const concern = subjectLineConcern("noUnexpectedPunctuation", commit.sha, { range: [14, 16] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`94486b7`} the old route -> 
                      ${red`┬─`}
                      ${red`╰─ Subject lines must not end with punctuation.`}
                      ${red`   (noUnexpectedPunctuation)`}
`.trim(),
		)
	})
})

describe("when 'noUnexpectedPunctuation' has a concern about characters 57-62 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "f67544d7167b417f44ffb34a8e6e762f645f546e",
		message: "a cheerful easter egg is hiding somewhere in this commit :joy:",
	})
	const concern = subjectLineConcern("noUnexpectedPunctuation", commit.sha, { range: [57, 62] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`f67544d`} a cheerful easter egg is hiding somewhere in this commit :joy:
                                                                 ${red`──┬──`}
                     ${red`Subject lines must not end with punctuation. ─╯`}
                     ${red`(noUnexpectedPunctuation)`}
`.trim(),
		)
	})
})

describe("when 'noUnexpectedPunctuation' has a concern about characters 27-31 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "926af33140bac01e1cb50df365ddd4f65bba0acd",
		message: "the moon laser is operating!!!! #42",
	})
	const concern = subjectLineConcern("noUnexpectedPunctuation", commit.sha, { range: [27, 31] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`926af33`} the moon laser is operating!!!! #42
                                   ${red`─┬──`}
                                    ${red`╰─ Subject lines must not end with punctuation.`}
                                    ${red`   (noUnexpectedPunctuation)`}
`.trim(),
		)
	})
})

describe("when 'useAuthorEmailPatterns' has a concern about a missing author email address", () => {
	const configuration = fakeConfiguration({
		useAuthorEmailPatterns: {
			options: { patterns: [String.raw`\d+\+.+@users\.noreply\.github\.com`] },
		},
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "87c2ab2dff91967340adee6a79d410f4fd6b781b",
		authorEmail: "",
		message: "Upgrade the workshop espresso workflow",
	})
	const concern = userIdentityConcern("useAuthorEmailPatterns", commit.sha, {
		field: "author:email",
	})

	it("describes the rule violation in the author's email address", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`87c2ab2`} Upgrade the workshop espresso workflow
${grey`╰─ authored by:`} 
              ${red`╭─`}
              ${red`╰─ Email addresses of commit authors must match an accepted pattern.`}
              ${red`   (useAuthorEmailPatterns)`}
              ${red`   `}
              ${red`   Accepted patterns:`}
              ${red`     ∙ ${String.raw`\d+\+.+@users\.noreply\.github\.com`}`}
`.trim(),
		)
	})
})

describe("when 'useAuthorEmailPatterns' has a concern about the author's email address", () => {
	const configuration = fakeConfiguration({
		useAuthorEmailPatterns: {
			options: {
				patterns: [
					String.raw`\d+\+.+@users\.noreply\.github\.com`,
					String.raw`.+@fictivecompany\.com`,
				],
			},
		},
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "4014427db76e7f114209216c73874649e9e1505f",
		authorEmail: "claus@santasworkshop.com",
		message: "Teach the sleigh to parallel park",
	})
	const concern = userIdentityConcern("useAuthorEmailPatterns", commit.sha, {
		field: "author:email",
	})

	it("describes the rule violation in the author's email address", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`4014427`} Teach the sleigh to parallel park
${grey`╰─ authored by:`} claus@santasworkshop.com
              ${red`╭─────────────────────────`}
              ${red`╰─ Email addresses of commit authors must match an accepted pattern.`}
              ${red`   (useAuthorEmailPatterns)`}
              ${red`   `}
              ${red`   Accepted patterns:`}
              ${red`     ∙ ${String.raw`\d+\+.+@users\.noreply\.github\.com`}`}
              ${red`     ∙ ${String.raw`.+@fictivecompany\.com`}`}
`.trim(),
		)
	})
})

describe("when 'useAuthorNamePatterns' has a concern about a missing author name", () => {
	const configuration = fakeConfiguration({
		useAuthorNamePatterns: {
			options: { patterns: [String.raw`\p{Lu}.*\s.+`] },
		},
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "f16fc9f48c40829a87cbc36f42aa6578834ed0c6",
		authorName: "",
		message: "overpowered code",
	})
	const concern = userIdentityConcern("useAuthorNamePatterns", commit.sha, {
		field: "author:name",
	})

	it("describes the rule violation in the author's name", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`f16fc9f`} overpowered code
${grey`╰─ authored by:`} 
              ${red`╭─`}
              ${red`╰─ Names of commit authors must match an accepted pattern.`}
              ${red`   (useAuthorNamePatterns)`}
              ${red`   `}
              ${red`   Accepted patterns:`}
              ${red`     ∙ ${String.raw`\p{Lu}.*\s.+`}`}
`.trim(),
		)
	})
})

describe("when 'useAuthorNamePatterns' has a concern about the author's name", () => {
	const configuration = fakeConfiguration({
		useAuthorNamePatterns: {
			options: { patterns: [String.raw`\p{Lu}.*\s.+`, String.raw`dependabot\[bot\]`] },
		},
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "e4236bf51670f99f245fdc3a5552fa2b7e6bd8c1",
		authorName: "santa.claus",
		message: "I’m not lazy, I’m on energy-saving mode",
	})
	const concern = userIdentityConcern("useAuthorNamePatterns", commit.sha, {
		field: "author:name",
	})

	it("describes the rule violation in the author's name", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`e4236bf`} I’m not lazy, I’m on energy-saving mode
${grey`╰─ authored by:`} santa.claus
              ${red`╭────────────`}
              ${red`╰─ Names of commit authors must match an accepted pattern.`}
              ${red`   (useAuthorNamePatterns)`}
              ${red`   `}
              ${red`   Accepted patterns:`}
              ${red`     ∙ ${String.raw`\p{Lu}.*\s.+`}`}
              ${red`     ∙ ${String.raw`dependabot\[bot\]`}`}
`.trim(),
		)
	})
})

describe("when 'useCapitalisedSubjectLines' has a concern about characters 0-1 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "497de39943643a56f7a69d3d19723e3035318644",
		message: "release the robot butler",
	})
	const concern = subjectLineConcern("useCapitalisedSubjectLines", commit.sha, { range: [0, 1] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`497de39`} release the robot butler
        ${red`┬`}
        ${red`╰─ The first letter in subject lines must be in uppercase.`}
        ${red`   (useCapitalisedSubjectLines)`}
`.trim(),
		)
	})
})

describe("when 'useCapitalisedSubjectLines' has a concern about characters 7-8 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "92d6b11650c6b63d64fd77522241e45b7f50ff5b",
		message: "fixup! resolve a bug that thought it was a feature",
	})
	const concern = subjectLineConcern("useCapitalisedSubjectLines", commit.sha, { range: [7, 8] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`92d6b11`} fixup! resolve a bug that thought it was a feature
               ${red`┬`}
               ${red`╰─ The first letter in subject lines must be in uppercase.`}
               ${red`   (useCapitalisedSubjectLines)`}
`.trim(),
		)
	})
})

describe("when 'useCommitterEmailPatterns' has a concern about a missing committer email address", () => {
	const configuration = fakeConfiguration({
		useCommitterEmailPatterns: {
			options: { patterns: [String.raw`\d+\+.+@users\.noreply\.github\.com`] },
		},
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "28a5bed21c189fc505c9af3696c7ff7a3a79524e",
		committerEmail: "",
		message: "Remove stale confetti from the deployment logs",
	})
	const concern = userIdentityConcern("useCommitterEmailPatterns", commit.sha, {
		field: "committer:email",
	})

	it("describes the rule violation in the committer's email address", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`28a5bed`} Remove stale confetti from the deployment logs
${grey`╰─ committed by:`} 
               ${red`╭─`}
               ${red`╰─ Email addresses of committers must match an accepted pattern.`}
               ${red`   (useCommitterEmailPatterns)`}
               ${red`   `}
               ${red`   Accepted patterns:`}
               ${red`     ∙ ${String.raw`\d+\+.+@users\.noreply\.github\.com`}`}
`.trim(),
		)
	})
})

describe("when 'useCommitterEmailPatterns' has a concern about the committer's email address", () => {
	const configuration = fakeConfiguration({
		useCommitterEmailPatterns: {
			options: {
				patterns: [
					String.raw`\d+\+.+@users\.noreply\.github\.com`,
					String.raw`noreply@github\.com`,
				],
			},
		},
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "55ef98aa89887ba6937a616b6044cc217da57f7a",
		committerEmail: "noreply@tmnt.com",
		message: "Teach the release notes to speak plainly",
	})
	const concern = userIdentityConcern("useCommitterEmailPatterns", commit.sha, {
		field: "committer:email",
	})

	it("describes the rule violation in the committer's email address", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`55ef98a`} Teach the release notes to speak plainly
${grey`╰─ committed by:`} noreply@tmnt.com
               ${red`╭─────────────────`}
               ${red`╰─ Email addresses of committers must match an accepted pattern.`}
               ${red`   (useCommitterEmailPatterns)`}
               ${red`   `}
               ${red`   Accepted patterns:`}
               ${red`     ∙ ${String.raw`\d+\+.+@users\.noreply\.github\.com`}`}
               ${red`     ∙ ${String.raw`noreply@github\.com`}`}
`.trim(),
		)
	})
})

describe("when 'useCommitterNamePatterns' has a concern about a missing committer name", () => {
	const configuration = fakeConfiguration({
		useCommitterNamePatterns: {
			options: { patterns: [String.raw`\p{Lu}.*\s.+`] },
		},
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "307ce5e6cfe9fbb67f62ca3d40447e9143fb8d38",
		committerName: "",
		message: "retune the tiny deployment bell",
	})
	const concern = userIdentityConcern("useCommitterNamePatterns", commit.sha, {
		field: "committer:name",
	})

	it("describes the rule violation in the committer's name", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`307ce5e`} retune the tiny deployment bell
${grey`╰─ committed by:`} 
               ${red`╭─`}
               ${red`╰─ Names of committers must match an accepted pattern.`}
               ${red`   (useCommitterNamePatterns)`}
               ${red`   `}
               ${red`   Accepted patterns:`}
               ${red`     ∙ ${String.raw`\p{Lu}.*\s.+`}`}
`.trim(),
		)
	})
})

describe("when 'useCommitterNamePatterns' has a concern about the committer's name", () => {
	const configuration = fakeConfiguration({
		useCommitterNamePatterns: {
			options: {
				patterns: [
					String.raw`\p{Lu}.*\s.+`,
					String.raw`dependabot\[bot\]`,
					String.raw`renovate\[bot\]`,
					String.raw`GitHub`,
				],
			},
		},
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "61a6e5334d93126c4adec5c594bd75a3c7fee7ec",
		committerName: "master splinter",
		message: "Make the changelog less mysterious",
	})
	const concern = userIdentityConcern("useCommitterNamePatterns", commit.sha, {
		field: "committer:name",
	})

	it("describes the rule violation in the committer's name", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`61a6e53`} Make the changelog less mysterious
${grey`╰─ committed by:`} master splinter
               ${red`╭────────────────`}
               ${red`╰─ Names of committers must match an accepted pattern.`}
               ${red`   (useCommitterNamePatterns)`}
               ${red`   `}
               ${red`   Accepted patterns:`}
               ${red`     ∙ ${String.raw`\p{Lu}.*\s.+`}`}
               ${red`     ∙ ${String.raw`dependabot\[bot\]`}`}
               ${red`     ∙ ${String.raw`renovate\[bot\]`}`}
               ${red`     ∙ ${String.raw`GitHub`}`}
`.trim(),
		)
	})
})

describe("when 'useConciseSubjectLines' has a concern about characters 20-25 of the subject line", () => {
	const configuration = fakeConfiguration({
		useConciseSubjectLines: { options: { maxLength: 20 } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "68e921648c4a19e93d72f42a5ed39c3eba704e41",
		message: "Remove redundant call to `wrapper`",
	})
	const concern = subjectLineConcern("useConciseSubjectLines", commit.sha, { range: [20, 25] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`68e9216`} Remove redundant call to \`wrapper\`
                            ${red`──┬──`}
                              ${red`╰─ Subject lines must not exceed 20 characters.`}
                              ${red`   (useConciseSubjectLines)`}
`.trim(),
		)
	})
})

describe("when 'useConciseSubjectLines' has a concern about characters 20-67 of the subject line", () => {
	const configuration = fakeConfiguration({
		useConciseSubjectLines: { options: { maxLength: 20 } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "9bed522bd48f0aee7b7574635bb23f5decdc4999",
		message: "revisit the boolean properties in the `IceCreamMachine` constructor",
	})
	const concern = subjectLineConcern("useConciseSubjectLines", commit.sha, { range: [20, 67] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`9bed522`} revisit the boolean properties in the \`IceCreamMachine\` constructor
                            ${red`───────────────────────┬───────────────────────`}
     ${red`Subject lines must not exceed 20 characters. ─╯`}
     ${red`(useConciseSubjectLines)`}
`.trim(),
		)
	})
})

describe("when 'useConciseSubjectLines' has a concern about characters 50-52 of the subject line", () => {
	const configuration = fakeConfiguration({
		useConciseSubjectLines: { options: { maxLength: 50 } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "e8c95d69587a51685070837aaf3a28746e3cbba8",
		message: "Retrieve data from the exclusive third-party service",
	})
	const concern = subjectLineConcern("useConciseSubjectLines", commit.sha, { range: [50, 52] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`e8c95d6`} Retrieve data from the exclusive third-party service
                                                          ${red`─┬`}
             ${red`Subject lines must not exceed 50 characters. ─╯`}
             ${red`(useConciseSubjectLines)`}
`.trim(),
		)
	})
})

describe("when 'useConciseSubjectLines' has a concern about characters 72-76 of the subject line", () => {
	const configuration = fakeConfiguration({
		useConciseSubjectLines: { options: { maxLength: 72 } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "be86674322213fb408d176589fadb452cd44a2df",
		message: "make a genuine attempt to fix the bugs that the users were complaining about",
	})
	const concern = subjectLineConcern("useConciseSubjectLines", commit.sha, { range: [72, 76] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`be86674`} make a genuine attempt to fix the bugs that the users were complaining about
                                                                                ${red`──┬─`}
                                    ${red`Subject lines must not exceed 72 characters. ─╯`}
                                    ${red`(useConciseSubjectLines)`}
`.trim(),
		)
	})
})

describe("when 'useEmptyLineBeforeBodyLines' has a concern about the first body line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "f163851c187a568acc631fff402fcca43f41968d",
		message: "Install a quieter keyboard\nThe old one sounded like hail.",
	})
	const concern = bodyLineConcern("useEmptyLineBeforeBodyLines", commit.sha, {
		line: 0,
		range: [0, 1],
	})

	it("describes the rule violation in the body line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`f163851`} Install a quieter keyboard
    ${grey`╭──`}
${red`•`} ${grey`${bold`1`} │`} The old one sounded like hail.
    ${grey`· `}${red`┬`}
    ${grey`· `}${red`╰─ Subject lines and message bodies must be separated by exactly one empty line.`}
    ${grey`· `}${red`   (useEmptyLineBeforeBodyLines)`}
    ${grey`╰──`}
`.trim(),
		)
	})
})

describe("when 'useEmptyLineBeforeBodyLines' has a concern about an extra empty body line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "30fd57b19c55b3746a157f5981838e26865637f2",
		message: "Clean the tiny dashboard\n\n\nThe widgets sparkle.\nAnd the birds are joyful.",
	})
	const concern = bodyLineConcern("useEmptyLineBeforeBodyLines", commit.sha, {
		line: 1,
		range: [0, 1],
	})

	it("describes the rule violation in the body line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`30fd57b`} Clean the tiny dashboard
    ${grey`╭──`}
  ${grey`1 │ `}
${red`•`} ${grey`${bold`2`} │`} 
    ${grey`· `}${red`┬`}
    ${grey`· `}${red`╰─ Subject lines and message bodies must be separated by exactly one empty line.`}
    ${grey`· `}${red`   (useEmptyLineBeforeBodyLines)`}
  ${grey`3 │ The widgets sparkle.`}
    ${grey`╰──`}
`.trim(),
		)
	})
})

describe("when 'useImperativeSubjectLines' has a concern about characters 0-5 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "9e45e097a594deaf39b360c7fb285be38b5b68a2",
		message: "Added a feature that should have stayed on the whiteboard",
	})
	const concern = subjectLineConcern("useImperativeSubjectLines", commit.sha, { range: [0, 5] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`9e45e09`} Added a feature that should have stayed on the whiteboard
        ${red`──┬──`}
          ${red`╰─ Subject lines must start with a verb in the imperative mood.`}
          ${red`   (useImperativeSubjectLines)`}
`.trim(),
		)
	})
})

describe("when 'useImperativeSubjectLines' has a concern about characters 14-18 of the subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "339b6fcb8aedbe7b19443e39bcc1e24f615287a7",
		message: "amend! GH-55: made the console less dramatic",
	})
	const concern = subjectLineConcern("useImperativeSubjectLines", commit.sha, { range: [14, 18] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`339b6fc`} amend! GH-55: made the console less dramatic
                      ${red`─┬──`}
                       ${red`╰─ Subject lines must start with a verb in the imperative mood.`}
                       ${red`   (useImperativeSubjectLines)`}
`.trim(),
		)
	})
})

describe("when 'useIssueLinks' with position 'anywhere' has a concern about characters 0-1 of the subject line", () => {
	const configuration = fakeConfiguration({
		useIssueLinks: { options: { position: "anywhere" } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "c861aeae9dcdea99776d1e56c4de1070ba29effb",
		message: "Organise the robot uprising without a ticket",
	})
	const concern = subjectLineConcern("useIssueLinks", commit.sha, { range: [0, 1] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`c861aea`} Organise the robot uprising without a ticket
        ${red`┬`}
        ${red`╰─ Subject lines must include an issue link.`}
        ${red`   (useIssueLinks)`}
        ${red`   `}
        ${red`   Examples: #123, GH-123, GL-123`}
`.trim(),
		)
	})
})

describe("when 'useIssueLinks' with position 'prefix' has a concern about characters 7-8 of the subject line", () => {
	const configuration = fakeConfiguration({
		useIssueLinks: { options: { position: "prefix" } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "fb100238cf55fdcc7c48044df4b5922c0886f5c2",
		message: "amend! Teach the unit tests to write themselves",
	})
	const concern = subjectLineConcern("useIssueLinks", commit.sha, { range: [7, 8] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`fb10023`} amend! Teach the unit tests to write themselves
               ${red`┬`}
               ${red`╰─ Subject lines must start with an issue link.`}
               ${red`   (useIssueLinks)`}
               ${red`   `}
               ${red`   Examples: #123, GH-123, GL-123`}
`.trim(),
		)
	})
})

describe("when 'useIssueLinks' with position 'suffix' has a concern about characters 49-50 of the subject line", () => {
	const configuration = fakeConfiguration({
		useIssueLinks: { options: { position: "suffix" } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "d9a30bb22c78cf24fc6a79a3131a33829792bde4",
		message: "make the automated tests question their existence",
	})
	const concern = subjectLineConcern("useIssueLinks", commit.sha, { range: [49, 50] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`d9a30bb`} make the automated tests question their existence
                                                         ${red`┬`}
             ${red`Subject lines must end with an issue link. ─╯`}
             ${red`(useIssueLinks)`}
             ${red``}
             ${red`Examples: #123, GH-123, GL-123`}
`.trim(),
		)
	})
})

describe("when 'useIssueLinks' with position 'suffix' has a concern about characters 26-27 of the subject line", () => {
	const configuration = fakeConfiguration({
		useIssueLinks: { options: { position: "suffix" } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "5761bad8f4bbdd9f22eac552ca15a42dd547692a",
		message: "Cooked this commit at 3 AM",
	})
	const concern = subjectLineConcern("useIssueLinks", commit.sha, { range: [26, 27] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`5761bad`} Cooked this commit at 3 AM
                                  ${red`┬`}
                                  ${red`╰─ Subject lines must end with an issue link.`}
                                  ${red`   (useIssueLinks)`}
                                  ${red`   `}
                                  ${red`   Examples: #123, GH-123, GL-123`}
`.trim(),
		)
	})
})

describe("when 'useIssueLinks' with position 'anywhere' and a wildcard has a concern about characters 0-1 of the subject line", () => {
	const configuration = fakeConfiguration(
		{ useIssueLinks: { options: { position: "anywhere" } } },
		{ issueLinks: { prefixes: ["#"], wildcards: ["(no-issue)"] } },
	)
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "ca745a72a024df3e612faeb3dc10090eb367c18a",
		message: "attend the acoustic show",
	})
	const concern = subjectLineConcern("useIssueLinks", commit.sha, { range: [0, 1] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`ca745a7`} attend the acoustic show
        ${red`┬`}
        ${red`╰─ Subject lines must include an issue link.`}
        ${red`   (useIssueLinks)`}
        ${red`   `}
        ${red`   Examples: #123, (no-issue)`}
`.trim(),
		)
	})
})

describe("when 'useIssueLinks' with position 'anywhere' and Jira-style issue links has a concern about characters 10-11 of the subject line", () => {
	const configuration = fakeConfiguration(
		{ useIssueLinks: { options: { position: "anywhere" } } },
		{ issueLinks: { prefixes: ["ABC-"], wildcards: [] } },
	)
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "d0709d2e4d2c55bf37ec7e7632f655e8e9b3eb90",
		message: " squash!  made the code so clean that it sparkles",
	})
	const concern = subjectLineConcern("useIssueLinks", commit.sha, { range: [10, 11] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`d0709d2`}  squash!  made the code so clean that it sparkles
                  ${red`┬`}
                  ${red`╰─ Subject lines must include an issue link.`}
                  ${red`   (useIssueLinks)`}
                  ${red`   `}
                  ${red`   Example: ABC-123`}
`.trim(),
		)
	})
})

describe("when 'useIssueLinks' with position 'prefix' and custom-style issue links has a concern about characters 0-1 of the subject line", () => {
	const configuration = fakeConfiguration(
		{ useIssueLinks: { options: { position: "prefix" } } },
		{ issueLinks: { prefixes: ["test#", "experiment#"], wildcards: ["[incident]"] } },
	)
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "f6fc2399d62caefc3e4bfd8bf2a8da28fffafed4",
		message: "Refactored code, now it’s overpowered",
	})
	const concern = subjectLineConcern("useIssueLinks", commit.sha, { range: [0, 1] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`f6fc239`} Refactored code, now it’s overpowered
        ${red`┬`}
        ${red`╰─ Subject lines must start with an issue link.`}
        ${red`   (useIssueLinks)`}
        ${red`   `}
        ${red`   Examples: test#123, experiment#123, [incident]`}
`.trim(),
		)
	})
})

describe("when 'useIssueLinks' with position 'suffix' and Jira-style issue links has a concern about characters 41-42 of the subject line", () => {
	const configuration = fakeConfiguration(
		{ useIssueLinks: { options: { position: "suffix" } } },
		{ issueLinks: { prefixes: ["AWESOME-", "UNICORN-", "PROJECT-"], wildcards: [] } },
	)
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "cccee2c633f0e65d939df7d9953f59ee9322c323",
		message: "Fixed a bad typo in comment (yes, really)",
	})
	const concern = subjectLineConcern("useIssueLinks", commit.sha, { range: [41, 42] })

	it("describes the rule violation in the subject line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`cccee2c`} Fixed a bad typo in comment (yes, really)
                                                 ${red`┬`}
     ${red`Subject lines must end with an issue link. ─╯`}
     ${red`(useIssueLinks)`}
     ${red``}
     ${red`Examples: AWESOME-123, UNICORN-123, PROJECT-123`}
`.trim(),
		)
	})
})

describe("when 'useLineWrapping' has a concern about characters 20-22 of a body line", () => {
	const configuration = fakeConfiguration({
		useLineWrapping: { options: { maxLength: 20 } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "646e47176db1f754a924ffed3ab6f8249c38b5cb",
		message: "Tidy the note\n\nBefore this note.\nA tiny note runs long.\nAfter this note.",
	})
	const concern = bodyLineConcern("useLineWrapping", commit.sha, { line: 2, range: [20, 22] })

	it("describes the rule violation in the body line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`646e471`} Tidy the note
    ${grey`╭──`}
  ${grey`2 │ Before this note.`}
${red`•`} ${grey`${bold`3`} │`} A tiny note runs long.
    ${grey`· `}                    ${red`┬─`}
    ${grey`· `}                    ${red`╰─ Message body lines must not exceed 20 characters.`}
    ${grey`· `}                    ${red`   (useLineWrapping)`}
  ${grey`4 │ After this note.`}
    ${grey`╰──`}
`.trim(),
		)
	})
})

describe("when 'useLineWrapping' has a concern about characters 20-56 of a body line", () => {
	const configuration = fakeConfiguration({
		useLineWrapping: { options: { maxLength: 20 } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "7756d3722de8fcf41cd37d2a1ce50b86e8c3bf11",
		message:
			"Record the migration\n\nThe pager now points to the correct team before sunrise.\n\n```text\nThis fenced explanation is long but should not be marked.\nAnother fenced line keeps the sample readable.\n```",
	})
	const concern = bodyLineConcern("useLineWrapping", commit.sha, { line: 1, range: [20, 56] })

	it("describes the rule violation in the body line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`7756d37`} Record the migration
    ${grey`╭──`}
  ${grey`1 │ `}
${red`•`} ${grey`${bold`2`} │`} The pager now points to the correct team before sunrise.
    ${grey`· `}                    ${red`─────────────────┬──────────────────`}
    ${grey`· `}                                     ${red`╰─ Message body lines must not exceed 20 characters.`}
    ${grey`· `}                                     ${red`   (useLineWrapping)`}
  ${grey`3 │ `}
    ${grey`╰──`}
`.trim(),
		)
	})
})

describe("when 'useLineWrapping' has a concern about characters 50-77 of a body line", () => {
	const configuration = fakeConfiguration({
		useLineWrapping: { options: { maxLength: 50 } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "df31f7e62eccc9663a9b1d8339c22c1cfd5acf6e",
		message:
			"squash! refine the deploy notes\n\nthe deploy bot left a very long note about sandwiches and spectral keyboards.\nthe release train leaves at noon with snacks.",
	})
	const concern = bodyLineConcern("useLineWrapping", commit.sha, { line: 1, range: [50, 77] })

	it("describes the rule violation in the body line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`df31f7e`} squash! refine the deploy notes
    ${grey`╭──`}
  ${grey`1 │ `}
${red`•`} ${grey`${bold`2`} │`} the deploy bot left a very long note about sandwiches and spectral keyboards.
    ${grey`· `}                                                  ${red`─────────────┬─────────────`}
    ${grey`· `}            ${red`Message body lines must not exceed 50 characters. ─╯`}
    ${grey`· `}            ${red`(useLineWrapping)`}
  ${grey`3 │ the release train leaves at noon with snacks.`}
    ${grey`╰──`}
`.trim(),
		)
	})
})

describe("when 'useLineWrapping' has a concern about characters 72-73 of a body line", () => {
	const configuration = fakeConfiguration({
		useLineWrapping: { options: { maxLength: 72 } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "e0121c88a51c6859cdf081d4f2b902b3bba81177",
		message:
			"Ship to production\n\nIt was just a matter of time before it would cause customers to complain.",
	})
	const concern = bodyLineConcern("useLineWrapping", commit.sha, { line: 1, range: [72, 73] })

	it("describes the rule violation in the body line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`e0121c8`} Ship to production
    ${grey`╭──`}
  ${grey`1 │ `}
${red`•`} ${grey`${bold`2`} │`} It was just a matter of time before it would cause customers to complain.
    ${grey`· `}                                                                        ${red`┬`}
    ${grey`· `}                     ${red`Message body lines must not exceed 72 characters. ─╯`}
    ${grey`· `}                     ${red`(useLineWrapping)`}
    ${grey`╰──`}
`.trim(),
		)
	})
})

describe("when 'useLineWrapping' has a concern about characters 72-91 of a body line", () => {
	const configuration = fakeConfiguration({
		useLineWrapping: { options: { maxLength: 72 } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "14c415edd4649de8cfc64fb4602a3e4a1afb9995",
		message:
			"Audit the migration\n\nFirst note.\nSecond note.\nThird note.\nFourth note.\nFifth note.\n```text\nA fenced example can span several lines.\n```\nThe tenth body line is intentionally long so the report shows its two-digit gutter clearly.",
	})
	const concern = bodyLineConcern("useLineWrapping", commit.sha, { line: 9, range: [72, 91] })

	it("describes the rule violation in the body line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`14c415e`} Audit the migration
     ${grey`╭──`}
  ${grey` 9 │ \`\`\``}
${red`•`} ${grey`${bold`10`} │`} The tenth body line is intentionally long so the report shows its two-digit gutter clearly.
     ${grey`· `}                                                                        ${red`─────────┬─────────`}
     ${grey`· `}                              ${red`Message body lines must not exceed 72 characters. ─╯`}
     ${grey`· `}                              ${red`(useLineWrapping)`}
     ${grey`╰──`}
`.trim(),
		)
	})
})

describe("when 'useLineWrapping' has a concern about characters 72-95 of a body line", () => {
	const configuration = fakeConfiguration({
		useLineWrapping: { options: { maxLength: 72 } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "2376812af70245dce50251837a651cfc39289b2e",
		message:
			"Audit the deployment\n\nFirst.\nSecond.\nThird.\nFourth.\nFifth.\nSixth.\n```text\nA fenced example occupies one line.\nThe second fenced line keeps the robot amused.\n```\nThe twelfth body line is also intentionally too long for the report to show a two-digit gutter.\nmore info goes here...",
	})
	const concern = bodyLineConcern("useLineWrapping", commit.sha, { line: 11, range: [72, 95] })

	it("describes the rule violation in the body line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`2376812`} Audit the deployment
     ${grey`╭──`}
  ${grey`11 │ \`\`\``}
${red`•`} ${grey`${bold`12`} │`} The twelfth body line is also intentionally too long for the report to show a two-digit gutter.
     ${grey`· `}                                                                        ${red`───────────┬───────────`}
     ${grey`· `}                                ${red`Message body lines must not exceed 72 characters. ─╯`}
     ${grey`· `}                                ${red`(useLineWrapping)`}
  ${grey`13 │ more info goes here...`}
     ${grey`╰──`}
`.trim(),
		)
	})
})

describe("when 'useLineWrapping' has a concern about characters 130-154 of a body line", () => {
	const configuration = fakeConfiguration({
		useLineWrapping: { options: { maxLength: 72 } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "a5fa8214282a38861f929d8a7bafa727b45c4562",
		message:
			"Document the audit breadcrumb\n\nRead https://github.com/rainstormy/comet/pull/42 and keep the `ReleaseLedger` adapter available while the robots inspect the quiet archive before sunrise.",
	})
	const concern = bodyLineConcern("useLineWrapping", commit.sha, { line: 1, range: [130, 154] })

	it("describes the rule violation in the body line", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`a5fa821`} Document the audit breadcrumb
    ${grey`╭──`}
  ${grey`1 │ `}
${red`•`} ${grey`${bold`2`} │`} Read https://github.com/rainstormy/comet/pull/42 and keep the \`ReleaseLedger\` adapter available while the robots inspect the quiet archive before sunrise.
    ${grey`· `}                                                                                                                                  ${red`────────────┬───────────`}
    ${grey`· `}                                                                                           ${red`Message body lines must not exceed 72 characters. ─╯`}
    ${grey`· `}                                                                                           ${red`(useLineWrapping)`}
    ${grey`╰──`}
`.trim(),
		)
	})
})

describe("when 'useLineWrapping' has concerns about two body lines", () => {
	const configuration = fakeConfiguration({
		useLineWrapping: { options: { maxLength: 20 } },
	})
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "62f9aaea578ae41f1ff7bab5192ebabcb282ab99",
		message:
			"Polish the release notes\n\nThe first migration note is intentionally too long for this tiny limit.\nThe second note also runs beyond twenty characters for comparison.\nShort.",
	})
	const concerns = [
		bodyLineConcern("useLineWrapping", commit.sha, { line: 1, range: [20, 71] }),
		bodyLineConcern("useLineWrapping", commit.sha, { line: 2, range: [20, 66] }),
	]

	it("describes the rule violations in the body lines", () => {
		const actualOutput = commitwiseReport(concerns, [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`62f9aae`} Polish the release notes
    ${grey`╭──`}
  ${grey`1 │ `}
${red`•`} ${grey`${bold`2`} │`} The first migration note is intentionally too long for this tiny limit.
    ${grey`· `}                    ${red`─────────────────────────┬─────────────────────────`}
    ${grey`· `}                                             ${red`╰─ Message body lines must not exceed 20 characters.`}
    ${grey`· `}                                             ${red`   (useLineWrapping)`}
  ${grey`3 │ The second note also runs beyond twenty characters for comparison.`}
    ${grey`╰──`}

${grey`62f9aae`} Polish the release notes
    ${grey`╭──`}
  ${grey`2 │ The first migration note is intentionally too long for this tiny limit.`}
${red`•`} ${grey`${bold`3`} │`} The second note also runs beyond twenty characters for comparison.
    ${grey`· `}                    ${red`──────────────────────┬───────────────────────`}
    ${grey`· `}                                          ${red`╰─ Message body lines must not exceed 20 characters.`}
    ${grey`· `}                                          ${red`   (useLineWrapping)`}
  ${grey`4 │ Short.`}
    ${grey`╰──`}
`.trim(),
		)
	})
})

describe("when 'useSignedCommits' has a concern about the commit", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "9b9e2ab8f3248152474f41f728f1221d5bf55a16",
		message: "Sign the pantry inventory app",
		signature: "",
	})
	const concern = commitConcern("useSignedCommits", commit.sha)

	it("describes the rule violation in the commit", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`9b9e2ab`} Sign the pantry inventory app
      ${red`╭──────────────────────────────`}
      ${red`╰─ Commits must be signed cryptographically with a signing key.`}
      ${red`   (useSignedCommits)`}
`.trim(),
		)
	})
})

describe("when 'useSignedCommits' has a concern about the commit with a long subject line", () => {
	const configuration = fakeConfiguration()
	const fakeCommit = fakeCommitFactory(configuration.tokens)

	const commit = fakeCommit({
		sha: "42cefd126a47bfd368d774047a711519eadc2d05",
		message: "fixup! GH-692 it's raining gold everywhere we go",
		signature: "",
	})
	const concern = commitConcern("useSignedCommits", commit.sha)

	it("describes the rule violation in the commit", () => {
		const actualOutput = commitwiseReport([concern], [commit], configuration)
		expect(actualOutput).toBe(
			`
${grey`42cefd1`} fixup! GH-692 it's raining gold everywhere we go
      ${red`╭─────────────────────────────────────────────────`}
      ${red`╰─ Commits must be signed cryptographically with a signing key.`}
      ${red`   (useSignedCommits)`}
`.trim(),
		)
	})
})
