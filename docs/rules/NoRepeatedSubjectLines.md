# noRepeatedSubjectLines

Rejects commits whose subject line repeats an earlier subject line in the branch.

Repeated subjects often indicate that a commit should have been squashed or
that its subject was never updated. Keeping each change identifiable makes
the commit history easier to scan and maintain.

## Remarks

- Subject comparison ignores whitespace and capitalization.
- Merge commits do not raise concerns.
- Revert commits and commits with squash markers are skipped entirely.

## Examples

### Rejected

```
1. Add some extra love to the code
2. add   some extra love to the code
```

### Accepted

```
1. Label the mystery switch
2. Test the mystery switch
```

```
1. Tune the kettle
2. fixup! Tune the kettle
3. Revert "Tune the kettle"
```
