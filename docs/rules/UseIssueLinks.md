# `useIssueLinks`

Requires a subject line to contain an issue link, either anywhere, at its prefix,
or at its suffix. The rule ignores merge and revert commits, along with subject
lines containing a semantic version. For `prefix`, it also disregards a leading
squash marker.

An issue link connects a code change with the work that motivated it. That makes
the history easier to understand and provides a direct route to requirements,
decisions, and related changes.

## Options

`position` is one of `"anywhere"`, `"prefix"`, or `"suffix"`; it defaults to
`"anywhere"`. Issue-link tokens must also be configured under `tokens.issueLinks`.
Each `prefix` is followed by digits, while `wildcards` are literal issue-link
labels.

```json
{
  "tokens": {
    "issueLinks": {
      "prefixes": ["#", "COMET-"],
      "wildcards": ["[no-issue]"]
    }
  },
  "rules": {
    "useIssueLinks": {
      "level": "error",
      "options": { "position": "suffix" }
    }
  }
}
```

## Examples

With `position: "suffix"` and the configuration above:

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| Explain the retry policy #42 | #42 Explain the retry policy |
| Explain the retry policy COMET-42 | Explain the retry policy |
| Document the generated release [no-issue] | Explain COMET-42 retries to operators |
