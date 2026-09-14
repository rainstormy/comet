# useIssueLinks

Rejects subject lines without an issue link in the configured position.

Linking commits to issues in a project management system provides traceability
between a code change and the work that motivated it, making related changes
easier to understand and find.

## Remarks

- Merge commits, revert commits, and subjects containing semver tokens are exempt.
- Squash markers are skipped while checking a prefix, but they do not satisfy the requirement.
- The rule recognises only issue links configured under `tokens.issueLinks`.
- Each configured prefix is followed by digits, while configured wildcards are literal labels.

## Options

`position` is one of `"anywhere"`, `"prefix"`, or `"suffix"`; it defaults to
`"anywhere"`. Issue-link tokens must also be configured under `tokens.issueLinks`.
Each `prefix` is followed by digits, while `wildcards` are literal issue-link labels.

```json
{
  "tokens": {
    "issueLinks": {
      "prefixes": ["#", "GH-", "GL-"],
      "wildcards": ["(no-issue)", "[incident]"]
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

### Rejected

```
#42 Convince the office printer to print in colour
Convince the office printer to print in colour
GL-1024 keep the hamsters on the wheel
```

### Accepted

```
Convince the office printer to print in colour #42
Keep the hamsters on the wheel GL-1024
The city can build more pylons (no-issue)
```
