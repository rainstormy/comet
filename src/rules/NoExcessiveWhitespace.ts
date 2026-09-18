import type { Commits } from "#commits/Commit.ts"
import { type Tokens, isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { bodyLineConcern } from "#rules/concerns/BodyLineConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"

/**
 * Rejects subject lines with leading, trailing, or consecutive whitespace characters,
 * and body lines with consecutive whitespace characters.
 *
 * ## Rationale
 *
 * Consistent spacing is predictable and makes the commit history easier to read.
 *
 * ## Remarks
 *
 * - Body lines may contain leading and trailing whitespace (e.g. for indentation).
 * - It disregards whitespace in inline code phrases (enclosed in `backticks`) and fenced code blocks.
 *
 * ## Examples
 *
 * ### Rejected
 *
 * ```
 *  Recalibrate the espresso machine
 *
 * Keep  waffles in  sync
 * ```
 *
 * ```
 * Move sauce  left and bolts   right
 * ```
 *
 * ### Accepted
 *
 * ```
 * Release the robot butler
 * Explain the fallback
 *
 *   Indented text is allowed here.
 * ```
 *
 * ```
 * Format `two  spaces` exactly
 * ```
 */
export function* noExcessiveWhitespace(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "noExcessiveWhitespace"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	for (const commit of commits) {
		const firstToken = commit.subjectLine[0]
		const lastToken = commit.subjectLine.at(-1)

		if (firstToken?.type === "whitespace") {
			yield subjectLineConcern(rule, commit.sha, { range: firstToken.range })
		}

		for (const token of getConsecutiveWhitespaceTokens(commit.subjectLine)) {
			yield subjectLineConcern(rule, commit.sha, { range: token.range })
		}

		if (lastToken?.type === "whitespace") {
			yield subjectLineConcern(rule, commit.sha, { range: lastToken.range })
		}

		for (const [lineNumber, bodyLine] of commit.bodyLines.entries()) {
			for (const token of getConsecutiveWhitespaceTokens(bodyLine)) {
				yield bodyLineConcern(rule, commit.sha, { line: lineNumber, range: token.range })
			}
		}
	}
}

function getConsecutiveWhitespaceTokens(tokens: Tokens): Tokens<"whitespace"> {
	const firstToken = tokens[0]
	const lastToken = tokens.at(-1)

	return tokens
		.filter(isToken("whitespace"))
		.filter((token) => token.value.length > 1 && token !== firstToken && token !== lastToken)
}
