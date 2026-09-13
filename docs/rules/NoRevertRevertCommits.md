# `noRevertRevertCommits`

Allows at most one revert marker in a subject line, preventing a commit that
reverts a revert.

Cherry-picking the original commit retains its message and authorship. That gives
later readers more context than a chain of reversals and keeps the history
traceable.

## Examples

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| Revert "Remove the retry policy" | Revert Revert the retry policy |
| Restore the retry policy manually | Revert Revert Revert the retry policy |
