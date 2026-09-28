import type { Commits } from "#commits/Commit.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { userIdentityConcern } from "#rules/concerns/UserIdentityConcern.ts"
import { regexUnion } from "#utilities/Regexes.ts"

/**
 * Rejects commits where the committer's email address does not match one of the configured regex patterns.
 *
 * ## Rationale
 *
 * Restricting email addresses to a trusted pattern keeps the commit history attributable and standardised for tooling and automated reports.
 * For example, by requiring committeres to use a specific email address format or domain.
 *
 * It can prevent web-based edits and other kinds of automation from committing to the repository.
 * It can also prevent exposing private email addresses in a public repository when the committer has misconfigured Git.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * Set your Git email to an address matching one of the configured patterns:
 *
 * ```shell
 * git config user.email "name@example.com"
 * ```
 *
 * To repair an existing commit, start an interactive rebase from its parent and mark it `edit`:
 *
 * ```shell
 * git rebase --interactive <commit-sha>~1
 * ```
 *
 * When the rebase pauses, amend the commit so Git records the configured committer address, then continue:
 *
 * ```shell
 * git commit --amend --no-edit
 * git rebase --continue
 * ```
 *
 * ## Options
 *
 * - `patterns` (array of strings): Regular expression patterns to accept. If empty, every email address is accepted. Default value: `[]`.
 *
 * ```json
 * {
 *   "rules": {
 *     "useCommitterEmailPatterns": {
 *       "level": "error",
 *       "options": {
 *         "patterns": []
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * TODO: ## Examples
 *
 * With `patterns: ["\\d+\\+.+@users\\.noreply\\.github\\.com"]`:
 *
 * The first line in each block shows the committer's email; the remaining line is the commit subject.
 *
 * ### Rejected
 *
 * ```
 * committer email: bunny@theeastercompany.com
 * Release the robot butler
 * ```
 *
 * ```
 * committer email: claus@santasworkshop.com
 * Teach the release notes to sing
 * ```
 *
 * ### Accepted
 *
 * ```
 * committer email: 12345678+santaclaus@users.noreply.github.com
 * Add the missing release note
 * ```
 *
 * ## Related rules
 *
 * - [useAuthorEmailPatterns](./UseAuthorEmailPatterns.md)
 * - [useAuthorNamePatterns](./UseAuthorNamePatterns.md)
 * - [useCommitterNamePatterns](./UseCommitterNamePatterns.md)
 */
export function* useCommitterEmailPatterns(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "useCommitterEmailPatterns"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	const patterns = configuration.options.patterns

	if (patterns.length === 0) {
		return
	}

	const regex = new RegExp(`^${regexUnion(patterns)}$`, "u")
	const field = { field: "committer:email" } as const

	for (const commit of commits) {
		if (!regex.test(commit.committerEmail)) {
			yield userIdentityConcern(rule, commit.sha, field)
		}
	}
}
