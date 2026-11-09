import { describe, expect, it } from "vitest"
import {
	type GitCommitMessageCleanupMode,
	type GitCommitMessageCleanupOptions,
	cleanupGitCommitMessage,
} from "#commits/git/CleanupGitCommitMessage.ts"

const SCISSORS_LINE = "# ------------------------ >8 ------------------------"

const STATUS_BLOCK = [
	"# Please enter the commit message for your changes. Lines starting",
	"# with '#' will be ignored, and an empty message aborts the commit.",
	"#",
	"# On branch main",
	"# Changes to be committed:",
	"#\tmodified:   README.md",
	"#",
].join("\n")

const VERBOSE_DIFF = [
	SCISSORS_LINE,
	"# Do not modify or remove the line above.",
	"# Everything below it will be ignored.",
	"diff --git a/README.md b/README.md",
	"index 0f4a1e2..8b7c3d9 100644",
	"--- a/README.md",
	"+++ b/README.md",
	"@@ -1 +1 @@",
	"-# Comet",
	"+# Comet ☄️ with a remarkably long heading that exceeds the line wrapping limit by far",
].join("\n")

describe.each`
	mode            | isEdited
	${"whitespace"} | ${false}
	${"whitespace"} | ${true}
	${"default"}    | ${false}
	${"scissors"}   | ${false}
`(
	"when the cleanup mode is $mode and the message is edited: $isEdited",
	(props: { mode: GitCommitMessageCleanupMode; isEdited: boolean }) => {
		const options: GitCommitMessageCleanupOptions = {
			mode: props.mode,
			commentString: "#",
			isEdited: props.isEdited,
		}

		describe.each`
			rawMessage                                             | expectedMessage
			${"Feed the robot butler"}                             | ${"Feed the robot butler"}
			${"Feed the robot butler\n"}                           | ${"Feed the robot butler"}
			${"Feed the robot butler  \n\n\n\nIt is hungry. \n\n"} | ${"Feed the robot butler\n\nIt is hungry."}
			${"\n\n  Feed the robot butler\n"}                     | ${"  Feed the robot butler"}
			${"Feed the robot \t\r\nbutler\v\f\n"}                 | ${"Feed the robot\nbutler\v\f"}
			${"#123 Feed the robot butler\n\n# It is hungry."}     | ${"#123 Feed the robot butler\n\n# It is hungry."}
			${"Feed the robot butler\n#\n\n\n#"}                   | ${"Feed the robot butler\n#\n\n#"}
		`(
			"and the raw message is $rawMessage",
			(messageProps: { rawMessage: string; expectedMessage: string }) => {
				const actualMessage = cleanupGitCommitMessage(messageProps.rawMessage, options)

				it("removes trailing whitespace and excessive blank lines, but keeps comment lines", () => {
					expect(actualMessage).toBe(messageProps.expectedMessage)
				})
			},
		)

		describe.each`
			rawMessage
			${""}
			${"\n"}
			${"\n \n\t\n\n"}
		`("and the raw message of $rawMessage is blank", (messageProps: { rawMessage: string }) => {
			const actualMessage = cleanupGitCommitMessage(messageProps.rawMessage, options)

			it("indicates that Git will abort the commit", () => {
				expect(actualMessage).toBeNull()
			})
		})
	},
)

describe("when the cleanup mode is whitespace and the message is not edited", () => {
	const options: GitCommitMessageCleanupOptions = {
		mode: "whitespace",
		commentString: "#",
		isEdited: false,
	}

	describe("and the raw message contains a scissors line", () => {
		const rawMessage = `Cut the red wire\n\n${SCISSORS_LINE}\nThen cut the blue wire`
		const actualMessage = cleanupGitCommitMessage(rawMessage, options)

		it("keeps the scissors line and the text below it", () => {
			expect(actualMessage).toBe(rawMessage)
		})
	})
})

describe.each`
	mode         | isEdited
	${"strip"}   | ${false}
	${"strip"}   | ${true}
	${"default"} | ${true}
`(
	"when the cleanup mode is $mode and the message is edited: $isEdited",
	(props: { mode: GitCommitMessageCleanupMode; isEdited: boolean }) => {
		describe.each`
			commentString | rawMessage                                                                         | expectedMessage
			${"#"}        | ${`Feed the robot butler\n\n${STATUS_BLOCK}\n`}                                    | ${"Feed the robot butler"}
			${"#"}        | ${`Feed the robot butler  \n# It is hungry.\nGive it bolts.\n\n\n${STATUS_BLOCK}`} | ${"Feed the robot butler\nGive it bolts."}
			${"#"}        | ${"Feed the robot butler\n\n  # It is hungry.\n#\n# Give it bolts."}               | ${"Feed the robot butler\n\n  # It is hungry."}
			${"#"}        | ${"#123 Feed the robot butler\n\nGive it bolts."}                                  | ${"Give it bolts."}
			${";"}        | ${"#123 Feed the robot butler\n; It is hungry.\n\n; Give it bolts.\n# Or nuts."}   | ${"#123 Feed the robot butler\n\n# Or nuts."}
			${"//"}       | ${"Feed the robot butler\n\n# It is hungry.\n// Give it bolts.\n/ Or nuts."}       | ${"Feed the robot butler\n\n# It is hungry.\n/ Or nuts."}
		`(
			"and the raw message with a comment string of $commentString is $rawMessage",
			(messageProps: { commentString: string; rawMessage: string; expectedMessage: string }) => {
				const options: GitCommitMessageCleanupOptions = {
					mode: props.mode,
					commentString: messageProps.commentString,
					isEdited: props.isEdited,
				}
				const actualMessage = cleanupGitCommitMessage(messageProps.rawMessage, options)

				it("removes comment lines, trailing whitespace, and excessive blank lines", () => {
					expect(actualMessage).toBe(messageProps.expectedMessage)
				})
			},
		)

		describe.each`
			rawMessage
			${""}
			${"\n\n"}
			${STATUS_BLOCK}
			${`\n  \n${STATUS_BLOCK}\n\n`}
		`(
			"and the raw message of $rawMessage does not have any lines other than comments and blank lines",
			(messageProps: { rawMessage: string }) => {
				const options: GitCommitMessageCleanupOptions = {
					mode: props.mode,
					commentString: "#",
					isEdited: props.isEdited,
				}
				const actualMessage = cleanupGitCommitMessage(messageProps.rawMessage, options)

				it("indicates that Git will abort the commit", () => {
					expect(actualMessage).toBeNull()
				})
			},
		)
	},
)

describe.each`
	mode            | expectedMessage
	${"default"}    | ${"Feed the robot butler\n\nGive it bolts."}
	${"strip"}      | ${"Feed the robot butler\n\nGive it bolts."}
	${"scissors"}   | ${"Feed the robot butler\n\n# It is hungry.\nGive it bolts."}
	${"whitespace"} | ${"Feed the robot butler\n\n# It is hungry.\nGive it bolts."}
	${"verbatim"}   | ${"Feed the robot butler  \n\n# It is hungry.\nGive it bolts.\n"}
`(
	"when the cleanup mode is $mode and the edited message contains a verbose diff below a scissors line",
	(props: { mode: GitCommitMessageCleanupMode; expectedMessage: string }) => {
		const options: GitCommitMessageCleanupOptions = {
			mode: props.mode,
			commentString: "#",
			isEdited: true,
		}
		const rawMessage = `Feed the robot butler  \n\n# It is hungry.\nGive it bolts.\n\n${VERBOSE_DIFF}\n`
		const actualMessage = cleanupGitCommitMessage(rawMessage, options)

		it("removes the scissors line and everything below it", () => {
			expect(actualMessage).toBe(props.expectedMessage)
		})
	},
)

describe("when the edited message contains multiple scissors lines", () => {
	const options: GitCommitMessageCleanupOptions = {
		mode: "scissors",
		commentString: "#",
		isEdited: true,
	}
	const rawMessage = `Cut the red wire\n${SCISSORS_LINE}\nThen cut the blue wire\n${VERBOSE_DIFF}`
	const actualMessage = cleanupGitCommitMessage(rawMessage, options)

	it("removes the first scissors line and everything below it", () => {
		expect(actualMessage).toBe("Cut the red wire")
	})
})

describe.each`
	commentString | rawMessage                                                                          | expectedMessage
	${";"}        | ${"Cut the red wire\n; ------------------------ >8 ------------------------\ndiff"} | ${"Cut the red wire"}
	${";"}        | ${`Cut the red wire\n${SCISSORS_LINE}\nThen cut the blue wire`}                     | ${`Cut the red wire\n${SCISSORS_LINE}\nThen cut the blue wire`}
	${"#"}        | ${"Cut the red wire\n#  ------------------------ >8 ------------------------\nx"}   | ${"Cut the red wire\n#  ------------------------ >8 ------------------------\nx"}
	${"#"}        | ${"Cut the red wire\n # ------------------------ >8 ------------------------\nx"}   | ${"Cut the red wire\n # ------------------------ >8 ------------------------\nx"}
`(
	"when the edited message with a comment string of $commentString is $rawMessage",
	(props: { commentString: string; rawMessage: string; expectedMessage: string }) => {
		const options: GitCommitMessageCleanupOptions = {
			mode: "scissors",
			commentString: props.commentString,
			isEdited: true,
		}
		const actualMessage = cleanupGitCommitMessage(props.rawMessage, options)

		it("only truncates the message at a scissors line that matches the comment string exactly", () => {
			expect(actualMessage).toBe(props.expectedMessage)
		})
	},
)

describe.each`
	rawMessage                                          | expectedMessage
	${"Feed the robot butler  \n\n\n# It is hungry.\n"} | ${"Feed the robot butler  \n\n\n# It is hungry."}
	${"\n\nFeed the robot butler\t"}                    | ${"\n\nFeed the robot butler\t"}
	${"\n"}                                             | ${""}
	${" \n\n"}                                          | ${" \n"}
`(
	"when the cleanup mode is verbatim and the raw message is $rawMessage",
	(props: { rawMessage: string; expectedMessage: string }) => {
		const options: GitCommitMessageCleanupOptions = {
			mode: "verbatim",
			commentString: "#",
			isEdited: false,
		}
		const actualMessage = cleanupGitCommitMessage(props.rawMessage, options)

		it("preserves the message as is, except for the final line break", () => {
			expect(actualMessage).toBe(props.expectedMessage)
		})
	},
)

describe("when the cleanup mode is verbatim and the raw message is empty", () => {
	const options: GitCommitMessageCleanupOptions = {
		mode: "verbatim",
		commentString: "#",
		isEdited: false,
	}
	const actualMessage = cleanupGitCommitMessage("", options)

	it("indicates that Git will abort the commit", () => {
		expect(actualMessage).toBeNull()
	})
})

describe("when the edited message ends with a scissors line without a line break", () => {
	const options: GitCommitMessageCleanupOptions = {
		mode: "scissors",
		commentString: "#",
		isEdited: true,
	}
	const rawMessage = `Cut the red wire\n${SCISSORS_LINE}`
	const actualMessage = cleanupGitCommitMessage(rawMessage, options)

	it("does not truncate the message, as Git only recognises a scissors line followed by a line break", () => {
		expect(actualMessage).toBe(rawMessage)
	})
})
