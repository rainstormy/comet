# useCommitterEmailPatterns

Rejects commits where the committer's email address does not match one of the configured regex patterns.

## Rationale

Restricting email addresses to a trusted pattern keeps the commit history attributable and standardised for tooling and automated reports.
For example, by requiring committers to use a specific email address format or domain.

It can prevent web-based edits and other kinds of automation from committing to the repository.
It can also prevent exposing private email addresses in a public repository when the committer has misconfigured Git.

## How to fix

Update the committer's email address.

### Command-line interface (CLI)

1. Change your Git email address to match one of the configured patterns, for instance:

   ```shell
   git config --global user.email 'claus@santasworkshop.com'
   ```

   (omit the `--global` flag to change the email address in the current repository only)

2. Rebase interactively from (the parent of) the commit SHA, for instance:

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

- `patterns` (array of strings): Regular expression patterns to accept. If empty, every email address is accepted. Default value: `[]`.

```json
{
  "rules": {
    "useCommitterEmailPatterns": {
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
"patterns": ["\\d+\\+.+@users\\.noreply\\.github\\.com", "noreply@github\\.com"]
```

The following examples display the `committer` header of the commit rather than the commit message.

### Rejected

```
committer: name <hello@fictivecompany.com>
```

```
committer: name <claus@santasworkshop.com>
```

### Accepted

```
committer: name <146315497+rainstormybot-nimbus@users.noreply.github.com>
```

```
committer: name <noreply@github.com>
```

## Related rules

- [useAuthorEmailPatterns](./UseAuthorEmailPatterns.md)
- [useAuthorNamePatterns](./UseAuthorNamePatterns.md)
- [useCommitterNamePatterns](./UseCommitterNamePatterns.md)
