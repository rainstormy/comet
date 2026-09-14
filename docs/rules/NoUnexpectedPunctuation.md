# noUnexpectedPunctuation

Rejects subject lines with unexpected trailing punctuation.

A consistent subject-line ending makes the commit history easier to scan
and keeps the same convention across Git clients.

## Remarks

- Revert commits are skipped.
- Trailing issue links are disregarded.
- Closing brackets, paired quotes, and symbols associated with numbers are allowed.
- Punctuation in the message body is not checked.

## Examples

### Rejected

```
Make the program act like a clown.
Apply strawberry jam to make the code sweeter~
Is the coffee ready?
Hide a cheerful easter egg :joy:
```

### Accepted

```
Release the robot butler
Rewire the pantry (after lunch) #42
Increase the tax to 100%
Revert "Release the robot butler!"
```
