import type { Commits } from "#commits/Commit.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { userIdentityConcern } from "#rules/concerns/UserIdentityConcern.ts"
import { regexUnion } from "#utilities/Regexes.ts"

/**
 * Rejects commits where the committer's name does not match one of the configured regex patterns.
 *
 * ## Rationale
 *
 * Restricting names to a trusted pattern keeps the commit history attributable and standardised for tooling and automated reports.
 * For example, by requiring committers to use a specific name format.
 *
 * It can prevent web-based edits and other kinds of automation from committing to the repository.
 * It can also prevent exposing private usernames in a public repository when the committer has misconfigured Git.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * Set your Git name to one matching the configured patterns:
 *
 * ```shell
 * git config user.name "Comet Maintainer"
 * ```
 *
 * To repair an existing commit, start an interactive rebase from its parent and mark it `edit`:
 *
 * ```shell
 * git rebase --interactive <commit-sha>
 * ```
 *
 * When the rebase pauses, amend the commit so Git records the configured committer name, then continue:
 *
 * ```shell
 * git commit --amend --no-edit
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
 *     "useCommitterNamePatterns": {
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
 * The first line in each block shows the committer's name; the remaining line is the commit subject.
 *
 * ### Rejected
 *
 * ```
 * committer name: master splinter
 * Release the robot butler
 * ```
 *
 * ```
 * committer name: Leonardo
 * Teach the release notes to sing
 * ```
 *
 * ### Accepted
 *
 * ```
 * committer name: Leonardo da Vinci
 * Add the missing release note
 * ```
 *
 * ```
 * committer name: Master Splinter
 * Fix the broken release note
 * ```
 *
 * ## Related rules
 *
 * - [useAuthorEmailPatterns](./UseAuthorEmailPatterns.md)
 * - [useAuthorNamePatterns](./UseAuthorNamePatterns.md)
 * - [useCommitterEmailPatterns](./UseCommitterEmailPatterns.md)
 */
export function* useCommitterNamePatterns(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "useCommitterNamePatterns"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	const patterns = configuration.options.patterns

	if (patterns.length === 0) {
		return
	}

	const regex = new RegExp(`^${regexUnion(patterns)}$`, "u")
	const field = { field: "committer:name" } as const

	for (const commit of commits) {
		if (!regex.test(commit.committerName)) {
			yield userIdentityConcern(rule, commit.sha, field)
		}
	}
}
