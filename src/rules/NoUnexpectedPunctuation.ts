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
 * Rejects subject lines with unexpected trailing punctuation.
 *
 * ## Rationale
 *
 * The subject line acts as the commit title; hence, it does not need a full stop at the end.
 *
 * Consistent punctuation is predictable and makes the commit history easier to read.
 *
 * ## How to fix
 *
 * Delete the offending punctuation characters in the subject line.
 *
 * ### Command-line interface (CLI)
 *
 * 1. Rebase interactively from (the parent of) the commit SHA, for example:
 *
 *    ```shell
 *    git rebase --interactive '7e0ff1ce^'
 *    ```
 *
 * 2. Set the commit to `reword`, then save and close the editor to proceed:
 *
 *    ```
 *    reword 7e0ff1ce Welcome to my convenience store.
 *    ```
 *
 * 3. In the commit message editor, delete the offending punctuation characters in the subject line (i.e. the first line).
 *    Then save and close the editor to complete the rebase.
 *
 * 4. Force-push the rewritten branch to the remote repository:
 *
 *    ```shell
 *    git push --force-with-lease
 *    ```
 *
 * ### JetBrains IDEs (IntelliJ IDEA, WebStorm, etc.)
 *
 * 1. In the Git tool window, right-click the commit and select **Edit Commit Message...**.
 *    Delete the offending punctuation characters in the subject line (i.e. the first line).
 *
 * 2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.
 *
 * ## Remarks
 *
 * Revert commits, e.g. `Revert "..."`, are always accepted.
 *
 * The following kinds of punctuation are allowed:
 *
 * - Closing brackets and quotation marks when they enclose text, e.g. `(after lunch)` and `"strategy"`.
 * - Numeric suffixes `%`, `"`, `+`, and `!`, e.g. `100%` and `5!`.
 * - Built-in list of names, e.g. `C#` and `Vite+`.
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
 * ## Examples
 *
 * ### Rejected
 *
 * ```
 * Make the program act like a clown.
 * ```
 *
 * ```
 * Polish the moon laser! #42
 * ```
 *
 * ```
 * Hide a cheerful easter egg :joy:
 * ```
 *
 * ```
 * Queue the parcel] GL-20
 * ```
 *
 * ### Accepted
 *
 * ```
 * Rewire the pantry (after lunch)
 * ```
 *
 * ```
 * Set tax rates to 100%
 * ```
 *
 * ```
 * Prepare the dashboard in C++
 * ```
 *
 * ```
 * Tame the release robot
 *
 * The webhook now announces success!
 * ```
 *
 * ```
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
