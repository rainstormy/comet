# `useConciseSubjectLines`

Limits subject-line length. Hyperlinks, issue links, and inline code phrases do
not count towards the limit. Merge, revert, and squash commits, along with
subject lines containing a semantic version, are ignored.

Short subjects remain readable in Git clients, pull-request lists, and command
output. A concise summary also makes a history easier to scan.

## Options

`maxLength` is a positive integer. Its default is `50`.

```json
{
  "rules": {
    "useConciseSubjectLines": {
      "level": "error",
      "options": { "maxLength": 50 }
    }
  }
}
```

## Examples

With `maxLength: 50`:

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| Add retry metrics | Explain why the retry policy needs another configuration option |
| Explain `RapidTransportService` retries to operators | Replace the temporary metric with a dashboard-ready counter |
| Fix the login retry loop #42 |  |
