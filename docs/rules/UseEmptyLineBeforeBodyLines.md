# `useEmptyLineBeforeBodyLines`

Requires exactly one empty line between a subject line and the first non-blank
body line. A commit with no body, or only blank body lines, is accepted.

Git treats the text before the first blank line as the commit title. Keeping the
separator makes the title and explanatory body render predictably in Git tools.

## Examples

`⏎` denotes a newline.

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| Explain the retry policy⏎<br>⏎<br>The service retries only transient failures. | Explain the retry policy⏎<br>The service retries only transient failures. |
| Fix the retry policy | Explain the retry policy⏎<br>⏎<br>⏎<br>The service retries only transient failures. |
