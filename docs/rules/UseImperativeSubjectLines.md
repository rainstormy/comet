# useImperativeSubjectLines

Rejects subject lines that do not start with a verb in the imperative mood.

## Rationale

An imperative subject line completes the sentence 'If applied, this commit will ...', e.g. 'Add a new feature' or 'Refactor a module'.

Consistent phrasing is predictable and makes the commit history easier to read.

Git itself and GitHub use imperative verbs when they generate the following kinds of commits:

- Merge commits, e.g. `Merge branch ...` and `Merge pull request #1 from ...`.
- Revert commits, e.g. `Revert "..."` and `Reapply "..."`.
- Code review suggestions, e.g. `Update src/...`.

## How to fix

Change the subject line to start with an imperative verb.

### Command-line interface (CLI)

1. Rebase interactively from (the parent of) the commit SHA, for example:

   ```shell
   git rebase --interactive '7e0ff1ce^'
   ```

2. Set the commit to `reword`, then save and close the editor to proceed:

   ```
   reword 7e0ff1ce Oh! Welcome to my convenience store
   ```

3. In the commit message editor, change the subject line (i.e. the first line) to start with an imperative verb, preserving any issue links and squash markers (e.g. `fixup!`) as is.
   Then save and close the editor to complete the rebase.

4. Force-push the rewritten branch to the remote repository:

   ```shell
   git push --force-with-lease
   ```

### JetBrains IDEs (IntelliJ IDEA, WebStorm, etc.)

1. In the Git tool window, right-click the commit and select **Edit Commit Message...**.
   Change the subject line (i.e. the first line) to start with an imperative verb, preserving any issue links and squash markers (e.g. `fixup!`) as is.

2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.

## Remarks

Revert commits, e.g. `Revert "..."`, are always accepted.

It disregards the following kinds of tokens before the first word:

- Issue links, e.g. `#7` and `NEOWISE-2020`.
- Squash markers, e.g. `fixup!` and `squash!`.

The first word must be an imperative verb from the built-in list or the `whitelist`.
If Comet does not recognise a verb, add it to the `whitelist`.

## Options

- `whitelist` (array of case-insensitive strings): Custom words to accept in addition to the built-in list of verbs. Default value: `[]`.

```json
{
  "rules": {
    "useImperativeSubjectLines": {
      "level": "error",
      "options": {
        "whitelist": []
      }
    }
  }
}
```

## Examples

Rule configuration:

```json
"whitelist": ["chatify"]
```

### Rejected

```
did some refactoring
```

```
Added a new feature.
```

```
formatting
```

```
The retry policy works
```

### Accepted

```
Add a new feature
```

```
Format
```

```
NEOWISE-2020 Organise the bookshelf
```

```
Chatify the release notes
```
