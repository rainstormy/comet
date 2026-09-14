# useSignedCommits

Rejects commits without a cryptographic signature.

## Rationale

A [commit signature](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification) lets Git verify the authenticity of the commit, establishing confidence that it is authored by the person who claims to have authored it.

When enforced throughout the commit history, it also establishes confidence that no one else is impersonating you, complementing GitHub's [vigilant mode](https://docs.github.com/en/authentication/managing-commit-signature-verification/displaying-verification-statuses-for-all-of-your-commits) which highlights unsigned commits.

## How to fix

Sign the commit.

### Command-line interface (CLI)

1. Generate a signing key such as a pair of public/private SSH keys using a tool like [1Password](https://www.1password.dev/ssh/get-started), [Bitwarden](https://bitwarden.com/help/ssh-agent), or [OpenSSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent).
   Load the SSH key into the SSH agent.

2. Tell Git to use your signing key, for example a public SSH key:

   ```shell
   git config --global commit.gpgsign 'true'
   git config --global gpg.format 'ssh'
   git config --global user.signingkey 'ssh-ed25519 AAAAC3<SigningKey>'
   ```

   (omit the `--global` flag to change the signature in the current repository only)

3. Rebase interactively from (the parent of) the commit SHA, for example:

   ```shell
   git rebase --interactive '7e0ff1ce^'
   ```

4. Set the commit to `edit`, then save and close the editor to proceed:

   ```
   edit 7e0ff1ce Welcome to my convenience store
   ```

5. When the rebase pauses, sign the commit by amending it:

   ```shell
   git commit --amend --gpg-sign --no-edit
   ```

6. Complete the rebase:

   ```shell
   git rebase --continue
   ```

7. Force-push the rewritten branch to the remote repository:

   ```shell
   git push --force-with-lease
   ```

## Remarks

Any non-empty signature is accepted, including invalid ones.

## Options

This rule has no configurable options.

```json
{
  "rules": {
    "useSignedCommits": {
      "level": "error",
      "options": {}
    }
  }
}
```

## Examples

The following examples display the `gpgsig` header of the commit rather than the commit message.

### Rejected

```
gpgsig:
```

### Accepted

```
gpgsig: -----BEGIN SSH SIGNATURE-----
 NjI1ZTMxMzctODU1ZS00YmVmLWI0MTMtY2Q4MmI4YjZlYzE0
 -----END SSH SIGNATURE-----
```

```
gpgsig: -----BEGIN PGP SIGNATURE-----

 NGU2NWQ0YzctN2I0OC00YWExLWE2NmUtZjg3MTZmNGY2MWJhODM4NTI1ZTEtZWY4OS00YjVjLTgwMWItOTgxNTBmOGJiOTZk
 -----END PGP SIGNATURE-----
```
