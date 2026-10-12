# noRevertRevertCommits

Rejects subject lines with more than one revert marker, encouraging cherry-picking the original commit.

## Rationale

Nested reverts act like double negation, [making it harder to tell](https://git-scm.com/docs/git-revert#_discussion) whether a change is currently active.

Cherry-picking the original commit preserves its authorship, improving the traceability of the commit history.

## How to fix

Cherry-pick the original commit or replace the subject line with the original commit's subject line.

### Command-line interface (CLI)

To restore a reverted change:

1. Cherry-pick the original commit, for example:

   ```shell
   git cherry-pick 'cafebeef'
   ```

2. Push the branch to the remote repository:

   ```shell
   git push
   ```

If the nested revert commit already exists:

1. Rebase interactively from (the parent of) the nested revert's SHA, for example:

   ```shell
   git rebase --interactive '7e0ff1ce^'
   ```

2. Set the nested revert to `edit`, then save and close the editor to proceed:

   ```
   edit 7e0ff1ce Revert "Revert "Welcome to my convenience store""
   ```

3. When the rebase pauses, restore the message and authorship of the original commit:

   ```shell
   git commit --amend --reuse-message 'cafebeef'
   ```

4. Complete the rebase:

   ```shell
   git rebase --continue
   ```

5. Force-push the rewritten branch to the remote repository:

   ```shell
   git push --force-with-lease
   ```

### JetBrains IDEs (IntelliJ IDEA, WebStorm, etc.)

To restore a reverted change:

1. In the Git tool window, right-click the original commit and select **Cherry-Pick**.

2. Select **Git** > **Push...** > **Push** to push the branch to the remote repository.

If the nested revert commit already exists:

1. In the Git tool window, right-click it and select **Edit Commit Message...**.
   Replace the subject line (i.e. the first line) with the original commit's subject line.

2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.

## Options

This rule has no configurable options.

```json
{
  "rules": {
    "noRevertRevertCommits": {
      "level": "error",
      "options": {}
    }
  }
}
```

## Examples

### Rejected

```
Revert "Revert "Fix the nasty bug""
```

```
Revert "Revert "Revert "Repair the soft ice machine"""
```

```
fixup! Revert "Revert "Add an amazing feature""
```

### Accepted

```
Revert "Repair the soft ice machine"
```

```
fixup! Revert "Repair the soft ice machine"
```

```
Reapply "Add an amazing feature"
```

```
Reverted some secret stuff
```
