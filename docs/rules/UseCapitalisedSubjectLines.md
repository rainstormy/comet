# useCapitalisedSubjectLines

Rejects subject lines whose first relevant word starts with a lowercase letter.

A consistent capitalisation style makes the commit history easier to scan
and gives each subject line a clear visual beginning.

## Remarks

- Subjects that do not start with a letter and subjects that start with a hyperlink are accepted.
- Issue links, inline code phrases, and squash markers are skipped when locating the first relevant word.
- The rule checks the first relevant word only; later lowercase words are allowed.

## Examples

### Rejected

```
fix this confusing plate of spaghetti
amend! solve the problem!
GH-12 organise the bookshelf.
```

### Accepted

```
Refactor the taxi module
fixup! Resolve a bug that thought it was a feature
https://github.com/rainstormy/comet/pull/42 release the robot butler
2.4.0-beta.1
```
