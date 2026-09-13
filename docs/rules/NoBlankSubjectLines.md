# `noBlankSubjectLines`

Rejects subject lines without any alphanumeric characters.

A meaningful subject line makes the commit distinguishable in the commit history, as seen in `git log` and pull request views.

That preserves a readable history even when a commit does not need a body.

A subject line with a
word, hyperlink, semantic version, or inline code phrase is accepted; whitespace,
punctuation, issue links, revert markers, and squash markers alone are not.

## Examples

| ✅ Accepted               | ❌ Rejected |
|---------------------------|-------------|
| Add the release checklist | ␠           |
| `ReleaseLedger`           | ---         |
| 2.4.0-beta.1              | fixup!      |
|                           | Revert      |
