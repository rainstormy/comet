# noExcessiveWhitespace

Rejects subject lines with leading, trailing, or consecutive whitespace characters, and body lines with consecutive whitespace characters.

## Rationale

Consistent spacing is predictable and makes the commit history easier to read.

## How to fix

Delete the offending whitespace characters in the commit message.

### Command-line interface (CLI)

1. Rebase interactively from (the parent of) the commit SHA, for example:

   ```shell
   git rebase --interactive '7e0ff1ce^'
   ```

2. Set the commit to `reword`, then save and close the editor to proceed:

   ```
   reword 7e0ff1ce Welcome  to my convenience  store
   ```

3. In the commit message editor, delete the offending whitespace characters in the commit message.
   Then save and close the editor to complete the rebase.

4. Force-push the rewritten branch to the remote repository:

   ```shell
   git push --force-with-lease
   ```

### JetBrains IDEs (IntelliJ IDEA, WebStorm, etc.)

1. In the Git tool window, right-click the commit and select **Edit Commit Message...**.
   Delete the offending whitespace characters in the commit message.

2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.

## Remarks

It disregards whitespace in inline code phrases (enclosed in backticks) and fenced code blocks.

Body lines may contain leading and trailing whitespace, e.g. for indentation and for soft, Markdown-style line breaks.

## Options

This rule has no configurable options.

```json
{
  "rules": {
    "noExcessiveWhitespace": {
      "level": "error",
      "options": {}
    }
  }
}
```

## Examples

### Rejected

```
 Recalibrate the espresso machine

Keep  waffles in  sync
```

```
Move sauce  left and bolts   right
```

### Accepted

```
Release the robot butler
Explain the fallback

  Indented text is allowed here.
```

```
Format `two  spaces` exactly
```
