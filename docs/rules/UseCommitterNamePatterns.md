# useCommitterNamePatterns

Rejects commits where the committer's name does not match one of the configured regex patterns.

## Rationale

Restricting names to a trusted pattern keeps the commit history attributable and standardised for tooling and automated reports.
For example, by requiring committers to use a specific name format.

It can prevent web-based edits and other kinds of automation from committing to the repository.
It can also prevent exposing private usernames in a public repository when the committer has misconfigured Git.

## How to fix

Update the committer's name.

### Command-line interface (CLI)

1. Change your Git name to match one of the configured patterns, for example:

   ```shell
   git config --global user.name 'Santa Claus'
   ```

   (omit the `--global` flag to change the name in the current repository only)

2. Rebase interactively from (the parent of) the commit SHA, for example:

   ```shell
   git rebase --interactive '7e0ff1ce^'
   ```

3. Set the commit to `edit`, then save and close the editor to proceed:

   ```
   edit 7e0ff1ce Welcome to my convenience store
   ```

4. When the rebase pauses, update the committer by amending the commit:

   ```shell
   git commit --amend --no-edit
   ```

5. Complete the rebase:

   ```shell
   git rebase --continue
   ```

6. Force-push the rewritten branch to the remote repository:

   ```shell
   git push --force-with-lease
   ```

## Options

- `patterns` (array of strings): Regular expression patterns to accept. If empty, every name is accepted. Default value: `[]`.

```json
{
  "rules": {
    "useCommitterNamePatterns": {
      "level": "error",
      "options": {
        "patterns": []
      }
    }
  }
}
```

## Examples

Rule configuration:

```json
"patterns": ["\\p{Lu}.*\\s.+", "dependabot\\[bot\\]", "renovate\\[bot\\]", "GitHub"]
```

The following examples display the `committer` header of the commit rather than the commit message.

### Rejected

```
committer: master splinter <email>
```

```
committer: Leonardo <email>
```

```
committer: github <email>
```

### Accepted

```
committer: Leonardo da Vinci <email>
```

```
committer: Master Splinter <email>
```

```
committer: renovate[bot] <email>
```

```
committer: GitHub <email>
```

## Related rules

- [useAuthorEmailPatterns](./UseAuthorEmailPatterns.md)
- [useAuthorNamePatterns](./UseAuthorNamePatterns.md)
- [useCommitterEmailPatterns](./UseCommitterEmailPatterns.md)
