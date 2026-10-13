# noUnexpectedPunctuation

Rejects subjects with unexpected trailing punctuation.

## Rationale

The subject is the first line of the commit message.
It is what readers see most often when scanning the commit history.

It acts as the commit title; hence, it does not need a full stop at the end.

Consistent punctuation is predictable and makes the commit history easier to read.

## How to fix

Delete the offending punctuation characters in the subject.

### Command-line interface (CLI)

1. Rebase interactively from (the parent of) the commit SHA, for example:

   ```shell
   git rebase --interactive '7e0ff1ce^'
   ```

2. Set the commit to `reword`, then save and close the editor to proceed:

   ```
   reword 7e0ff1ce Welcome to my convenience store.
   ```

3. In the commit message editor, delete the offending punctuation characters in the subject (i.e. the first line).
   Then save and close the editor to complete the rebase.

4. Force-push the rewritten branch to the remote repository:

   ```shell
   git push --force-with-lease
   ```

### JetBrains IDEs (IntelliJ IDEA, WebStorm, etc.)

1. In the Git tool window, right-click the commit and select **Edit Commit Message...**.
   Delete the offending punctuation characters in the subject (i.e. the first line).

2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.

## Remarks

Revert commits, e.g. `Revert "..."`, are always accepted.

The following kinds of punctuation are allowed:

- Closing brackets and quotation marks when they enclose text, e.g. `(after lunch)` and `"strategy"`.
- Numeric suffixes `%`, `"`, `+`, and `!`, e.g. `100%` and `5!`.
- Built-in list of names, e.g. `C#` and `Vite+`.

## Options

This rule has no configurable options.

```json
{
  "rules": {
    "noUnexpectedPunctuation": {
      "level": "error",
      "options": {}
    }
  }
}
```

## Examples

### Rejected

```
Make the program act like a clown.
```

```
Polish the moon laser! #42
```

```
Hide a cheerful easter egg :joy:
```

```
Queue the parcel] GL-20
```

### Accepted

```
Rewire the pantry (after lunch)
```

```
Set tax rates to 100%
```

```
Prepare the dashboard in C++
```

```
Tame the release robot

The webhook now announces success!
```

```
Revert "Release the robot butler!"
```
