# `noExcessiveWhitespace`

Disallows leading, trailing, and consecutive whitespace in subject lines. It
disallows consecutive whitespace in body lines while allowing indentation and
trailing body-line whitespace. Whitespace inside inline code and fenced code
blocks is disregarded.

Consistent spacing keeps commit messages readable in Git clients and prevents
visually similar subject lines from representing different text.

## Examples

`·` denotes a space and `⏎` a newline.

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| Update·the·parser | ·Update·the·parser |
| Explain·the·fallback⏎<br>⏎<br>··Indented·text·is·allowed. | Update·the··parser |
|  | Update·the·parser· |
|  | Explain·the·fallback⏎<br>⏎<br>The·parser··now·retries. |
