import { bold, gray as grey, red } from "ansis"
import type { Commit, Commits } from "#commits/Commit.ts"
import { type Tokens, tokenRangeEnd } from "#commits/Token.ts"
import type { Configuration } from "#configurations/GetConfiguration.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { BodyLineConcern } from "#rules/concerns/BodyLineConcern.ts"
import type { CommitConcern } from "#rules/concerns/CommitConcern.ts"
import type { Concern, Concerns } from "#rules/concerns/Concern.ts"
import type { SubjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"
import type { UserIdentityConcern } from "#rules/concerns/UserIdentityConcern.ts"
import { normaliseTrailerKey } from "#rules/NoRestrictedTrailers.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"
import { ALPHABETICALLY, isNotEmptyString } from "#utilities/Arrays.ts"
import { requireNotNullish } from "#utilities/Assertions.ts"
import {
	capitalise,
	formatCount,
	indentString,
	pluralise,
	prefixStringLines,
} from "#utilities/Strings.ts"

export function commitwiseReport(
	concerns: Concerns,
	commits: Commits,
	configuration: Configuration,
): string {
	return concerns
		.map((concern) => formatConcern(concern, getConcernedCommit(concern, commits), configuration))
		.join("\n\n")
}

function getConcernedCommit(concern: Concern, commits: Commits): Commit {
	return requireNotNullish(
		commits.find(({ sha }) => sha === concern.commitSha),
		() => `Concerned commit ${concern.commitSha} not found`,
	)
}

function formatConcern(concern: Concern, commit: Commit, configuration: Configuration): string {
	switch (concern.location) {
		case "body-line": {
			return formatBodyLineConcern(concern, commit, configuration)
		}
		case "commit": {
			return formatCommitConcern(concern, commit, configuration)
		}
		case "subject-line": {
			return formatSubjectLineConcern(concern, commit, configuration)
		}
		case "user-identity": {
			return formatUserIdentityConcern(concern, commit, configuration)
		}
	}
}

const SHORT_SHA_LENGTH = 7

const RANGE_PREFIX = "╭─"
const MESSAGE_PREFIX = "╰─"
const MESSAGE_SUFFIX = "─╯"

function formatCommitConcern(
	concern: CommitConcern,
	commit: Commit,
	configuration: Configuration,
): string {
	const message = commitRuleMessage(concern, configuration)

	const shortSha = getShortSha(commit)
	const subjectLine = getSubjectLine(commit)
	const rangeLine = indentString(
		red`${RANGE_PREFIX + "─".repeat(subjectLine.length)}`,
		SHORT_SHA_LENGTH - RANGE_PREFIX.length + 1,
	)
	const messageLines = getMessageLines(message, SHORT_SHA_LENGTH - MESSAGE_PREFIX.length + 1)

	return `${shortSha} ${subjectLine}\n${rangeLine}\n${messageLines}`
}

function formatSubjectLineConcern(
	concern: SubjectLineConcern,
	commit: Commit,
	configuration: Configuration,
): string {
	const message = subjectLineRuleMessage(concern, commit, configuration)

	const [rangeStart, rangeEnd] = concern.range
	const length = rangeEnd - rangeStart

	const offset = SHORT_SHA_LENGTH + rangeStart + 1
	const longHalfLength = Math.trunc(length / 2)
	const shortHalfLength = length - longHalfLength - 1

	const violationLength = message.violation.length + MESSAGE_SUFFIX.length
	const anchoredRight = violationLength < offset + longHalfLength

	const shortSha = getShortSha(commit)
	const subjectLine = formatTokens(commit.subjectLine)

	const rangeLine = indentString(formatRange(concern.range, anchoredRight), offset)
	const messageLines = anchoredRight
		? getMessageLines(message, offset + longHalfLength - violationLength, true)
		: getMessageLines(message, offset + shortHalfLength)

	return `${shortSha} ${subjectLine}\n${rangeLine}\n${messageLines}`
}

function formatBodyLineConcern(
	concern: BodyLineConcern,
	commit: Commit,
	configuration: Configuration,
): string {
	const message = bodyLineRuleMessage(concern, configuration)

	const [rangeStart, rangeEnd] = concern.range
	const length = rangeEnd - rangeStart

	const gutterWidth = Math.ceil(Math.log10(concern.line + 2)) + 3
	const concernGutter = indentString(grey`· `, gutterWidth)

	const offset = gutterWidth + 2 + rangeStart
	const longHalfLength = Math.trunc(length / 2)
	const shortHalfLength = length - longHalfLength - 1

	const violationLength = message.violation.length + MESSAGE_SUFFIX.length
	const anchoredRight = violationLength < offset + longHalfLength

	const shortSha = getShortSha(commit)
	const subjectLine = formatTokens(commit.subjectLine)

	const precedingBodyLine = getBodyLine(commit.bodyLines, concern.line - 1, gutterWidth)
	const blockHeadLines = `${indentString(grey`╭──`, gutterWidth)}\n${precedingBodyLine}`

	const concernedBodyLine = getBodyLine(commit.bodyLines, concern.line, gutterWidth, true)

	const rangeLine = `${concernGutter}${indentString(
		formatRange(concern.range, anchoredRight),
		rangeStart,
	)}`

	const messageLines = anchoredRight
		? getMessageLines(message, rangeStart + longHalfLength - violationLength, true)
		: getMessageLines(message, rangeStart + shortHalfLength)

	const succeedingBodyLine = getBodyLine(commit.bodyLines, concern.line + 1, gutterWidth)
	const blockTailLines = `${succeedingBodyLine}${indentString(grey`╰──`, gutterWidth)}`

	return `${shortSha} ${subjectLine}\n${blockHeadLines}${concernedBodyLine}${rangeLine}\n${prefixStringLines(succeedingBodyLine === "" ? messageLines.trimEnd() : messageLines, concernGutter)}\n${blockTailLines}`
}

function getBodyLine(
	bodyLines: Array<Tokens>,
	lineNumber: number,
	gutterWidth: number,
	isConcernedLine = false,
): string {
	const bodyLine = bodyLines[lineNumber] ?? null

	if (bodyLine === null) {
		return ""
	}

	const formattedLineNumber = (lineNumber + 1).toString().padStart(gutterWidth - 3, " ")

	const text = formatTokens(bodyLine)

	if (isConcernedLine) {
		return `${red`•`} ${grey`${bold`${formattedLineNumber}`} │`} ${text}\n`
	}

	return `  ${grey`${formattedLineNumber} │ ${text}`}\n`
}

function formatUserIdentityConcern(
	concern: UserIdentityConcern,
	commit: Commit,
	configuration: Configuration,
): string {
	const message = userIdentityRuleMessage(concern, configuration)

	const shortSha = getShortSha(commit)
	const subjectLine = getSubjectLine(commit)
	const identityKey = getIdentityKey(concern)
	const identityValue = getIdentityValue(concern, commit)

	const identityOffset = identityKey.length - 1
	const rangeLine = indentString(
		red`${RANGE_PREFIX + "─".repeat(identityValue.length)}`,
		identityOffset,
	)
	const messageLines = getMessageLines(message, identityOffset)

	return `${shortSha} ${subjectLine}\n${grey`${identityKey}`} ${identityValue}\n${rangeLine}\n${messageLines}`
}

function getShortSha(commit: Commit): string {
	return grey`${commit.sha.slice(0, SHORT_SHA_LENGTH)}`
}

function getSubjectLine(commit: Commit): string {
	return formatTokens(commit.subjectLine)
}

function getIdentityKey(concern: UserIdentityConcern): string {
	switch (concern.field) {
		case "author:email":
		case "author:name": {
			return `${MESSAGE_PREFIX} authored by:`
		}
		case "committer:email":
		case "committer:name": {
			return `${MESSAGE_PREFIX} committed by:`
		}
	}
}

function getIdentityValue(concern: UserIdentityConcern, commit: Commit): string {
	switch (concern.field) {
		case "author:email": {
			return commit.authorEmail
		}
		case "author:name": {
			return commit.authorName
		}
		case "committer:email": {
			return commit.committerEmail
		}
		case "committer:name": {
			return commit.committerName
		}
	}
}

function formatRange(range: CharacterRange, anchoredRight: boolean): string {
	const [start, end] = range
	const length = end - start

	if (length === 1) {
		return red`┬`
	}

	const longHalfLength = Math.trunc(length / 2)
	const shortHalfLength = length - longHalfLength - 1

	const longHalf = "─".repeat(longHalfLength)
	const shortHalf = "─".repeat(shortHalfLength)

	return anchoredRight ? red`${longHalf}┬${shortHalf}` : red`${shortHalf}┬${longHalf}`
	//                    anchored right ─╯                                ╰─ anchored left
}

function getMessageLines(message: RuleMessage, offset: number, anchoredRight = false): string {
	const sidenotes = `(${message.rule})${message.sidenote ? `\n\n${message.sidenote}` : ""}`

	return anchoredRight
		? indentString(red`${message.violation} ${MESSAGE_SUFFIX}\n${sidenotes}`, offset)
		: indentString(
				red`${MESSAGE_PREFIX} ${message.violation}\n${indentString(sidenotes, 3)}`,
				offset,
			)
}

type RuleMessage = {
	rule: RuleKey
	violation: string
	sidenote: string
}

function subjectLineRuleMessage(
	concern: SubjectLineConcern,
	commit: Commit,
	configuration: Configuration,
): RuleMessage {
	const rule = concern.rule

	function ruleMessage(violation: string, sidenote = ""): RuleMessage {
		return { rule, violation, sidenote }
	}

	switch (rule) {
		case "noBlankSubjectLines": {
			return ruleMessage("Subject lines must contain at least one non-whitespace character.")
		}
		case "noExcessiveWhitespace": {
			const positionPhrase =
				concern.range[0] === 0
					? "start with"
					: concern.range[1] === tokenRangeEnd(commit.subjectLine)
						? "end with"
						: "contain excessive"
			return ruleMessage(`Subject lines must not ${positionPhrase} whitespace.`)
		}
		case "noRevertRevertCommits": {
			return ruleMessage("Cherry-pick the original commit instead of reverting it over.")
		}
		case "noSingleWordSubjectLines": {
			return ruleMessage("Subject lines must contain at least two words.")
		}
		case "noSquashMarkers": {
			return ruleMessage("Combine squash commits with their ancestors.")
		}
		case "noUnexpectedPunctuation": {
			return ruleMessage("Subject lines must not end with punctuation.")
		}
		case "useCapitalisedSubjectLines": {
			return ruleMessage("The first letter in subject lines must be in uppercase.")
		}
		case "useConciseSubjectLines": {
			const options = getRuleOptions(rule, configuration)
			const characterPhrase = formatCount(options.maxLength, "character", "characters")
			return ruleMessage(`Subject lines must not exceed ${characterPhrase}.`)
		}
		case "useImperativeSubjectLines": {
			return ruleMessage("Subject lines must start with a verb in the imperative mood.")
		}
		case "useIssueLinks": {
			const options = getRuleOptions(rule, configuration)
			const positionPhrase =
				options.position === "prefix"
					? "start with"
					: options.position === "suffix"
						? "end with"
						: "include"

			const prefixes = configuration.tokens.issueLinks.prefixes
			const wildcards = configuration.tokens.issueLinks.wildcards
			const examples = [...prefixes.map((prefix) => `${prefix}123`), ...wildcards]
			const examplePhrase = pluralise(examples.length, "Example")

			return ruleMessage(
				`Subject lines must ${positionPhrase} an issue link.`,
				examples.length > 0 ? `${examplePhrase}: ${examples.join(", ")}` : "",
			)
		}
	}
}

function bodyLineRuleMessage(concern: BodyLineConcern, configuration: Configuration): RuleMessage {
	const rule = concern.rule

	function ruleMessage(violation: string, sidenote = ""): RuleMessage {
		return { rule, violation, sidenote }
	}

	switch (rule) {
		case "noExcessiveWhitespace": {
			return ruleMessage("Message bodies must not contain excessive whitespace.")
		}
		case "noRestrictedTrailers": {
			const options = getRuleOptions(rule, configuration)
			return ruleMessage(
				"Message bodies must not contain disallowed trailers.",
				formatList(
					"Disallowed trailers:",
					[...options.restrictedKeys]
						.map((key) => capitalise(normaliseTrailerKey(key)))
						.filter(isNotEmptyString)
						.toSorted(ALPHABETICALLY),
					"\n",
				),
			)
		}
		case "useEmptyLineBeforeBodyLines": {
			return ruleMessage(
				"Subject lines and message bodies must be separated by exactly one empty line.",
			)
		}
		case "useLineWrapping": {
			const options = getRuleOptions(rule, configuration)
			const characterPhrase = formatCount(options.maxLength, "character", "characters")
			return ruleMessage(`Message body lines must not exceed ${characterPhrase}.`)
		}
	}
}

function commitRuleMessage(concern: CommitConcern, configuration: Configuration): RuleMessage {
	const rule = concern.rule

	function ruleMessage(violation: string, sidenote = ""): RuleMessage {
		return { rule, violation, sidenote }
	}

	switch (rule) {
		case "noExcessiveCommitsPerBranch": {
			const options = getRuleOptions(rule, configuration)
			const commitPhrase = formatCount(options.maxCommits, "commit", "commits")
			return ruleMessage(`Branches must not contain more than ${commitPhrase}.`)
		}
		case "noMergeCommits": {
			return ruleMessage("Merge commits are not allowed.")
		}
		case "noRepeatedSubjectLines": {
			return ruleMessage("Commits must have unique subject lines within a branch.")
		}
		case "useSignedCommits": {
			return ruleMessage("Commits must be signed cryptographically with a signing key.")
		}
	}
}

function userIdentityRuleMessage(
	concern: UserIdentityConcern,
	configuration: Configuration,
): RuleMessage {
	const rule = concern.rule

	function ruleMessage(violation: string, sidenote = ""): RuleMessage {
		return { rule, violation, sidenote }
	}

	switch (rule) {
		case "useAuthorEmailPatterns": {
			const options = getRuleOptions(rule, configuration)
			return ruleMessage(
				"Email addresses of commit authors must match an accepted pattern.",
				formatList("Accepted patterns:", options.patterns),
			)
		}
		case "useAuthorNamePatterns": {
			const options = getRuleOptions(rule, configuration)
			return ruleMessage(
				"Names of commit authors must match an accepted pattern.",
				formatList("Accepted patterns:", options.patterns),
			)
		}
		case "useCommitterEmailPatterns": {
			const options = getRuleOptions(rule, configuration)
			return ruleMessage(
				"Email addresses of committers must match an accepted pattern.",
				formatList("Accepted patterns:", options.patterns),
			)
		}
		case "useCommitterNamePatterns": {
			const options = getRuleOptions(rule, configuration)
			return ruleMessage(
				"Names of committers must match an accepted pattern.",
				formatList("Accepted patterns:", options.patterns),
			)
		}
	}
}

function getRuleOptions<Key extends RuleKey>(
	rule: Key,
	configuration: Configuration,
): RulesetConfiguration[Key]["options"] {
	return configuration.rules[rule].options
}

function formatTokens(tokens: Tokens): string {
	return tokens.map((token) => token.value).join("")
}

function formatList(heading: string, items: Array<string>, trailer = ""): string {
	return items.length > 0
		? `${heading}${items.map((item) => `\n  ∙ ${item}`).join("")}${trailer}`
		: ""
}
