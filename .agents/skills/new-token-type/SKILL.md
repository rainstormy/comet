---
name: new-token-type
description: Add or modify commit message tokens in Comet. Use when defining a new kind of token, implementing or modifying tokenisation logic or corresponding tests, adjusting regular expressions of tokens, redefining commit message segments, changing token boundaries or priorities, or reviewing any such changes in this area.
---

# New token type in commit messages

This document describes how to add a new token type for commit messages in Comet, which involves declaring a token type and implementing tokenisation logic with regular expressions.

It uses `hyperlink` as an example of a new token type to implement.

## Step 1: Clarify intent

Define the name and purpose of the new token type. All token type names must be concise, single-word, lowercase nouns such as `word`, `whitespace`, `codeblock`, `issuelink`, or `trailerkey`.

Read `src/commits/Token.ts` and `src/commits/Tokenise.ts` and decide from the existing tokens if the intended kind of text segments is already represented adequately by an existing token type or if the desired name already exists.
Let me know if the new type overlaps substantially with an existing type, or if its name or boundaries are unclear, and ask whether an existing token should be modified instead.

Identify what kinds of text in subjects and/or body lines that the token should cover.

Keep a token on one physical line. A token never spans multiple lines.
Note that some tokens like `code` and `codeblock` are intentionally opaque and take precedence over most other types of tokens.
For example, a URL inside a fenced code block remains a part of the `codeblock` token rather than being extracted to a `hyperlink` token.
The majority of token types, however, have clear boundaries with the three most common types which they never overlap: `word`, `whitespace`, and `punctuation`.

Consider whether the new token type is only valid in a specific context such as the start of a subject (like `revert` and `squash` tokens) and how the new token type should take precedence over the existing tokens (to avoid overlapping tokens).

## Step 2: Scaffold the token type

Add the token type to the `TokenType` union in `src/commits/Token.ts`, preserving alphabetical order.
Add a factory function on top of `tokenOf` named after the new token type, for example:

```ts
export function hyperlink(value: string, rangeStart = 0): Token<"hyperlink"> {
	return tokenOf("hyperlink", value, rangeStart)
}
```

## Step 3: Scaffold the tokeniser

Declare a top-level `String.raw` const in `src/commits/Tokenise.ts` (in alphabetical order) with a regex pattern that contains exactly one named capturing group named exactly after the new token type, for example:

```ts
// language=jsunicoderegexp
const HYPERLINK = String.raw`(?<hyperlink>...)`
```

Update the prioritised pattern lists in `tokeniseSubject` and `tokeniseBodyLines` to include the new regex pattern (where applicable), taking into account the token type precedence clarified in Step 1.
If the new token type may appear in trailers in the message body, add it to the regex union in `TRAILERLINE_REGEX`.

If the regex pattern should be user-configurable (like `issuelink` tokens), add a new property to the `TokeniserPatterns` type instead of declaring a top-level const.
Then export a function that accepts a `TokenConfiguration` object and returns a `String.raw` regex pattern string.
For example:

```ts
export type TokeniserPatterns = {
  // ...
  hyperlink: string
  // ...
}

export function hyperlinkPattern(configuration: TokenConfiguration): string {
  if (configuration.hyperlinks === null) {
    return ""
  }

  const protocols = regexEnum(configuration.hyperlinks.protocols)

  // language=jsunicoderegexp
  return String.raw`(?<hyperlink>${regexUnion([protocols])})`
}
```

Expand `TokenConfiguration` in `src/commits/TokenConfiguration.ts` accordingly.
Keep token settings in `TokenConfiguration`; do not add them to the ruleset configuration.
Update the following places with sensible defaults:

- `tokens` in `src/configurations/defaults/DefaultCommandLineConfiguration.ts`
- `tokens` in `src/configurations/defaults/DefaultGithubActionsConfiguration.ts`
- `fakeTokenConfiguration` in `src/commits/TokenConfiguration.fakes.ts`

Call the function from `mapCrudeCommitToCommit` in `src/commits/Commit.ts`.

Note that trailers may not contain user-configurable tokens.

## Step 4: Outline unit tests

Use `describe.each` in Vitest to cover many test cases easily.
Add new top-level `describe.each` blocks in Vitest to `src/commits/Tokenise.tests.ts` to cover these scenarios of the new token type (when applicable):

- when the subject contains one or more tokens of the new type -> it extracts the new tokens
- when the subject does not contain any tokens of the new type -> it does not extract the new tokens
- when the message body contains one or more tokens of the new type -> it extracts the new tokens
- when the message body does not contain any tokens of the new type -> it does not extract the new tokens

Assert that `mapCrudeCommitToCommit` produces a commit with the expected tokens.

For example, two simple top-level blocks could look like this for a subject token type:

```ts
describe.each`
	subject                                                 | expectedTokens
	${"https://github.com"}                                 | ${[hyperlink("https://github.com")]}
	${"Update the footer link to https://home.example.com"} | ${[word("Update"), space(6), word("the", 7), space(10), word("footer", 11), space(17), word("link", 18), space(22), word("to", 23), space(25), hyperlink("https://home.example.com", 26)]}
	${"!squash links http://unsafe.org/index.html"}         | ${[squash("!squash"), space(7), word("links", 8), space(13), hyperlink("http://unsafe.org/index.html", 14)]}
`(
  "when the subject of $subject contains a hyperlink",
  (props: { subject: string; expectedTokens: Tokens }) => {
    const crudeCommit = fakeCrudeCommit({ message: props.subject })

    it("extracts hyperlink tokens", () => {
      expect(props.expectedTokens).toContainToken("hyperlink")

      const commit = mapCrudeCommitToCommit(crudeCommit, configuration)
      expect(commit.subject).toEqual(props.expectedTokens)
    })
  },
)

describe.each`
	subject
	${"No hyperlinks here"}
	${"https is a must-have"}
	${"mail:sensei@ninja-academy.com"}
	${"https:/close.call/"}
`(
  "when the subject of $subject does not contain any hyperlinks",
  (props: { subject: string }) => {
    const crudeCommit = fakeCrudeCommit({ message: props.subject })

    it("does not extract any hyperlink tokens", () => {
      const commit = mapCrudeCommitToCommit(crudeCommit, configuration)
      expect(commit.subject).not.toContainToken("hyperlink")
    })
  },
)
```

Note how we include `expect(props.expectedTokens).toContainToken("hyperlink")` in the first block as a precondition to ensure that our test data is also correct.

Be sure to cover many different scenarios, for example (but not exhaustive):

- normal forms, shortest meaningful form, realistic longer forms
- near misses that must remain in their existing token type
- leading, trailing, and adjacent punctuation and/or whitespace
- mix with other token types
- inline code phrases and fenced code blocks with content that resemble the new token type, but must remain within their existing `code` or `codeblock` tokens
- position-sensitive behaviour, including valid and invalid positions (when applicable)
- every relevant configuration branch, including the feature being disabled (when applicable)

Prefer creative, realistic, lowkey funny commit messages over repetitive placeholder data.
They should resemble a large variety of real-world commit messages to improve the general test coverage.
For example:

- `Release the robot butler`
- `made the console less dramatic`
- `Revert "fix this confusing plate of spaghetti"`
- `Compare the list of items to the objects downloaded from the server`
- `squash! Paint the eggs with suspicious enthusiasm`
- `#42 Consolidate `BadgeFactory` with `BadgeService` and count to ten`
- `1 2 3 beep! boop!`

Read some existing tests in `src/commits/Tokenise.tests.ts` for inspiration.

## Step 5: Implement regex pattern

Ideally, the regex pattern scaffolded in Step 3 in `src/commits/Tokenise.ts` should match exactly one token instance on one line.
Make boundaries explicit so it does not inadvertently consume adjacent whitespace, punctuation, or part of an established token.

The prioritised order of patterns is behaviour. Place a pattern before every broader pattern that could consume the same text.
For example, inline code phrases are extracted before words and punctuation so their contents are not split, and issue links are extracted before punctuation so that prefixes with special characters remain a part of the issue link.

Special behaviour has been implemented for fenced code blocks (i.e. `codeblock` tokens) which are multiline by nature, but split into multiple tokens: one for each body line covered by the code block.
Instead of using regex patterns, we extract them with stateful, imperative logic in `tokeniseBodyLines`.

Implement an initial regex pattern and implement additional special behaviour in `tokenise`, `tokeniseBodyLines`, and/or `tokeniseSubject` if needed.
Do not duplicate the `tokenise` loop, range calculation, or token construction. Prefer a more precise pattern and correct priority over post-hoc changes to emitted tokens.
For a context-sensitive type, add the smallest possible stateful rule to `tokenise`. Update or reset the state as tokens are consumed so that later text is tokenised normally.
Keep this exception narrow; patterns that are valid everywhere should remain purely pattern-driven.

Iterate over the tokeniser implementation and the unit tests in a TDD-like manner until it satisfies all requirements as clarified in Step 1:

```shell
vpr test 'src/commits/Tokenise.tests.ts'
```

## Step 6: Test rules

Where relevant, update the existing unit tests of rules in `src/rules/` to take the new token type into account.
In general, add new test cases to cover the new token type in rule contexts, ensuring that the existing rules work as expected when facing the new token type.

Run the mandatory project-wide checks before finishing:

```shell
vpr fmt
vpr check
vpr test
```
