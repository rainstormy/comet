import type { Commits } from "#commits/Commit.ts"
import { isNotToken, isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"
import type { CharacterRange } from "#types/CharacterRange.ts"

const ALLOWED_PUNCTUATION_REGEX =
	/(?:\(.+\)|\[.+\]|\{.+\}|<.+>|'.+'|".+"|`.+`|«.+»|».+«|\d+[%"+!])$/u
const TRAILING_EMOJI_SHORTCODE_REGEX = /:\w+:$/u

/**
 * Verifies that subject lines do not end with unexpected punctuation.
 *
 * ## Rationale
 *
 * A consistent subject-line ending makes the commit history easier to scan
 * and applies the same convention across Git clients.
 *
 * ## Remarks
 *
 * - Revert commits are skipped.
 * - Issue links at the end of a subject line are ignored when checking punctuation.
 * - Closing brackets, paired quotes, and symbols associated with numbers (e.g. `100%`) are allowed.
 * - Only subject lines are checked; punctuation in body lines is left alone.
 *
 * ## Examples
 *
 * ### Rejected
 *
 * ```
 * Make the program act like a clown.
 * Apply strawberry jam to make the code sweeter~
 * Is the coffee ready?
 * Hide a cheerful easter egg :joy:
 * ```
 *
 * ### Accepted
 *
 * ```
 * Release the robot butler
 * Rewire the pantry (after lunch) #42
 * Increase the tax to 100%
 * Revert "Release the robot butler!"
 * ```
 */
export function* noUnexpectedPunctuation(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "noUnexpectedPunctuation"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	for (const commit of commits) {
		if (commit.subjectLine.some(isToken("revert"))) {
			continue
		}

		const lastTokenIndex = commit.subjectLine.findLastIndex(isNotToken("issuelink", "whitespace"))
		const lastToken = commit.subjectLine[lastTokenIndex]

		if (lastToken?.type === "punctuation") {
			const formattedSubjectLine = commit.subjectLine
				.slice(0, lastTokenIndex + 1)
				.map((token) => token.value)
				.join("")

			if (!ALLOWED_PUNCTUATION_REGEX.test(formattedSubjectLine)) {
				const emojiShortcodeMatch = TRAILING_EMOJI_SHORTCODE_REGEX.exec(formattedSubjectLine)
				const concernRange: CharacterRange =
					emojiShortcodeMatch === null
						? lastToken.range
						: [emojiShortcodeMatch.index, emojiShortcodeMatch.index + emojiShortcodeMatch[0].length]

				yield subjectLineConcern(rule, commit.sha, { range: concernRange })
			}
		}
	}
}
