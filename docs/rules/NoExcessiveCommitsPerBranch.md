# `noExcessiveCommitsPerBranch`

Limits the number of commits in the branch being checked. Comet reports every
counted commit after the configured limit. Merge commits and commits with squash
markers do not contribute to that count.

Small pull requests are easier to review and to revert. A limit can also expose a
branch that was rebased onto the wrong base branch or still contains stale work.

## Options

`maxCommits` is a positive integer. Its default is `10`.

```json
{
  "rules": {
    "noExcessiveCommitsPerBranch": {
      "level": "error",
      "options": { "maxCommits": 3 }
    }
  }
}
```

## Examples

With `maxCommits: 3`:

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| 1. Add the dashboard shell<br>2. Connect the dashboard data<br>3. Test the empty state | 1. Add the dashboard shell<br>2. Connect the dashboard data<br>3. Test the empty state<br>4. Polish the loading state |
| Merge branch 'main' into feature/dashboard |  |
| fixup! Test the empty state |  |
