# `useCommitterEmailPatterns`

Requires each committer's email address to match one of the configured regular
expression patterns. Comet matches the entire address.

Trusted committer-email formats preserve attribution and prevent personal email
addresses from being recorded permanently in repository history. They can also
help a team detect commits made through a web interface with an unexpected
committer identity.

## Options

`patterns` is an array of regular-expression strings. It defaults to an empty
array, which accepts every address.

```json
{
  "rules": {
    "useCommitterEmailPatterns": {
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
| 18920129+santaclaus@users.noreply.github.com | claus@santasworkshop.example |
|  | noreply@github.com |
