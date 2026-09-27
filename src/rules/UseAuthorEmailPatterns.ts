import type { Commits } from "#commits/Commit.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { userIdentityConcern } from "#rules/concerns/UserIdentityConcern.ts"
import { regexUnion } from "#utilities/Regexes.ts"

/**
 * Rejects commits where the author's email address does not match one of the configured regex patterns.
 *
 * ## Rationale
 *
 * Restricting email addresses to a trusted pattern keeps the commit history attributable and standardised for tooling and automated reports.
 * For example, by requiring authors to use a specific email address format or domain.
 *
 * It can prevent web-based edits and other kinds of automation from committing to the repository.
 * It can also prevent exposing private email addresses in a public repository when the author has misconfigured Git.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * Update your Git email address to match one of the configured patterns, for example:
 *
 * ```shell
 * git config user.email 'name@example.com'
 * ```
 *
 *
 * To repair an existing commit, start an interactive rebase from its parent and mark it `edit`:
 *
 * ```shell
 * git rebase --interactive <commit-sha>
 * ```
 *
 * When the rebase pauses, amend the author email while preserving the intended author name, then continue:
 *
 * ```shell
 * git commit --amend --reset-author --no-edit
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
 *     "useAuthorEmailPatterns": {
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
 * The first line in each block shows the author's email; the remaining line is the commit subject.
 *
 * ### Rejected
 *
 * ```
 * author email: bunny@theeastercompany.com
 * Release the robot butler
 * ```
 *
 * ```
 * author email: claus@santasworkshop.com
 * Teach the release notes to sing
 * ```
 *
 * ### Accepted
 *
 * ```
 * author email: 87654321+littlemermaid@users.noreply.github.com
 * Add the missing release note
 * ```
 *
 * ## Related rules
 *
 * - [useAuthorNamePatterns](./UseAuthorNamePatterns.md)
 * - [useCommitterEmailPatterns](./UseCommitterEmailPatterns.md)
 * - [useCommitterNamePatterns](./UseCommitterNamePatterns.md)
 */
export function* useAuthorEmailPatterns(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "useAuthorEmailPatterns"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	const patterns = configuration.options.patterns

	if (patterns.length === 0) {
		return
	}

	const regex = new RegExp(`^${regexUnion(patterns)}$`, "u")
	const field = { field: "author:email" } as const

	for (const commit of commits) {
		if (!regex.test(commit.authorEmail)) {
			yield userIdentityConcern(rule, commit.sha, field)
		}
	}
}
