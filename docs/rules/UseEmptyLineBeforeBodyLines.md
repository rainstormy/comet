# useEmptyLineBeforeBodyLines

Rejects commit messages whose body is not separated from the subject line by exactly one empty line.

A predictable subject-and-body boundary keeps commit messages readable in Git clients
and makes the first paragraph easy to identify.

## Remarks

- Commits without a body and commits with only a blank body are accepted.
- A body immediately after the subject and a body preceded by multiple empty lines are rejected.
- The separator may contain whitespace, as long as there is only one empty line before the body.

## Examples

### Rejected

```
Install a quieter keyboard
The old one sounded like hail.
```

```
Clean the tiny dashboard


The widgets sparkle.
```

### Accepted

```
Teach the changelog to whisper

The noisy bits moved to the release notes.
```
