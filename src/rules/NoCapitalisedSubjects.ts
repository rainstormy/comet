import type { Commits } from "#commits/Commit.ts"
import { isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectConcern } from "#rules/concerns/SubjectConcern.ts"
import { startsWithUppercaseLetter } from "#utilities/Strings.ts"

/**
 * Rejects subjects that start with an uppercase letter.
 *
 * ## Rationale
 *
 * The subject is the first line of the commit message.
 * It is what readers see most often when scanning the commit history.
 *
 * Consistent capitalisation is predictable and makes the commit history easier to read.
 *
 * Some projects prefer a lowercase style, particularly with [Conventional Commits](https://www.conventionalcommits.org).
 *
 * ## How to fix
 *
 * Change the first proper word in the subject to lowercase.
 *
 * ### Command-line interface (CLI)
 *
 * 1. Rebase interactively from (the parent of) the commit SHA, for instance:
 *
 *    ```shell
 *    git rebase --interactive '7e0ff1ce^'
 *    ```
 *
 * 2. Set the commit to `reword`, then save and close the editor to proceed:
 *
 *    ```
 *    reword 7e0ff1ce Welcome to my convenience store
 *    ```
 *
 * 3. In the commit message editor, change the first proper word in the subject (i.e. the first line) to lowercase, preserving any issue links and squash markers (e.g. `fixup!`) as is.
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
 *    Change the first proper word in the subject (i.e. the first line) to lowercase, preserving any issue links and squash markers (e.g. `fixup!`) as is.
 *
 * 2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.
 *
 * ## Remarks
 *
 * The following kinds of commits are always accepted:
 *
 * - Merge commits.
 * - Revert commits, e.g. `Revert "..."`.
 *
 * It disregards the following kinds of tokens before the first word:
 *
 * - Conventional Commits prefixes, e.g. `feat:` and `fix(api)!:`.
 * - Inline code phrases (enclosed in backticks).
 * - Issue links, e.g. `#7` and `NEOWISE-2020`.
 * - Squash markers, e.g. `fixup!` and `squash!`.
 *
 * `noCapitalisedSubjects` and [`useCapitalisedSubjects`](./UseCapitalisedSubjects.md) are mutually exclusive.
 *
 * ## Options
 *
 * This rule has no configurable options.
 *
 * ```json
 * {
 *   "rules": {
 *     "noCapitalisedSubjects": {
 *       "level": "error",
 *       "options": {}
 *     }
 *   }
 * }
 * ```
 *
 * ## Examples
 *
 * ### Rejected ⛔️
 *
 * ```
 * Fix this confusing plate of spaghetti
 * ```
 *
 * ```
 * amend! Solve the problem
 * ```
 *
 * ```
 * GH-12 Organise the bookshelf
 * ```
 *
 * ```
 * WIP
 * ```
 *
 * ### Accepted ✅
 *
 * ```
 * refactor the taxi module
 * ```
 *
 * ```
 * fixup! release the robot butler
 * ```
 *
 * ```
 * 99 reasons to upgrade the framework
 * ```
 *
 * ```
 * feat: add offline export queues
 * ```
 *
 * ```
 * Revert "release the robot butler"
 * ```
 *
 * ## Related rules
 *
 * - [`useCapitalisedSubjects`](./UseCapitalisedSubjects.md)
 */
export function* noCapitalisedSubjects(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "noCapitalisedSubjects"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	for (const commit of commits) {
		if (commit.isMergeCommit || commit.subject.some(isToken("revert"))) {
			continue
		}

		const firstToken = commit.subject.find(isToken("hyperlink", "punctuation", "word"))

		if (
			firstToken &&
			firstToken.type !== "hyperlink" &&
			startsWithUppercaseLetter(firstToken.value)
		) {
			const rangeStart = firstToken.range[0]
			yield subjectConcern(rule, commit.sha, { range: [rangeStart, rangeStart + 1] })
		}
	}
}
