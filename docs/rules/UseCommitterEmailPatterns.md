# useCommitterEmailPatterns

Rejects commits whose committer email does not match any configured regex pattern.

Restricting committer email addresses to trusted patterns keeps the commit history attributable
and helps prevent private addresses from leaking into a public repository.

## Remarks

- Patterns are matched against the complete email address and are case-sensitive.
- Leading and trailing whitespace is not removed before matching.
- An empty `patterns` array accepts every address.

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

### Rejected

```
bunny@theeastercompany.com
claus@santasworkshop.com
```

### Accepted

```
12345678+santaclaus@users.noreply.github.com
```
