# noBlankSubjectLines

Rejects subject lines without any alphanumeric characters.

## Rationale

A meaningful subject line makes the commit distinguishable from other commits.
This helps to preserve the readability of the commit history and makes the commit easier to locate.

## Remarks

The following kinds of tokens do _not_ count as alphanumeric characters:

- Issue links such as `#7` and `NEOWISE-2020`.
- Revert markers such as `Revert ""`.
- Squash markers such as `fixup!` and `squash!`.

## Examples

### Rejected

```
...
```

```
``
```

```
fixup! -
```

```
#4 Revert " "
```

### Accepted

```
bugfix
```

```
init project
```

```
Refactor `HotChocolateMachine`
```

```
2.4.0-beta.1
```
