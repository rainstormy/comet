# noRevertRevertCommits

Rejects subject lines containing more than one revert marker.

Restoring a revert of a revert can obscure which change is active and where it came from.
Cherry-picking the original commit keeps the original message and authorship visible instead.

## Remarks

- Revert-marker matching is case-insensitive.
- Only tokenised revert markers count; ordinary words such as `revert` and `Reverted` do not.
- A single revert marker is accepted, including one preceded by a squash marker.

## Examples

### Rejected

```
Revert "Revert "Fix the nasty bug""
Revert "Revert "Revert "Repair the soft ice machine"""
```

### Accepted

```
Revert "Repair the soft ice machine"
Time to revert it
```
