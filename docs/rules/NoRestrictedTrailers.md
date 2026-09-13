# `noRestrictedTrailers`

Disallows message-body trailers with configured keys. Trailer keys are compared
case-insensitively; surrounding whitespace and a final colon in a configured key
are ignored.

Teams can use this rule to retain clear attribution. For example, restricting
`Co-authored-by` avoids an attribution that cannot carry a cryptographic commit
signature and rejects commits created from GitHub code-review suggestions.

## Options

`restrictedKeys` is an array of trailer keys. It defaults to an empty array, so
no trailers are restricted until the option is configured.

```json
{
  "rules": {
    "noRestrictedTrailers": {
      "level": "error",
      "options": { "restrictedKeys": ["Co-authored-by", "Signed-off-by"] }
    }
  }
}
```

## Examples

With `restrictedKeys: ["Co-authored-by"]`:

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| Document the retry policy⏎<br>⏎<br>Reviewed-by: Ada Lovelace <ada@example.com> | Document the retry policy⏎<br>⏎<br>Co-Authored-By: Ada Lovelace <ada@example.com> |
