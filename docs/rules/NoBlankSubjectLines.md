# noBlankSubjectLines

Rejects subject lines without any alphanumeric characters.

## Rationale

The subject line is the part of a commit that readers see most often when scanning the commit history.

A meaningful subject line makes the commit distinguishable from other commits.
This keeps the commit history readable and makes the commit easier to find.

## How to fix

Change the subject line to contain at least one alphanumeric character.

### Command-line interface (CLI)

1. Rebase interactively from (the parent of) the commit SHA, for example:

   ```shell
   git rebase --interactive '7e0ff1ce^'
   ```

2. Set the commit to `reword`, then save and close the editor to proceed:

   ```
   reword 7e0ff1ce ...
   ```

3. In the commit message editor, change the subject line (i.e. the first line) to contain at least one alphanumeric character.
   Then save and close the editor to complete the rebase.

4. Force-push the rewritten branch to the remote repository:

   ```shell
   git push --force-with-lease
   ```

### JetBrains IDEs (IntelliJ IDEA, WebStorm, etc.)

1. In the Git tool window, right-click the commit and select **Edit Commit Message...**.
   Change the subject line (i.e. the first line) to contain at least one alphanumeric character.

2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.

## Remarks

The following kinds of tokens do _not_ count as alphanumeric characters:

- Issue links, e.g. `#7` and `NEOWISE-2020`.
- Revert markers, e.g. `Revert` in `Revert "..."`.
- Squash markers, e.g. `fixup!` and `squash!`.

## Options

This rule has no configurable options.

```json
{
  "rules": {
    "noBlankSubjectLines": {
      "level": "error",
      "options": {}
    }
  }
}
```

## Examples

### Rejected

```
...
```

```
``
```

```
fixup! -
```

```
#4 Revert " "
```

### Accepted

```
bugfix
```

```
init project
```

```
Refactored `HotChocolateMachine`
```

```
2.4.0-beta.1
```

## Related rules

- [noSingleWordSubjectLines](./NoSingleWordSubjectLines.md)
