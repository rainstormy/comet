# `useSignedCommits`

Requires every commit to be signed cryptographically with a signing key.

A signature makes impersonation harder by binding the commit to the key used to
sign it. It strengthens the attribution recorded in project history.

## Examples

| ✅ Accepted | ❌ Rejected |
| --- | --- |
| A commit carrying a valid SSH or PGP signature | A commit with no cryptographic signature |
