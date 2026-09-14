# noExcessiveWhitespace

Rejects subject lines with leading, trailing, or consecutive whitespace,
and body lines with consecutive whitespace.

Consistent spacing keeps commit messages readable in Git clients and prevents
visually similar subject lines from representing different text.

## Remarks

- Leading and trailing whitespace is checked only in subject lines.
- Indentation and trailing whitespace in body lines are allowed.
- Whitespace in inline code phrases and fenced code blocks is disregarded.

## Examples

### Rejected

```
 Recalibrate the espresso machine
Keep  waffles in  sync

Move sauce  left and bolts   right
```

### Accepted

```
Release the robot butler
Explain the fallback

  Indented text is allowed.
```
