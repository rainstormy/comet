# `noMergeCommits`

Disallows commits with more than one parent commit.

Avoiding merge commits keeps the checked branch linear. A linear history is
easier to read, can be rebased interactively, and makes individual changes easier
to revert.

## Examples

`⇧` denotes the number of parent commits.

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| ⇧ 1<br><br>Merge the two validation paths | ⇧ 2<br><br>Merge branch 'main' into feature/dashboard |
| ⇧ 0<br><br>Initialise the repository | ⇧ 3<br><br>Keep the branch up to date |
