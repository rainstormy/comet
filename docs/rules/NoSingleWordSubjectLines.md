# `noSingleWordSubjectLines`

Requires at least two word-like parts in the subject line. Hyperlinks and inline
code phrases each count as one word; issue links and squash markers do not. Revert
commits are ignored.

A single word rarely identifies the change well enough to distinguish it from
neighbouring commits. Requiring a second word encourages a compact but useful
summary.

## Examples

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| Fix validation | Fix |
| Update `ReleaseLedger` | WIP |
| Read https://docs.example.com | fixup! Test |
