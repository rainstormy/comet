import type { Commits } from "#commits/Commit.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { userIdentityConcern } from "#rules/concerns/UserIdentityConcern.ts"
import { regexUnion } from "#utilities/Regexes.ts"

/**
 * Rejects commits where the author's name does not match one of the configured regex patterns.
 *
 * ## Rationale
 *
 * Restricting names to a trusted pattern keeps the commit history attributable and standardised for tooling and automated reports.
 * For example, by requiring authors to use a specific name format.
 *
 * It can prevent web-based edits and other kinds of automation from committing to the repository.
 * It can also prevent exposing private usernames in a public repository when the author has misconfigured Git.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * Set your Git name to one matching the configured patterns:
 *
 * ```shell
 * git config user.name "Author Name"
 * ```
 *
 * To repair an existing commit, start an interactive rebase from its parent and mark it `edit`:
 *
 * ```shell
 * git rebase --interactive <commit-sha>
 * ```
 *
 * When the rebase pauses, amend the author name while preserving the intended author email, then continue:
 *
 * ```shell
 * git commit --amend --author="Author Name <author@example.com>" --no-edit
 * git rebase --continue
 * ```
 *
 * ## Options
 *
 * - `patterns` (array of strings): Regular expression patterns to accept. If empty, every name is accepted. Default value: `[]`.
 *
 * ```json
 * {
 *   "rules": {
 *     "useAuthorNamePatterns": {
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
 * With `patterns: ["\\p{Lu}.*\\s.+"]`:
 *
 * The first line in each block shows the author's name; the remaining line is the commit subject.
 *
 * ### Rejected
 *
 * ```
 * author name: santa claus
 * Release the robot butler
 * ```
 *
 * ```
 * author name: Jeanne
 * Teach the release notes to sing
 * ```
 *
 * ### Accepted
 *
 * ```
 * author name: The Little Mermaid
 * Add the missing release note
 * ```
 *
 * ```
 * author name: Jeanne d'Arc
 * Fix the broken release note
 * ```
 *
 * ## Related rules
 *
 * - [useAuthorEmailPatterns](./UseAuthorEmailPatterns.md)
 * - [useCommitterEmailPatterns](./UseCommitterEmailPatterns.md)
 * - [useCommitterNamePatterns](./UseCommitterNamePatterns.md)
 */
export function* useAuthorNamePatterns(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "useAuthorNamePatterns"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	const patterns = configuration.options.patterns

	if (patterns.length === 0) {
		return
	}

	const regex = new RegExp(`^${regexUnion(patterns)}$`, "u")
	const field = { field: "author:name" } as const

	for (const commit of commits) {
		if (!regex.test(commit.authorName)) {
			yield userIdentityConcern(rule, commit.sha, field)
		}
	}
}
