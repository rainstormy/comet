# `noUnexpectedPunctuation`

Disallows trailing punctuation in subject lines. Revert commits are ignored. The
rule also disregards recognised issue links, matched closing brackets and quotes,
and symbols associated with numbers, such as `100%`, `C++`, and `3+`.

Omitting unnecessary sentence punctuation makes short subjects more uniform and
leaves more of their limited width for the description.

## Examples

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| Update the retry policy | Update the retry policy. |
| Explain the fallback (for operators) | Explain the fallback? |
| Increase the sample rate to 100% | Signal success! |
| Close the retry issue #42 | Remove the old route -> |
