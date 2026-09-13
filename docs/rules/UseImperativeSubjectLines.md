# `useImperativeSubjectLines`

Requires subject lines to start with a verb in the imperative mood. Leading issue
links and squash markers are disregarded, and revert commits are ignored.

The imperative matches Git's own generated subjects, such as `Merge branch ...`
and `Revert ...`. It describes the change as an action that the commit applies.

## Options

`whitelist` adds case-insensitive words that should be accepted as imperative
verbs. It defaults to an empty array.

```json
{
  "rules": {
    "useImperativeSubjectLines": {
      "level": "error",
      "options": { "whitelist": ["chatify", "dockerise"] }
    }
  }
}
```

## Examples

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| Add the retry policy | Added the retry policy |
| Chatify the release notes | Updating the retry policy |
|  | The retry policy works |
