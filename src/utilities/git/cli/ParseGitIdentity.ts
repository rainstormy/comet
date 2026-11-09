/**
 * Parses a Git identity on the form `name <email> timestamp timezone` into a pair of name and email.
 *
 * This is the format of the `author` and `committer` fields in `git log --format=raw`
 * and of the output of `git var GIT_AUTHOR_IDENT` and `git var GIT_COMMITTER_IDENT`.
 */
export function parseGitIdentity(line: string | undefined): [name: string, email: string] {
	if (line === undefined) {
		return ["", ""]
	}

	const timezoneStartIndex = line.lastIndexOf(" ")
	const timestampStartIndex = line.lastIndexOf(" ", timezoneStartIndex - 1)

	if (timestampStartIndex === -1) {
		return ["", ""]
	}

	const userLine = line.slice(0, timestampStartIndex)

	const emailStartIndex = userLine.lastIndexOf("<")
	const emailEndIndex = userLine.lastIndexOf(">")

	if (emailStartIndex !== -1 && emailEndIndex > emailStartIndex) {
		const name = userLine.slice(0, emailStartIndex)
		const email = userLine.slice(emailStartIndex + "<".length, emailEndIndex)
		return [emailStartIndex > 0 ? trimTrailingSpace(name) : "", email]
	}

	return [trimTrailingSpace(userLine), ""]
}

function trimTrailingSpace(value: string): string {
	return value.endsWith(" ") ? value.slice(0, -" ".length) : value
}
