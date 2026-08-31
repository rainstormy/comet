import { type TokenType, type Tokens, codeblock, tokenOf } from "#commits/Token.ts"
import type { TokenConfiguration } from "#commits/TokenConfiguration.ts"
import { regexEnum, regexUnion } from "#utilities/Regexes.ts"

/**
 * Matches an inline code phrase enclosed in a pair of backticks (e.g. Markdown inline code) spanning all characters in-between, including whitespace.
 */
// language=jsunicoderegexp
const CODE = String.raw`(?<code>${"`"}[^${"`"}]*${"`"})`

/**
 * Matches a hyperlink of one of these protocol schemes: https://, mailto:, or ssh://, excluding sentence punctuation at the end.
 */
// language=jsunicoderegexp
const HYPERLINK = String.raw`(?<hyperlink>(?:https://|mailto:|ssh://)\S*[^\s.,!?"')\]}])`

/**
 * Matches a single punctuation or symbol character, thus avoiding greedily matching inline code phrases and issue link prefixes adjacent to other punctuation.
 * The tokeniser consolidates consecutive punctuation tokens into a single token.
 */
// language=jsunicoderegexp
const PUNCTUATION = String.raw`(?<punctuation>[\p{P}\p{S}])`

/**
 * Matches a revert marker literal, following by optional whitespace and a double quote character.
 * The tokeniser ensures that revert tokens only appear at the start of the subject line.
 */
// language=jsunicoderegexp
const REVERT = String.raw`(?<revert>(?i:revert))(?=\s*")`

/**
 * Matches a dependency version string in one of the following formats:
 *
 * - SHA code of 7 or more lowercase hexadecimal characters (e.g. a Docker image digest or a Git commit).
 * - Semantic version number (SemVer): `<major.minor.patch[-prerelease][+buildinfo]>` with an optional `v` prefix.
 *
 * It must be surrounded by whitespace or appear at the end of the subject line.
 *
 * @see https://semver.org
 */
// language=jsunicoderegexp
const SEMVER = String.raw`(?<=\s)(?<semver>[0-9a-f]{7,}|v?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(?:\+[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*)?)(?=[\s,]|"|$)`

/**
 * Matches a squash marker literal with one or more leading or trailing exclamation marks, optionally preceded by whitespace.
 * The tokeniser ensures that squash tokens only appear at the start of the subject line.
 */
// language=jsunicoderegexp
const SQUASH = String.raw`(?<squash>(?i:amend!+|fixup!+|squash!+|!+amend\b|!+fixup\b|!+squash\b))`

/**
 * Matches the key of a colon-separated key-value pair, optionally preceded and/or separated by whitespace, in one of the following formats:
 *
 * - Git-style trailers (e.g. `Co-authored-by: Ada <ada@example.com>`).
 * - Conventional Commits breaking change (e.g. `BREAKING CHANGE: Removed the old API`).
 *
 * There is at most one trailer key per line.
 *
 * @see https://git-scm.com/docs/git-interpret-trailers
 * @see https://www.conventionalcommits.org
 */
// language=jsunicoderegexp
const TRAILERKEY = String.raw`(?<=^\s*)(?<trailerkey>(?i:[a-z0-9-]+|breaking change))(?=\s*:)`

// language=jsunicoderegexp
const WHITESPACE = String.raw`(?<whitespace>\s+)`

/**
 * Matches one of these predefined names: .NET, ASP.NET, C++, C#, F#, F*, Next.js, Node.js, VB.NET, VDM++, Vite+.
 */
// language=jsunicoderegexp
const PREDEFINED_NAME = String.raw`(?<![\p{L}\p{N}])(?:\.NET|ASP\.NET|C\+\+|C#|F#|F\*|Next\.js|Node\.js|VB\.NET|VDM\+\+|Vite\+)(?:[-']+[\p{L}\p{N}]+)*[-']*(?![\p{L}\p{N}])`

/**
 * Matches predefined names or alphanumeric words, optionally preceded or followed and/or separated by one or more hyphens or apostrophes (e.g. `quick-freeze`, `O'Neil's`, `mother-in-law's`, `jack-o'-lantern`). Apostrophes enclosing a word on both sides are left as punctuation.
 *
 * @see PREDEFINED_NAME
 */
// language=jsunicoderegexp
const WORD = String.raw`(?<word>${PREDEFINED_NAME}|(?<=')[-']*[\p{L}\p{N}]+(?:[-']+[\p{L}\p{N}]+)*(?=')|(?!'[-']*[\p{L}\p{N}]+(?:[-']+[\p{L}\p{N}]+)*[-']*')[-']*[\p{L}\p{N}]+(?:[-']+[\p{L}\p{N}]+)*[-']*)`

const TRAILERKEY_REGEX = new RegExp(TRAILERKEY, "u")
const TRAILERLINE_REGEX = new RegExp(
	regexUnion([HYPERLINK, TRAILERKEY, WORD, WHITESPACE, PUNCTUATION], {
		preserveCapturingGroups: true,
	}),
	"gu",
)

export type TokeniserPatterns = {
	issueLink: string
}

export function issueLinkPattern(configuration: TokenConfiguration): string {
	const prefixes = regexEnum(configuration.issueLinks.prefixes)
	const wildcards = regexEnum(configuration.issueLinks.wildcards)

	if (prefixes === "" && wildcards === "") {
		return ""
	}

	// Assume all issue links to have a numeric key after the string prefix.
	// They can be surrounded by whitespace, enclosed in brackets (bracket pair consistency not enforced for simplicity), or followed by a colon.
	// language=jsregexp
	const numericIssueLinks = prefixes ? String.raw`[([{<]*(?:${prefixes})\d+[)\]}>]*:?` : ""

	// language=jsunicoderegexp
	return String.raw`(?<issuelink>${regexUnion([numericIssueLinks, wildcards])})`
}

export function tokeniseSubjectLine(crudeSubjectLine: string, patterns: TokeniserPatterns): Tokens {
	const prioritisedPatterns: Array<string> = [
		SQUASH,
		REVERT,
		CODE,
		HYPERLINK,
		SEMVER,
		patterns.issueLink,
		WORD,
		WHITESPACE,
		PUNCTUATION,
	]
	const regex = new RegExp(regexUnion(prioritisedPatterns, { preserveCapturingGroups: true }), "gu")

	return tokenise(crudeSubjectLine, regex)
}

export function tokeniseBodyLines(
	crudeBodyLines: Array<string>,
	patterns: TokeniserPatterns,
): Array<Tokens> {
	const prioritisedPatterns: Array<string> = [
		CODE,
		HYPERLINK,
		patterns.issueLink,
		WORD,
		WHITESPACE,
		PUNCTUATION,
	]
	const regex = new RegExp(regexUnion(prioritisedPatterns, { preserveCapturingGroups: true }), "gu")

	const firstTrailerLineNumber = getFirstTrailerLineNumber(crudeBodyLines)

	const lines: Array<Tokens> = []
	let currentFence: "```" | "````" | null = null

	for (const [lineNumber, line] of crudeBodyLines.entries()) {
		if (currentFence !== null) {
			lines.push([codeblock(line)])

			const isClosingFence = line === currentFence

			if (isClosingFence) {
				currentFence = null
			}
		} else if (line.startsWith("````")) {
			lines.push([codeblock(line)])
			currentFence = "````"
		} else if (line.startsWith("```")) {
			lines.push([codeblock(line)])
			currentFence = "```"
		} else {
			lines.push(tokenise(line, lineNumber < firstTrailerLineNumber ? regex : TRAILERLINE_REGEX))
		}
	}

	return lines
}

function getFirstTrailerLineNumber(crudeBodyLines: Array<string>): number {
	for (let i = crudeBodyLines.length - 1; i >= 0; i -= 1) {
		const line = crudeBodyLines[i] ?? ""

		if (line.trim() !== "" && !TRAILERKEY_REGEX.test(line)) {
			return i + 1
		}
	}

	return 0
}

function tokenise(rawText: string, regex: RegExp): Tokens {
	const segments = rawText.matchAll(regex)

	const tokens: Tokens = []

	// Some token types are only valid in certain contexts.
	// To keep things simple, the regex patterns match broadly and then the tokeniser keeps track of the context and corrects the token type accordingly.
	let revertEnabled = true
	let squashEnabled = true

	for (const segment of segments) {
		const groups = (segment.groups ?? {}) as Partial<Record<TokenType, string | undefined>>
		const group = Object.entries(groups).find(([, value]) => value !== undefined) ?? null

		if (group === null) {
			continue
		}

		const [tokenType, tokenValue] = group
		const type = tokenType as TokenType
		const value = tokenValue as string

		revertEnabled &&=
			type === "revert" ||
			type === "squash" ||
			type === "whitespace" ||
			(type === "punctuation" && value === '"' && tokens.length > 0)

		squashEnabled &&= type === "squash" || type === "whitespace"

		const lastToken = tokens.at(-1)

		if (type === "revert" && !revertEnabled) {
			tokens.push(tokenOf("word", value, segment.index))
		} else if (type === "squash" && !squashEnabled) {
			tokens.push(...splitSquashTokens(value, segment.index))
		} else if (type === "punctuation" && lastToken?.type === "punctuation") {
			// Append to the existing punctuation token.
			lastToken.value += value
			lastToken.range[1] += 1
		} else {
			tokens.push(tokenOf(type, value, segment.index))
		}
	}

	return tokens
}

function splitSquashTokens(value: string, index: number): Tokens {
	if (value.startsWith("!")) {
		const exclamationCount = value.lastIndexOf("!")
		const exclamationMarks = value.slice(0, exclamationCount + 1)

		return [
			tokenOf("punctuation", exclamationMarks, index),
			tokenOf("word", value.slice(exclamationCount + 1), index + exclamationCount + 1),
		]
	}

	const exclamationStart = value.indexOf("!")
	const exclamationMarks = value.slice(exclamationStart)

	return [
		tokenOf("word", value.slice(0, exclamationStart), index),
		tokenOf("punctuation", exclamationMarks, index + exclamationStart),
	]
}
