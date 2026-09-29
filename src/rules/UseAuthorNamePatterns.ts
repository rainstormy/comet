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
 * ### Command-line interface (CLI)
 *
 * 1. Change your Git name to match one of the configured patterns, for example:
 *
 *    ```shell
 *    git config --global user.name 'Santa Claus'
 *    ```
 *
 *    (omit the `--global` flag to change the name in the current repository only)
 *
 * 2. Rebase interactively from (the parent of) the commit SHA:
 *
 *    ```shell
 *    git rebase --interactive '7e0ff1ce^'
 *    ```
 *
 * 3. Set the commit to `edit`:
 *
 *    ```
 *    edit 7e0ff1ce Welcome to my convenience store
 *    ```
 *
 * 4. When the rebase pauses, reset the author by amending the commit:
 *
 *    ```shell
 *    git commit --amend --reset-author --no-edit
 *    ```
 *
 * 5. Complete the rebase:
 *
 *    ```shell
 *    git rebase --continue
 *    ```
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
