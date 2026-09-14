# noSingleWordSubjectLines

Rejects subject lines containing only one significant word.

A little context in the subject line makes the commit easier to identify,
search for, and understand later.

## Remarks

- Blank subjects and subjects containing no significant words are accepted.
- Revert commits are skipped.
- Issue links and squash markers do not count as words.
- Hyperlinks, inline code phrases, and semver tokens count as one word each.

## Examples

### Rejected

```
WIP
Unsubscribe
fixup! Test
```

### Accepted

```
Fix validation
Refactor `HotChocolateMachine`
Read https://docs.example.com
2.4.0-beta.1
```
