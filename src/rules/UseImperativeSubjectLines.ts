import type { Commits } from "#commits/Commit.ts"
import { isNotToken, isToken } from "#commits/Token.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"
import { subjectLineConcern } from "#rules/concerns/SubjectLineConcern.ts"
import { isNotEmptyString } from "#utilities/Arrays.ts"
import { isImperativeVerb } from "#utilities/Verbs.ts"

/**
 * Rejects subject lines that do not start with a verb in the imperative mood.
 *
 * TODO: ## Rationale
 *
 * Imperative subjects describe the change directly and keep the commit history
 * consistent with instructions such as “Add”, “Fix”, and “Remove”.
 *
 * Imperative subjects tell users what a commit changes instead of describing a past event or current state.
 * This makes a history easier to scan and gives teams a consistent language for reviewing and maintaining changes.
 *
 * ## How to fix
 *
 * TODO: ### Command-line interface (CLI)
 *
 * Start the subject's first relevant word with an imperative verb such as `Add`, `Fix`, or `Remove`. If the project accepts another verb, add it to the `whitelist`. To change an existing subject, start an interactive rebase and mark it `reword`:
 *
 * ```shell
 * git rebase --interactive <commit-sha>~1
 * ```
 *
 * TODO: ### IntelliJ IDEA
 *
 * In the Git tool window, right-click the commit and select `Edit Commit Message...`. Change the first relevant word to an imperative verb accepted by the project.
 *
 * TODO: ## Remarks
 *
 * - Revert commits are ignored.
 * - Issue links and squash markers are skipped when locating the first relevant word.
 * - The first relevant token must be a word; punctuation, hyperlinks, inline code phrases (enclosed in `backticks`),
 *   and semantic-version tokens cannot serve as imperative verbs.
 * - Whitelisted words are matched case-insensitively after trimming whitespace.
 *
 * ## Options
 *
 * - `whitelist` (array of strings): Custom words to accept in addition to the built-in list of verbs. Default value: `[]`.
 *
 * ```json
 * {
 *   "rules": {
 *     "useImperativeSubjectLines": {
 *       "level": "error",
 *       "options": {
 *         "whitelist": []
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * TODO: ## Examples
 *
 * With `whitelist: ["chatify", "dockerise"]`:
 *
 * ### Rejected
 *
 * ```
 * Added a new feature
 * ```
 *
 * ```
 * The retry policy works
 * ```
 *
 * ### Accepted
 *
 * ```
 * Add a new feature
 * ```
 *
 * ```
 * GH-12 Organise the bookshelf
 * ```
 *
 * ```
 * Chatify the release notes
 * ```
 */
export function* useImperativeSubjectLines(
	commits: Commits,
	ruleset: RulesetConfiguration,
): Generator<Concern> {
	const rule: RuleKey = "useImperativeSubjectLines"
	const configuration = ruleset[rule]

	if (configuration.level === "off") {
		return
	}

	const whitelist = new Set(
		configuration.options.whitelist
			.map((word) => word.trim().toLowerCase())
			.filter(isNotEmptyString),
	)

	for (const commit of commits) {
		if (commit.subjectLine.some(isToken("revert"))) {
			continue
		}

		const firstToken =
			commit.subjectLine.find(isNotToken("issuelink", "squash", "whitespace")) ?? null

		if (firstToken !== null) {
			const canonicalFirstWord = firstToken.value.toLowerCase()

			if (
				firstToken.type !== "word" ||
				!(whitelist.has(canonicalFirstWord) || isImperativeVerb(canonicalFirstWord))
			) {
				yield subjectLineConcern(rule, commit.sha, { range: firstToken.range })
			}
		}
	}
}
