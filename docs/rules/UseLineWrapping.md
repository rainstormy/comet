# `useLineWrapping`

Limits the length of each body line. Hyperlinks, issue links, and inline code
phrases do not count towards the limit. Merge commits, fenced-code-block lines,
and trailer lines are ignored.

Wrapped prose remains readable in terminals and other Git clients that reserve
part of the line for indentation or metadata.

## Options

`maxLength` is a positive integer. Its default is `72`.

```json
{
  "rules": {
    "useLineWrapping": {
      "level": "error",
      "options": { "maxLength": 72 }
    }
  }
}
```

## Examples

With `maxLength: 72`:

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| Explain the retry policy⏎<br>⏎<br>The service retries transient failures and reports the final outcome. | Explain the retry policy⏎<br>⏎<br>The service retries transient failures and reports the final outcome to every interested caller. |
| Explain the retry policy⏎<br>⏎<br>⏎<br>\`\`\`text⏎<br>⏎<br>This deliberately long command example is preserved verbatim.⏎<br>⏎<br>\`\`\` |  |
