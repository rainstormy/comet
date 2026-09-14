# noRestrictedTrailers

Rejects commits whose message body contains a trailer with a restricted key.

Restricting trailers such as `Co-authored-by` keeps the commit history attributable
and prevents metadata from being added through workflows that cannot sign commits.

## Remarks

- Trailer-key matching is case-insensitive.
- Configured keys are trimmed, and an optional trailing colon is ignored.
- Only trailer keys are checked; the same text in ordinary body prose is allowed.
- An empty `restrictedKeys` array allows every trailer.

## Options

`restrictedKeys` is an array of trailer keys. It defaults to an empty array,
so no trailers are restricted until the option is configured.

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

### Rejected

```
Teach the robot butler who gets credit

Co-Authored-By: Everloving Easter Bunny <everloving.easter.bunny@example.com>
```

### Accepted

```
Teach the robot butler who gets credit

Reviewed-by: April O'Neil <april.oneil@fastforward.com>
```
