# noExcessiveCommitsPerBranch

Rejects branches with more than a given number of undelivered commits.

## Rationale

Keeping pull requests small makes them easier to review and safer to revert if needed.
It may also help to catch accidental rebases onto stale commits and wrong branches.

## Remarks

The following kinds of commits do _not_ count towards the limit:

- Merge commits, i.e. commits with more than one parent.
- Commits with squash markers such as `fixup!` and `squash!`.

## Options

`maxCommits` is a positive integer. Its default is `10`.

```json
{
  "rules": {
    "noExcessiveCommitsPerBranch": {
      "level": "error",
      "options": {
        "maxCommits": 10
      }
    }
  }
}
```

## Examples

With `maxCommits: 3`:

### Rejected

1. ```
   Create new bakery dashboard
   ```
2. ```
   Add Cinnamon telemetry
   ```
3. ```
   Fix the suspicious croissant counter
   ```
4. ```
   Test emergency toaster
   ```

### Accepted

1. ```
   Replace guesswork with a tiny chart
   ```
2. ```
   Teach the kettle to apologise
   ```
3. ```
   Add a label to the mystery switch
   ```
