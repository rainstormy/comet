# useLineWrapping

Rejects body lines longer than the configured character limit.

## Rationale

Wrapping body lines keeps commit messages readable in terminals and Git clients without horizontal scrolling.

## How to fix

Insert appropriate line breaks in the message body to make every line fit within the character limit.

### Command-line interface (CLI)

1. Rebase interactively from (the parent of) the commit SHA, for example:

   ```shell
   git rebase --interactive '7e0ff1ce^'
   ```

2. Set the commit to `reword`, then save and close the editor to proceed:

   ```
   reword 7e0ff1ce Welcome to my convenience store
   ```

3. In the commit message editor, insert appropriate line breaks in the message body to make every line fit within the character limit.
   Then save and close the editor to complete the rebase.

4. Force-push the rewritten branch to the remote repository:

   ```shell
   git push --force-with-lease
   ```

### JetBrains IDEs (IntelliJ IDEA, WebStorm, etc.)

1. In the Git tool window, right-click the commit and select **Edit Commit Message...**.
   Insert appropriate line breaks in the message body to make every line fit within the character limit.

2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.

## Remarks

Merge commits, i.e. commits with more than one parent, are always accepted.

The following kinds of tokens do _not_ count towards the character limit:

- Fenced code blocks (enclosed in triple backticks).
- Hyperlinks.
- Inline code phrases (enclosed in backticks).
- Issue links, e.g. `#7` and `NEOWISE-2020`.
- Trailers, e.g. `Co-authored-by:`.

## Options

- `maxLength` (positive integer): Maximum number of characters allowed per body line. Default value: `72`.

```json
{
  "rules": {
    "useLineWrapping": {
      "level": "error",
      "options": {
        "maxLength": 72
      }
    }
  }
}
```

## Examples

Rule configuration:

```json
"maxLength": 72
```

### Rejected

```
Prepare the launch checklist

The deploy bot left a very long note about sandwiches and spectral keyboards.
```

```
Document the adapter notes

Document the `RapidTransportService` adapter while the migration crew checks every quiet corner before midnight.
```

### Accepted

```
Prepare the launch checklist

The deploy bot left a very long note about sandwiches and spectral
keyboards.
```

```
Review the migration

Review GH-291 before the migration ships and leave the audit trail clear now.
Use the `RapidTransportService` adapter while the migration crew checks every quiet corner.
```

```
Review the release

Read https://github.com/rainstormy/comet/pull/42 before lunch while robots nap beside the sleepy console
```

````
Update the handbook

```text
This line is intentionally enormous because the robot archivist stores it verbatim without asking anyone's permission.
```
````

```
Prepare the archive

Co-authored-by: Everloving Easter Bunny <everloving.easter.bunny@example.com>
Signed-off-by: Hamato Yoshi <hamato@nycsewers.com>
```

## Related rules

- [useConciseSubjectLines](./UseConciseSubjectLines.md)
