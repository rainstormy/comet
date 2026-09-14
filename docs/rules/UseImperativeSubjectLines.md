# useImperativeSubjectLines

Rejects subject lines whose first relevant word is not a verb in the imperative mood.

Imperative subjects describe the change directly and keep the commit history
consistent with instructions such as “Add”, “Fix”, and “Remove”.

## Remarks

- Revert commits are ignored.
- Issue links and squash markers are skipped when locating the first relevant word.
- The first relevant token must be a word; an inline code phrase or punctuation mark is not an imperative verb.
- Whitelisted words are case-insensitive and are trimmed before matching.

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

### Rejected

```
Added a new feature
Updating the retry policy
The retry policy works
```

### Accepted

```
Add a new feature
GH-12 Organise the bookshelf
Chatify the release notes
```
