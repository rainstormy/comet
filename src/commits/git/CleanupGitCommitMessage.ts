/**
 * The value of the `commit.cleanup` setting in the Git configuration.
 *
 * @see https://git-scm.com/docs/git-commit#Documentation/git-commit.txt---cleanupmode
 */
export type GitCommitMessageCleanupMode =
	| "default"
	| "scissors"
	| "strip"
	| "verbatim"
	| "whitespace"

export type GitCommitMessageCleanupOptions = {
	/**
	 * The value of `commit.cleanup` in the Git configuration.
	 */
	mode: GitCommitMessageCleanupMode

	/**
	 * The value of `core.commentString` or `core.commentChar` in the Git configuration, e.g. `#`.
	 */
	commentString: string

	/**
	 * Whether Git has opened an editor to let the user edit the commit message.
	 */
	isEdited: boolean
}

/**
 * Transforms the content of a commit message file in the same way as Git does before creating the commit.
 *
 * The `commit-msg` Git hook receives the message before Git cleans it up.
 * Without this transformation, Comet would check comment lines, trailing whitespace, and verbose diffs that never end up in the commit.
 *
 * @returns The cleaned-up commit message without a trailing line break, or `null` if Git will abort the commit due to an empty commit message (unless the user passes `--allow-empty-message`).
 */
export function cleanupGitCommitMessage(
	rawMessage: string,
	options: GitCommitMessageCleanupOptions,
): string | null {
	const mode = getEffectiveCleanupMode(options)

	// Git truncates the message at the scissors line when the editor shows the diff of `git commit --verbose` or when the mode is `scissors`.
	// The hook cannot see the `--verbose` flag, so assume that a scissors line in an edited message always marks the end of the message.
	const truncatedMessage = options.isEdited
		? truncateAtScissorsLine(rawMessage, options.commentString)
		: rawMessage

	if (mode === "verbatim") {
		// Git only considers a message empty in `verbatim` mode if it has no characters at all.
		return truncatedMessage !== "" ? trimFinalLineBreak(truncatedMessage) : null
	}

	const commentString = mode === "strip" ? options.commentString : null
	const lines = stripSpace(truncatedMessage.split("\n"), commentString)

	return lines.length > 0 ? lines.join("\n") : null
}

function getEffectiveCleanupMode(
	options: GitCommitMessageCleanupOptions,
): Exclude<GitCommitMessageCleanupMode, "default"> {
	switch (options.mode) {
		case "default": {
			return options.isEdited ? "strip" : "whitespace"
		}
		case "scissors": {
			return options.isEdited ? "scissors" : "whitespace"
		}
		case "strip":
		case "verbatim":
		case "whitespace": {
			return options.mode
		}
	}
}

const SCISSORS = "------------------------ >8 ------------------------"

function truncateAtScissorsLine(message: string, commentString: string): string {
	const lines = message.split("\n")

	// Git only recognises a scissors line that is followed by a line break.
	const scissorsLineIndex = lines.findIndex(
		(line, index) => line === `${commentString} ${SCISSORS}` && index < lines.length - 1,
	)

	if (scissorsLineIndex === -1) {
		return message
	}

	// Preserve the line break before the scissors line like Git does.
	return lines
		.slice(0, scissorsLineIndex)
		.map((line) => `${line}\n`)
		.join("")
}

/**
 * Mimics `git stripspace` (with `--strip-comments` if a comment string is provided):
 *
 * - Removes trailing whitespace from every line.
 * - Collapses consecutive blank lines into a single blank line.
 * - Removes blank lines at the beginning and at the end.
 * - Removes lines that start with the comment string (not counted as blank lines).
 */
function stripSpace(lines: Array<string>, commentString: string | null): Array<string> {
	const strippedLines: Array<string> = []
	let hasPendingBlankLine = false

	for (const line of lines) {
		if (commentString !== null && line.startsWith(commentString)) {
			continue
		}

		const trimmedLine = trimTrailingWhitespace(line)

		if (trimmedLine === "") {
			hasPendingBlankLine = true
			continue
		}

		if (hasPendingBlankLine && strippedLines.length > 0) {
			strippedLines.push("")
		}

		strippedLines.push(trimmedLine)
		hasPendingBlankLine = false
	}

	return strippedLines
}

function trimTrailingWhitespace(line: string): string {
	// Git trims spaces, tabs, and carriage returns, but not vertical tabs and form feeds.
	return line.replace(/[\t\r ]+$/u, "")
}

function trimFinalLineBreak(message: string): string {
	return message.endsWith("\n") ? message.slice(0, -"\n".length) : message
}
