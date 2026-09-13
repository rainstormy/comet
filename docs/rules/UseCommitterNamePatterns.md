# `useCommitterNamePatterns`

Requires each committer's name to match one of the configured regular-expression
patterns. Comet matches the entire name.

Trusted committer-name formats preserve attribution and avoid permanently
recording personal usernames that do not identify a contributor in the project
history.

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

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| Grace Hopper | grace hopper |
| Jeanne d'Arc | Grace |
