# noSquashMarkers

Rejects subject lines that contain a squash marker.

Squashing temporary commits before delivery removes noisy intermediate diffs,
keeps each final change cohesive, and makes the history easier to revert.

## Remarks

- `fixup!`, `squash!`, and `amend!` are recognised as squash markers.
- Marker matching is case-insensitive and combined or repeated markers are still rejected.
- Plain words such as `fixup`, `squash`, and `amend` without a marker are allowed.

## Examples

### Rejected

```
fixup! Reheat the leftovers
squash! Make the program act like a clown
amend! Apply strawberry jam to make the code sweeter
```

### Accepted

```
Refactor the taxi module
Make the commit scream fixup! again
Revert "Release the robot butler"
```
