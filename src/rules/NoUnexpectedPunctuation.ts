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
 * TODO: Rejects subject lines ending with unexpected punctuation.
 *
 * TODO: ## Rationale
 *
 * A consistent subject-line ending makes the commit history easier to scan
 * and applies the same convention across Git clients.
 *
 * A consistent ending lets users scan a history without mentally filtering mixed sentence styles.
 * The rule preserves punctuation that carries meaning, so users can keep useful issue references, paired delimiters, and numeric symbols.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * Remove unsupported punctuation at the end of the subject. To edit an existing commit, start an interactive rebase and mark it `reword`:
 *
 * ```shell
 * git rebase --interactive <commit-sha>
 * ```
 *
 * TODO: ### IntelliJ IDEA
 *
 * In the Git tool window, right-click the commit and select `Edit Commit Message...`. Remove unsupported punctuation at the end of its subject.
 *
 * TODO: ## Remarks
 *
 * - Revert commits are skipped.
 * - Issue links at the end of a subject line are ignored when checking punctuation.
 * - Paired delimiters, paired quotes, and symbols such as a percentage sign after a number are allowed.
 * - Only subject lines are checked; punctuation in body lines is left alone.
 *
 * ## Options
 *
 * This rule has no configurable options.
 *
 * ```json
 * {
 *   "rules": {
 *     "noUnexpectedPunctuation": {
 *       "level": "error",
 *       "options": {}
 *     }
 *   }
 * }
 * ```
 *
 * TODO: ## Examples
 *
 * ### Rejected
 *
 * ```
 * Make the program act like a clown.
 * ```
 *
 * ```
 * Hide a cheerful easter egg :joy:
 * ```
 *
 * ### Accepted
 *
 * ```
 * Release the robot butler
 * ```
 *
 * ```
 * Rewire the pantry (after lunch) #42
 * ```
 *
 * ```
 * Update the report
 *
 * The body may end with punctuation!
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
