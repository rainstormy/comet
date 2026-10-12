# noRestrictedTrailers

Rejects configured [trailers](https://git-scm.com/docs/git-interpret-trailers) in the message body.

## Rationale

Restricting certain kinds of trailers keeps commit metadata consistent with the project's contribution policy.

For example, a project can disallow `Co-authored-by` trailers to prevent GitHub from committing code review suggestions in pull requests and to encourage contributors to take full credit of work done by AI agents.

## How to fix

Delete the offending trailer lines in the message body.

### Command-line interface (CLI)

1. Rebase interactively from (the parent of) the commit SHA, for example:

   ```shell
   git rebase --interactive '7e0ff1ce^'
   ```

2. Set the commit to `reword`, then save and close the editor to proceed:

   ```
   reword 7e0ff1ce Welcome to my convenience store
   ```

3. In the commit message editor, delete the offending trailer lines in the message body.
   Then save and close the editor to complete the rebase.

4. Force-push the rewritten branch to the remote repository:

   ```shell
   git push --force-with-lease
   ```

### JetBrains IDEs (IntelliJ IDEA, WebStorm, etc.)

1. In the Git tool window, right-click the commit and select **Edit Commit Message...**.
   Delete the offending trailer lines in the message body.

2. Select **Git** > **Push...** > **Force Push** to force-push the rewritten branch to the remote repository.

## Options

- `restrictedKeys` (array of case-insensitive strings): Trailer keys to disallow. If empty, every trailer is allowed. Default value: `[]`.

```json
{
  "rules": {
    "noRestrictedTrailers": {
      "level": "error",
      "options": {
        "restrictedKeys": []
      }
    }
  }
}
```

## Examples

Rule configuration:

```json
"restrictedKeys": ["Co-authored-by", "Signed-off-by"]
```

### Rejected

```
Update src/main.ts

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

```
Pack the deploy snacks

All shelves are stocked.

signed-off-by: April O'Neil <april.oneil@fastforward.com>
signed-off-by: Casey Jones <casey.jones@fastforward.com>
SIGNED-OFF-BY: Hamato Yoshi <hamato@nycsewers.com>
Relates-to: snack table
```

### Accepted

```
Credit the careful reviewers

Reviewed-by: April O'Neil <april.oneil@fastforward.com>
```

```
Explain the suspicious label

This occurrence of Signed-off-by: looked official for a moment, but it is just ordinary prose.
```

```
Do some pair programming

Co-authored-by: Gon Freecss <rock.paper.scissors@hunters.com>

All participants had fun.
```
