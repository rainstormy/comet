---
name: new-rule
description: Add, modify, or document rules in Comet. Use when working on rule validation logic, options, concerns, reports, tests, or JSDoc documentation, including reviews of these changes.
---

# New rule

This document describes how to add or modify a rule in Comet, which involves declaring configurable rule options, implementing validation logic to raise concerns, outputting formatted concerns in reports, and documenting the rule for end users.

It uses `noTypos` as an example of a new rule to implement.

## Step 1: Clarify intent

Define the name and purpose of the new rule. All rule names must start with `no` or `use`.

Read `src/configurations/RulesetConfiguration.ts` and decide from the existing rule names if the intended behaviour has already been implemented or if the desired name already exists.
Read any existing rule files that may sound similar to the intended behaviour before making the final call.
Note that every rule is focused to a narrow scope. For example, `useAuthorEmailPatterns`, `useAuthorNamePatterns`, and `useCommitterEmailPatterns` are separate rules.
Let me know if the new rule is too similar to an existing rule and prompt for new instructions to clarify if you should modify an existing rule instead of implementing a new one.

Identify the unit(s) under validation: subject line, body lines, user identity (author or committer), or the commit as a whole.

## Step 2: Scaffold function signature

Create a new file in `src/rules/` named after the new rule, for example `NoTypos.ts` or `UseCapitalisedBodyLines.ts` (recall that filenames must be in PascalCase).
Export a named generator function that yields concerns, for example:

```ts
import type { Commits } from "#commits/Commit.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { Concern } from "#rules/concerns/Concern.ts"

/**
 * Rejects typos in commit messages.
 */
export function* noTypos(commits: Commits, ruleset: RulesetConfiguration): Generator<Concern> {
  const rule: RuleKey = "noTypos"
  const configuration = ruleset[rule]

  if (configuration.level === "off") {
    return
  }

  throw new Error("The `noTypos` rule has not been implemented yet")
}
```

The function must always accept exactly two arguments: `commits` and `ruleset`.
`ruleset` is the complete `RulesetConfiguration`; select the configuration of the specific rule with its rule key (same as the rule name).
If `configuration.level` is `off`, the rule is disabled and must return immediately without yielding any concerns.
`configuration.options` is always an object, including for rules without configurable options in which case it is an empty object.

The `rule` const with the rule key reduces code duplication when yielding concerns.

Insert the rule key or function into the existing alphabetically ordered lists found in:

- `RULESET_CONFIGURATION_SCHEMA` in `src/configurations/RulesetConfiguration.ts`.
- `DEFAULT_RULESET_CONFIGURATION`  in `src/configurations/defaults/DefaultRulesetConfiguration.ts`.
- `emptyRulesetConfiguration` (always set to `off`) and `fakeRulesetConfiguration` (only if it needs special handling) in `src/configurations/GetConfiguration.fakes.ts`.
- `mapCommitsToConcerns` in `src/rules/concerns/Concern.ts`.
- Relevant concerns in `src/rules/concerns/`, depending on the scope and intent of the rule.

## Step 3: Specify rule options

`RULESET_CONFIGURATION_SCHEMA` is a Valibot schema that defines the shape and constraints of every rule configuration.
`DEFAULT_RULESET_CONFIGURATION` provides default values. It must always be possible to enable a rule without specifying its options, in which case it falls back to using the default values.

For a rule without configurable options, add `EMPTY_RULE_CONFIGURATION` to the Valibot schema and an empty object as default value, for example:

```ts
export const RULESET_CONFIGURATION_SCHEMA = v.strictObject({
  // ...
  noTypos: EMPTY_RULE_CONFIGURATION,
})
```

```ts
export const DEFAULT_RULESET_CONFIGURATION: RulesetConfiguration = {
  // ...
  noTypos: { level: "error", options: {} },
}
```

For a rule with configurable options, wrap the configuration object in `ruleConfiguration`, for example:

```ts
export const RULESET_CONFIGURATION_SCHEMA = v.strictObject({
  // ...
  noTypos: ruleConfiguration({
    whitelist: v.array(v.string()),
  }),
})
```

```ts
export const DEFAULT_RULESET_CONFIGURATION: RulesetConfiguration = {
  // ...
  noTypos: { level: "error", options: { whitelist: [] } },
}
```

Use Valibot schemas for simple JSON-serialisable values such as `v.number()`, `v.string()`, and `v.array()`.
Use schemas such as `v.picklist()` and `v.pipe()` when an option has a finite set of allowed values or additional constraints.
Prefer reusable helper functions from `src/types/` and `src/utilities/` when they express a common constraint, such as `naturalNumber()` or `nonEmptyArray()`.

JSON configuration files reuse `RULESET_CONFIGURATION_SCHEMA` in `JSON_CONFIGURATION_DTO`, for example:

```json
{
  "rules": {
    "noTypos": {
      "level": "error",
      "options": { "whitelist": ["chatify", "rainstormed"] }
    }
  }
}
```

Sanitise the validated input and prepare in a way that makes it easier to work with, for example:

```ts
export function* noTypos(commits: Commits, ruleset: RulesetConfiguration): Generator<Concern> {
  const rule: RuleKey = "noTypos"
  const configuration = ruleset[rule]

  if (configuration.level === "off") {
    return
  }

  const whitelist = new Set(
    configuration.options.whitelist
      .map((word) => word.trim().toLowerCase())
      .filter(isNotEmptyString),
  )
}
```

Common sanitisation scenarios:

- `number` -> constrain with Valibot schemas like `v.integer()`, `v.maxValue()`, `naturalNumber()` (reusable helper function), etc.
- `string` -> `.trim().toLowerCase()` when normalising for comparisons
- `Array` -> `.filter()` to remove invalid or redundant items (e.g. with `isNotNullish` and `isNotEmptyString`), and/or `new Set()` to remove duplicates

Set reasonably good default values in `DEFAULT_RULESET_CONFIGURATION` that are applicable in most real-world scenarios and which will not decrease the quality of existing commit workflows among the Comet end users.
Prompt me if you need my input.

`DEFAULT_RULESET_CONFIGURATION` always enables all rules by default.
If the rule should be disabled by default, override its level in the respective entrypoint(s):

- For the Comet CLI entrypoint, update `DEFAULT_COMMAND_LINE_CONFIGURATION` in `src/configurations/defaults/DefaultCommandLineConfiguration.ts`.
- For the Comet GitHub Actions entrypoint, update `DEFAULT_GITHUB_ACTIONS_CONFIGURATION` in `src/configurations/defaults/DefaultGithubActionsConfiguration.ts`.

Update `fakeRulesetConfiguration` with realistic rule options when a test needs them.

Look at the existing default values and rule configurations for inspiration. Usually, array options like `whitelist` should be empty by default.

Due to their nature, some rules like `noRestrictedTrailers` and `useAuthorEmailPatterns` depend entirely on their configuration in order to know when to raise concerns.
They use empty arrays in their default values; hence, they never raise any concerns if they are enabled with default values. Such rules are usually disabled by default in all entrypoints to improve performance.

Note that other rules like `useImperativeSubjects` (and `noTypos` in our example) may also use empty arrays in their default values, but they are not entirely dependent on their configuration to raise concerns.
They are still able to raise concerns even if the configured array is empty. They should not necessarily be disabled by default.

## Step 4: Outline unit tests

Create a new `.tests.ts` file next to the rule file, for example `NoTypos.tests.ts` or `UseCapitalisedBodyLines.tests.ts`.

Start by setting up the rule configuration for the test. For example, for a rule without options:

```ts
const rule: RuleKey = "noTypos"

const disabled = emptyRulesetConfiguration()
const enabled = emptyRulesetConfiguration({ [rule]: { level: "error" } })

const fakeCommit = fakeCommitFactory()
```

For a rule with options, it has multiple `enabled` scenarios, for example:

```ts
const rule: RuleKey = "noTypos"

const disabled = emptyRulesetConfiguration()
const enabled = emptyRulesetConfiguration({ [rule]: { level: "error" } })
const enabledWhitelist = emptyRulesetConfiguration({
	[rule]: {
		level: "error",
		options: { whitelist: ["chatify", "rainstormed"] },
	},
})

const fakeCommit = fakeCommitFactory()
```

Use `describe.each` in Vitest to cover many test cases easily.
A test suite for a rule has at least 4 top-level `describe.each` blocks to cover these scenarios:

- when the commit violates the rule (e.g. when the subject line contains one or multiple typos)
  - and the rule is enabled -> it raises a concern
  - and the rule is disabled -> it does not raise a concern
- when the commit does not violate the rule
  - and the rule is enabled -> it does not raise a concern
  - and the rule is disabled -> it does not raise a concern
- when verifying a set of multiple commits and some commits violate the rule
  - and the rule is enabled -> it raises a concern for each violating commit
  - and the rule is disabled -> it does not raise any concerns
- when verifying a set of multiple commits and all commits are good
  - and the rule is enabled -> it does not raise any concerns
  - and the rule is disabled -> it does not raise any concerns

Assert that the rule raises concerns at the expected character ranges.

For example, a simple top-level block could look like this for a rule that covers subject lines:

```ts
describe.each`
	subjectLine                | expectedRange
	${"initz"}                 | ${[0, 5]}
	${"I'm flabbbergastered"}  | ${[4, 20]}
	${"Give me eternal welth"} | ${[16, 21]}
	${"#1 repared again"}      | ${[3, 10]}
	${"squash!  my baad"}      | ${[12, 16]}
`(
  "when the subject line of $subjectLine contains a typo",
  (props: { subjectLine: string; expectedRange: CharacterRange }) => {
    const commit = fakeCommit({ message: props.subjectLine })

    describe("and the rule is enabled", () => {
      const actualConcerns = mapCommitsToConcerns([commit], enabled)

      it("raises a concern about the misspelled word", () => {
        expect(actualConcerns).toEqual<Concerns>([
          subjectLineConcern(rule, commit.sha, { range: props.expectedRange }),
        ])
      })
    })

    describe("and the rule is disabled", () => {
      const actualConcerns = mapCommitsToConcerns([commit], disabled)

      it("does not raise any concerns", () => {
        expect(actualConcerns).toEqual<Concerns>([])
      })
    })
  },
)
```

Additional blocks are needed to cover complex rules with options (e.g. `enabled` and `enabledWhitelist`) or multiple locations for concerns (e.g. subject line + body lines).
Be sure to cover many different tokens, for example (but not exhaustive):

- empty or blank subject lines
- single-word subject lines
- leading and trailing whitespace
- capitalised and lowercase leading words
- verbs in imperative mood and in past tense
- mix of letters, numbers, and punctuation
- squash tokens (e.g. `fixup!`) and revert tokens (e.g. `Revert "`)
- semver tokens (e.g. `1.2.0-beta.1`)
- issuelink tokens
- inline code phrases and fenced code blocks
- trailers

Prefer creative, realistic, lowkey funny commit messages and author names over repetitive placeholder data.
They should resemble a large variety of real-world commit messages to improve the general test coverage, for example:

- `Release the robot butler`
- `made the console less dramatic`
- `Revert "fix this confusing plate of spaghetti"`
- `Compare the list of items to the objects downloaded from the server`
- `squash! Paint the eggs with suspicious enthusiasm`
- `#42 Consolidate `BadgeFactory` with `BadgeService` and count to ten`
- `1 2 3 beep! boop!`

Read some existing test files for inspiration.

## Step 5: Implement validation logic

The rule function must validate each commit. Use a for..of loop to iterate over the commits.
For each commit, determine if and where it violates the rule and yield one appropriately located concern per violation. Do not yield a concern for conforming input.
Skip commits that should be ignored by the rule.

For example:

```ts
export function* noTypos(commits: Commits, ruleset: RulesetConfiguration): Generator<Concern> {
  const rule: RuleKey = "noTypos"
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

    const misspelledWords = commit.subjectLine
      .filter(isToken("word"))
      .filter((word) => !whitelist.has(word.value.toLowerCase()))
      .filter(isMisspelledWord)

    for (const word of misspelledWords) {
      yield subjectLineConcern(rule, commit.sha, { range: word.range })
    }
  }
}
```

If the rule concerns the subject line or the body lines, consult `src/commits/Token.ts` for a list of all tokens and associated utility functions.

If you need to add or modify commit message tokens, follow the instructions in `.agents/skills/new-token-type/SKILL.md` and implement those changes in a separate commit.

Iterate over the rule implementation and its unit tests in a TDD-like manner until it satisfies all requirements as clarified in Step 1, for example:

```shell
vpr test 'src/rules/NoTypos.tests.ts'
```

## Step 6: Write documentation

The JSDoc comment immediately above the exported generator function is the source of the user-facing rule documentation.
The `vpr build` task generates the corresponding Markdown file in `docs/rules/`, for example `docs/rules/NoTypos.md`.
Always make documentation changes in the `.ts` file that contains the rule implementation and JSDoc comment.

Read the documentation of a similar existing rule for guidance, for example `src/rules/UseImperativeSubjects.ts` for a message rule or `src/rules/UseAuthorEmailPatterns.ts` for an identity rule.

Always begin with 'Rejects' and state the intent and scope of the rule as clarified in Step 1, including whether it validates subject lines, body lines, identities, commits, or whole branches.

Write the following sections in this order:

1. `## Rationale`: Explain why the rule enforces a policy that actually matters and how users benefit from it.
2. `## How to fix`: State the correction in one sentence and provide actionable steps under `### Command-line interface (CLI)` with pure Git commands that the user can run in the terminal.
   Include `### JetBrains IDEs (IntelliJ IDEA, WebStorm, etc.)` when there is a relevant workflow specific to the JetBrains IDE family, usually involving its built-in Git client.
   Choose the operation that fixes the rule violation, for example rewording the message, updating the identity, signing the commit, rebasing interactively to squash commits, cherry-picking, or splitting a branch.
3. `## Remarks` (when needed): Describe precise behaviour, exceptions, ignored commits and/or tokens, normalisation, and limitations relevant to the end users.
4. `## Options`: For rules with options, use an unordered list to document each option's name, type or allowed set of values (in parentheses), meaning, relevant empty-value behaviour, and default value on the form 'Default value: `<value>`'.
   For rules without options, state 'This rule has no configurable options'.
   Always include a valid JSON configuration example with `rules`, the rule key (e.g. `noTypos`), `level` (set to `error`), and `options` using the defaults from `DEFAULT_RULESET_CONFIGURATION`.
5. `## Examples`: Group examples under `### Rejected` and `### Accepted`, up to 5 examples in each group, illustrating the main violation, the correction, and useful exceptions.
   State any rule or token configuration that the examples depend on, especially when it differs from the defaults.
6. `## Related rules` (when applicable): Link to relevant rule documentation with relative Markdown links such as `[useLineWrapping](./UseLineWrapping.md)`.

For example:

````ts
/**
 * Rejects typos in commit messages.
 *
 * ## Rationale
 *
 * Correct spelling keeps commit history understandable.
 *
 * ## How to fix
 *
 * Correct the misspelled words in the subject line and the message body.
 *
 * ### Command-line interface (CLI)
 *
 * 1. Rebase interactively from (the parent of) the commit SHA, for example:
 *
 *    ```shell
 *    git rebase --interactive '7e0ff1ce^'
 *    ```
 *
 * 2. Set the commit to `reword`, then save and close the editor to proceed:
 *
 *    ```
 *    reword 7e0ff1ce ...
 *    ```
 *
 * 3. In the commit message editor, correct the misspelled words.
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
 *    Correct the misspelled words.
 *
 * 2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.
 *
 * ## Remarks
 *
 * The following kinds of commits are always accepted:
 *
 * - Revert commits, e.g. `Revert "..."`.
 * - Commits with dependency versions in the subject line, e.g. `Bump Vite to 2.4.0-beta.1` and `Pin the Node.js image to 4af617c`.
 *
 * It disregards inline code phrases (enclosed in backticks) and fenced code blocks.
 *
 * ## Options
 *
 * - `whitelist` (array of case-insensitive strings): Custom words to accept. Default value: `[]`.
 *
 * ```json
 * {
 *   "rules": {
 *     "noTypos": {
 *       "level": "error",
 *       "options": { "whitelist": [] }
 *     }
 *   }
 * }
 * ```
 *
 * ## Examples
 *
 * ### Rejected
 *
 * ```
 * Fix the parsr typo
 * ```
 *
 * ### Accepted
 *
 * ```
 * Fix the parser typo
 * ```
 */
export function* noTypos(commits: Commits, ruleset: RulesetConfiguration): Generator<Concern> { /* ... */ }
````

Always verify that the documented behaviour, options, and example outcomes agree with the implementation and tests.
Acceptance is specific to this rule, even if another rule would reject the example.

## Step 7: Implement reports

Add at least 2 test cases to `src/rules/reports/CommitwiseReport.tests.ts` to cover the new rule.
Note that test cases appear in alphabetical order by rule names.

The test cases also serve as visual documentation of how concerns will appear to the end users.
Prompt me if you want feedback on the message that appear when the new rule is violated.

Implement the message in `src/rules/reports/CommitwiseReport.ts`.

Run the mandatory project-wide checks before finishing:

```shell
vpr fmt
vpr check
vpr test
```
