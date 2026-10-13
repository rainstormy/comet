# noRepeatedSubjects

Rejects subject lines equal to a previous subject line in the current branch.

## Rationale

A unique subject line makes the commit distinguishable from other commits.
This keeps the commit history readable and makes the commit easier to find.

Sometimes, a duplicated subject line is meant to amend a previous commit.
In those cases, it should start with a squash marker such as `amend!`, `fixup!`, or `squash!` to make the intent clear and to enable tools for interactive rebasing.

## How to fix

Change the subject line to be unique in the current branch or add `fixup!` at the beginning.

### Command-line interface (CLI)

1. Rebase interactively from (the parent of) the commit SHA, for example:

   ```shell
   git rebase --interactive '7e0ff1ce^'
   ```

2. Set the commit to `reword`, then save and close the editor to proceed:

   ```
   reword 7e0ff1ce Welcome to my convenience store
   ```

   To combine the commit with the previous commit immediately, set the commit to `fixup` instead:

   ```
   fixup 7e0ff1ce Welcome to my convenience store
   ```

3. For `reword`, in the commit message editor, change the subject line (i.e. the first line) to be unique in the current branch or add `fixup!` at the beginning.
   Then save and close the editor to complete the rebase.

4. Force-push the rewritten branch to the remote repository:

   ```shell
   git push --force-with-lease
   ```

### JetBrains IDEs (IntelliJ IDEA, WebStorm, etc.)

1. In the Git tool window, right-click the commit and select **Edit Commit Message...**.
   Change the subject line (i.e. the first line) to be unique in the current branch or add `fixup!` at the beginning.

2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.

## Remarks

It is case- and whitespace-insensitive.

The following kinds of commits are always accepted:

- Merge commits, i.e. commits with more than one parent.
- Revert commits, e.g. `Revert "..."`.
- Commits with squash markers, e.g. `fixup!` and `squash!`.

## Options

This rule has no configurable options.

```json
{
  "rules": {
    "noRepeatedSubjects": {
      "level": "error",
      "options": {}
    }
  }
}
```

## Examples

### Rejected

1. ```
   GL-27 Make some toast
   ```

2. ```
   GL-27   make  some    toast
   ```

3. ```
   GL-27 Make some toast
   ```

### Accepted

1. ```
   Label the mystery switch
   ```

2. ```
   fixup! Label the mystery switch
   ```

3. ```
   fixup! Label the mystery switch
   ```

4. ```
   Teach the kettle to apologise
   ```
