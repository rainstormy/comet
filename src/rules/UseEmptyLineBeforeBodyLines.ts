import type { Commits } from "#commits/Commit.ts"
import { isNotToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { bodyLineConcern } from "#rules/concerns/BodyLineConcern.ts"
import type { Concern } from "#rules/concerns/Concern.ts"

/**
 * Rejects commit messages whose body is not separated from the subject line by exactly one empty line.
 *
 * A predictable subject-and-body boundary keeps commit messages readable in Git clients
 * and makes the first paragraph easy to identify.
 *
 * ## Remarks
 *
 * - Commits without a body and commits with only a blank body are accepted.
 * - A body immediately after the subject and a body preceded by multiple empty lines are rejected.
 * - The separator may contain whitespace, as long as there is only one empty line before the body.
 *
 * ## Examples
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
