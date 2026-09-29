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
 * ### Command-line interface (CLI)
 *
 * 1. Change your Git email address to match one of the configured patterns, for example:
 *
 *    ```shell
 *    git config --global user.email 'claus@santasworkshop.com'
 *    ```
 *
 *    (omit the `--global` flag to change the email address in the current repository only)
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
