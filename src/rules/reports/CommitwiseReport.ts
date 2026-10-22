import { bold, gray as grey, red } from "ansis"
import type { Commit, Commits } from "#commits/Commit.ts"
import { type Tokens, tokenRangeEnd } from "#commits/Token.ts"
import type { Configuration } from "#configurations/GetConfiguration.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { BodyLineConcern } from "#rules/concerns/BodyLineConcern.ts"
import type { CommitConcern } from "#rules/concerns/CommitConcern.ts"
import type { Concern, Concerns } from "#rules/concerns/Concern.ts"
import type { SubjectConcern } from "#rules/concerns/SubjectConcern.ts"
import type { UserIdentityConcern } from "#rules/concerns/UserIdentityConcern.ts"
import { normaliseTrailerKey } from "#rules/NoRestrictedTrailers.ts"
import { type RuleLinkStyle, ruleLink } from "#rules/reports/RuleLink.ts"
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
	ruleLinkStyle: RuleLinkStyle = "hyperlink",
): string {
	if (concerns.length === 0) {
		return ""
	}

	const formattedConcerns = concerns
		.map((concern) =>
			formatConcern(concern, getConcernedCommit(concern, commits), configuration, ruleLinkStyle),
		)
		.join("\n\n")

	const concernedCommitCount = new Set(concerns.map(({ commitSha }) => commitSha)).size
	const totalConcerns = `Found ${formatCount(concerns.length, "concern", "concerns")} in ${formatCount(concernedCommitCount, "commit", "commits")}.`

	return `${formattedConcerns}\n\n${totalConcerns}`
}

function getConcernedCommit(concern: Concern, commits: Commits): Commit {
	return requireNotNullish(
		commits.find(({ sha }) => sha === concern.commitSha),
		() => `Concerned commit ${concern.commitSha} not found`,
	)
}

function formatConcern(
	concern: Concern,
	commit: Commit,
	configuration: Configuration,
	ruleLinkStyle: RuleLinkStyle,
): string {
	switch (concern.location) {
		case "body-line": {
			return formatBodyLineConcern(concern, commit, configuration, ruleLinkStyle)
		}
		case "commit": {
			return formatCommitConcern(concern, commit, configuration, ruleLinkStyle)
		}
		case "subject": {
			return formatSubjectConcern(concern, commit, configuration, ruleLinkStyle)
		}
		case "user-identity": {
			return formatUserIdentityConcern(concern, commit, configuration, ruleLinkStyle)
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
	ruleLinkStyle: RuleLinkStyle,
): string {
	const message = commitRuleMessage(concern, configuration)

	const shortSha = getShortSha(commit)
	const subject = getSubject(commit)

	const offset = SHORT_SHA_LENGTH - RANGE_PREFIX.length + 1

	const rangeLine = indentString(red`${RANGE_PREFIX + "─".repeat(subject.length)}`, offset)
	const messageLines = getMessageLines(message, offset, ruleLinkStyle)

	return `${shortSha} ${subject}\n${rangeLine}\n${messageLines}`
}

function formatSubjectConcern(
	concern: SubjectConcern,
	commit: Commit,
	configuration: Configuration,
	ruleLinkStyle: RuleLinkStyle,
): string {
	const message = subjectRuleMessage(concern, commit, configuration)

	const [rangeStart, rangeEnd] = concern.range
	const length = rangeEnd - rangeStart

	const offset = SHORT_SHA_LENGTH + rangeStart + 1
	const longHalfLength = Math.trunc(length / 2)
	const shortHalfLength = length - longHalfLength - 1

	const violationLength = message.violation.length + MESSAGE_SUFFIX.length
	const anchoredRight = violationLength < offset + longHalfLength

	const shortSha = getShortSha(commit)
	const subject = formatTokens(commit.subject)

	const rangeLine = indentString(formatRange(concern.range, anchoredRight), offset)
	const messageLines = anchoredRight
		? getMessageLines(message, offset + longHalfLength - violationLength, ruleLinkStyle, true)
		: getMessageLines(message, offset + shortHalfLength, ruleLinkStyle)

	return `${shortSha} ${subject}\n${rangeLine}\n${messageLines}`
}

function formatBodyLineConcern(
	concern: BodyLineConcern,
	commit: Commit,
	configuration: Configuration,
	ruleLinkStyle: RuleLinkStyle,
): string {
	const message = bodyLineRuleMessage(concern, configuration)

	const [rangeStart, rangeEnd] = concern.range
	const length = rangeEnd - rangeStart

	const gutterWidth = Math.ceil(Math.log10(concern.lineNumber + 2)) + 3
	const concernGutter = indentString(grey`· `, gutterWidth)

	const longHalfLength = Math.trunc(length / 2)
	const shortHalfLength = length - longHalfLength - 1

	const violationLength = message.violation.length + MESSAGE_SUFFIX.length
	const rightMessageOffset = rangeStart + longHalfLength - violationLength
	const anchoredRight = rightMessageOffset >= 0

	const shortSha = getShortSha(commit)
	const subject = formatTokens(commit.subject)

	const precedingBodyLine = getBodyLine(commit.bodyLines, concern.lineNumber - 1, gutterWidth)
	const blockHeadLines = `${indentString(grey`╭──`, gutterWidth)}\n${precedingBodyLine}`

	const concernedBodyLine = getBodyLine(commit.bodyLines, concern.lineNumber, gutterWidth, true)

	const rangeLine = `${concernGutter}${indentString(
		formatRange(concern.range, anchoredRight),
		rangeStart,
	)}`

	const messageLines = anchoredRight
		? getMessageLines(message, rightMessageOffset, ruleLinkStyle, true)
		: getMessageLines(message, rangeStart + shortHalfLength, ruleLinkStyle)

	const succeedingBodyLine = getBodyLine(commit.bodyLines, concern.lineNumber + 1, gutterWidth)
	const blockTailLines = `${succeedingBodyLine}${indentString(grey`╰──`, gutterWidth)}`

	return `${shortSha} ${subject}\n${blockHeadLines}${concernedBodyLine}${rangeLine}\n${prefixStringLines(succeedingBodyLine === "" ? messageLines.trimEnd() : messageLines, concernGutter)}\n${blockTailLines}`
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
	ruleLinkStyle: RuleLinkStyle,
): string {
	const message = userIdentityRuleMessage(concern, configuration)

	const shortSha = getShortSha(commit)
	const subject = getSubject(commit)
	const identityKey = getIdentityKey(concern)
	const identityValue = getIdentityValue(concern, commit)

	const identityOffset = identityKey.length - 1
	const rangeLine = indentString(
		red`${RANGE_PREFIX + "─".repeat(identityValue.length)}`,
		identityOffset,
	)
	const messageLines = getMessageLines(message, identityOffset, ruleLinkStyle)

	return `${shortSha} ${subject}\n${grey`${identityKey}`} ${identityValue}\n${rangeLine}\n${messageLines}`
}

function getShortSha(commit: Commit): string {
	return grey`${commit.sha.slice(0, SHORT_SHA_LENGTH)}`
}

function getSubject(commit: Commit): string {
	return formatTokens(commit.subject)
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

function getMessageLines(
	message: RuleMessage,
	offset: number,
	ruleLinkStyle: RuleLinkStyle,
	anchoredRight = false,
): string {
	const sidenotes = `${ruleLink(message.rule, ruleLinkStyle)}${message.sidenote ? `\n\n${message.sidenote}` : ""}`

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

function subjectRuleMessage(
	concern: SubjectConcern,
	commit: Commit,
	configuration: Configuration,
): RuleMessage {
	const rule = concern.rule

	function ruleMessage(violation: string, sidenote = ""): RuleMessage {
		return { rule, violation, sidenote }
	}

	switch (rule) {
		case "noBlankSubjects": {
			return ruleMessage("Include a descriptive subject.")
		}
		case "noExcessiveWhitespace": {
			const violation =
				concern.range[0] === 0
					? "Delete leading whitespace."
					: concern.range[1] === tokenRangeEnd(commit.subject)
						? "Delete trailing whitespace."
						: "Delete excessive whitespace."
			return ruleMessage(violation)
		}
		case "noRevertReverts": {
			return ruleMessage("Cherry-pick the original commit instead of reverting it over.")
		}
		case "noSingleWordSubjects": {
			return ruleMessage("Use at least two words in the subject.")
		}
		case "noSquashMarkers": {
			return ruleMessage("Rebase interactively to combine this commit with its target commit.")
		}
		case "noUnexpectedPunctuation": {
			return ruleMessage("Remove trailing punctuation.")
		}
		case "useCapitalisedSubjects": {
			return ruleMessage("Change the first letter to uppercase.")
		}
		case "useConciseSubjects": {
			const options = getRuleOptions(rule, configuration)
			const characterPhrase = formatCount(options.maxLength, "character", "characters or less")
			return ruleMessage(`Shorten the subject to ${characterPhrase}.`)
		}
		case "useImperativeSubjects": {
			return ruleMessage("Start the subject with a verb in the imperative mood.")
		}
		case "useIssueLinks": {
			const options = getRuleOptions(rule, configuration)
			const instruction =
				options.position === "prefix"
					? "Start the subject with an issue link."
					: options.position === "suffix"
						? "End the subject with an issue link."
						: "Include an issue link in the subject."

			const prefixes = configuration.tokens.issueLinks.prefixes
			const wildcards = configuration.tokens.issueLinks.wildcards
			const examples = [...prefixes.map((prefix) => `${prefix}123`), ...wildcards]
			const examplePhrase = pluralise(examples.length, "Example")

			return ruleMessage(
				instruction,
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
			return ruleMessage("Delete excessive whitespace.")
		}
		case "noRestrictedTrailers": {
			const options = getRuleOptions(rule, configuration)
			return ruleMessage(
				"Delete disallowed trailers.",
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
		case "useEmptyLineBeforeBody": {
			return ruleMessage("Separate the subject and message body with one blank line.")
		}
		case "useLineWrapping": {
			const options = getRuleOptions(rule, configuration)
			const characterPhrase = formatCount(options.maxLength, "character", "characters or less")
			return ruleMessage(`Wrap message body lines at ${characterPhrase}.`)
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
			return ruleMessage(
				options.maxCommits > 1
					? `Split the branch or reduce it to ${options.maxCommits} commits or fewer.`
					: `Reduce the branch to 1 commit.`,
			)
		}
		case "noMergeCommits": {
			return ruleMessage("Rebase the branch and drop the merge commits.")
		}
		case "noRepeatedSubjects": {
			return ruleMessage("Use a unique subject.")
		}
		case "useSignedCommits": {
			return ruleMessage("Sign this commit cryptographically with your signing key.")
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
				"Use an author email address that matches an accepted pattern.",
				formatList("Accepted patterns:", options.patterns),
			)
		}
		case "useAuthorNamePatterns": {
			const options = getRuleOptions(rule, configuration)
			return ruleMessage(
				"Use an author name that matches an accepted pattern.",
				formatList("Accepted patterns:", options.patterns),
			)
		}
		case "useCommitterEmailPatterns": {
			const options = getRuleOptions(rule, configuration)
			return ruleMessage(
				"Use a committer email address that matches an accepted pattern.",
				formatList("Accepted patterns:", options.patterns),
			)
		}
		case "useCommitterNamePatterns": {
			const options = getRuleOptions(rule, configuration)
			return ruleMessage(
				"Use a committer name that matches an accepted pattern.",
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
