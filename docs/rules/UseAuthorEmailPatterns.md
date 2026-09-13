# `useAuthorEmailPatterns`

Requires each commit author's email address to match one of the configured regular
expression patterns. Comet matches the entire address, so a pattern describes an
accepted address format rather than a substring.

Trusted author-email formats preserve attribution and prevent personal email
addresses from being recorded permanently in repository history.

## Options

`patterns` is an array of regular-expression strings. It defaults to an empty
array, which accepts every address.

```json
{
  "rules": {
    "useAuthorEmailPatterns": {
      "level": "error",
      "options": {
        "patterns": ["\\d+\\+.+@users\\.noreply\\.github\\.com"]
      }
    }
  }
}
```

## Examples

With the pattern above:

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| 19891117+littlemermaid@users.noreply.github.com | little.mermaid@theocean.example |
|  | noreply@github.com |
