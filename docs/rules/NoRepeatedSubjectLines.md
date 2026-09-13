# `noRepeatedSubjectLines`

Requires each non-merge commit in a branch to have a distinct subject line. The
comparison is case- and whitespace-insensitive. Revert commits and commits with
squash markers are not reported by this rule.

A repeated subject often indicates an unfinished squash or a commit whose message
was not updated. Distinct descriptions make the history easier to scan and help
readers recover the purpose of each change.

## Examples

Both distinct subjects and repeated squash or revert commits are accepted.

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| 1. Add the retry policy<br>2. Test the retry policy | 1. Add the retry policy<br>2. add   the retry policy |
| 1. Add the retry policy<br>2. fixup! Add the retry policy<br>3. Revert "Add the retry policy" |  |
