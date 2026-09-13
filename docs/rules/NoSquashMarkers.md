# `noSquashMarkers`

Disallows squash markers such as `amend!`, `fixup!`, and `squash!` in subject
lines.

These markers are useful while preparing a branch for autosquash, but they should
be combined with their ancestor before the branch is merged. Doing so removes
intermediate diffs, makes commits more cohesive, and simplifies later reversions.

## Examples

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| Add the release checklist | amend! Add the release checklist |
| Test the release checklist | fixup! Test the release checklist |
|  | squash! Add the release checklist |
