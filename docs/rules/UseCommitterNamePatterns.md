# useCommitterNamePatterns

Rejects commits whose committer name does not match any configured regex pattern.

Restricting committer names to trusted patterns keeps the commit history attributable
and helps prevent private usernames from being exposed.

## Remarks

- Patterns are matched against the complete name and are case-sensitive.
- Leading and trailing whitespace is not removed before matching.
- An empty `patterns` array accepts every name.

## Options

`patterns` is an array of regular-expression strings. It defaults to an empty
array, which accepts every name.

```json
{
  "rules": {
    "useCommitterNamePatterns": {
      "level": "error",
      "options": { "patterns": ["\\p{Lu}.*\\s.+"] }
    }
  }
}
```

## Examples

With the pattern above:

### Rejected

```
master splinter
Leonardo
```

### Accepted

```
Leonardo da Vinci
Master Splinter
```
