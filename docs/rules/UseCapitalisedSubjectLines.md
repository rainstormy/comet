# `useCapitalisedSubjectLines`

Requires a subject line that starts with a letter to start with an uppercase
letter. It disregards leading issue links, inline code phrases, and squash
markers, and ignores subject lines that start with a hyperlink or another
non-letter.

Capitalisation provides a consistent visual structure when reading a history of
short commit subjects.

## Examples

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| Add the retry policy | add the retry policy |
| fixup! Add the retry policy | fixup! add the retry policy |
| 2.4.0-beta.1 |  |
