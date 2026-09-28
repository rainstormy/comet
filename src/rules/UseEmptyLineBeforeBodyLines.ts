import type { Commits } from "#commits/Commit.ts"
import { isNotToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { bodyLineConcern } from "#rules/concerns/BodyLineConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"

/**
 * TODO: Rejects commit messages whose body is not separated from the subject line by exactly one empty line.
 *
 * TODO: ## Rationale
 *
 * A predictable subject-and-body boundary keeps commit messages readable in Git clients
 * and makes the first paragraph easy to identify.
 *
 * A stable subject-and-body boundary lets users read a short summary without losing the detailed explanation below it.
 * It also helps Git clients and automation identify the subject and the first paragraph consistently.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * When a body is present, put exactly one blank line between it and the subject, and remove any extra blank lines there. To edit an existing commit, start an interactive rebase and mark it `reword`:
 *
 * ```shell
 * git rebase --interactive <commit-sha>~1
 * ```
 *
 * TODO: ### IntelliJ IDEA
 *
 * In the Git tool window, right-click the commit and select `Edit Commit Message...`. Add exactly one blank line between the subject and body.
 *
 * TODO: ## Remarks
 *
 * - Commits without body text, including commits with only blank lines, are accepted.
 * - The separator line may contain whitespace, but it must be the only empty line before body text.
 *
 * ## Options
 *
 * This rule has no configurable options.
 *
 * ```json
 * {
 *   "rules": {
 *     "useEmptyLineBeforeBodyLines": {
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
 * Install a quieter keyboard
 * The old one sounded like hail.
 * ```
 *
 * ```
 * Clean the tiny dashboard
 *
 *
 * The widgets sparkle.
 * ```
 *
 * ### Accepted
 *
 * ```
 * Teach the changelog to whisper
 *
 * The noisy bits moved to the release notes.
 * ```
 *
 * ```
 * Record the quiet acknowledgement
 * ```
 */
export function* useEmptyLineBeforeBodyLines(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "useEmptyLineBeforeBodyLines"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	for (const commit of commits) {
		for (const [lineNumber, bodyLine] of commit.bodyLines.entries()) {
			if (bodyLine.some(isNotToken("whitespace"))) {
				if (lineNumber === 0) {
					yield bodyLineConcern(rule, commit.sha, { line: 0, range: [0, 1] })
				}
				if (lineNumber > 1) {
					yield bodyLineConcern(rule, commit.sha, { line: lineNumber - 1, range: [0, 1] })
				}
				break
			}
		}
	}
}
