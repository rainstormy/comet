# noMergeCommits

Rejects merge commits with more than one parent.

Keeping the commit history linear makes it easier to rebase interactively,
understand the order of changes, and revert a change later.

## Remarks

- The number of parent commits determines the result, not the subject line.
- Initial commits with no parents and ordinary commits with one parent are accepted.

## Examples

`⇧` denotes the number of parent commits.

### Rejected

```
⇧ 2  Merge branch 'main' into bugfix/dance-party-playlist
⇧ 3  Keep my branch up to date
```

### Accepted

```
⇧ 1  Merge the two validation paths
⇧ 0  Establish the repository
⇧ 1  Release the robot butler
```
