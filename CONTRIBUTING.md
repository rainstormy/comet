# Human contribution guidelines

Consult `AGENTS.md` for a detailed description of the project.

## Tasks

| Task                      | Description                                                                           |
|---------------------------|---------------------------------------------------------------------------------------|
| `vpr build`               | Generates production-grade build artefacts of all entrypoints.                        |
| `vpr check`               | Verifies that the source code is clean, type-safe, and well-formatted.                |
| `vpr fmt`                 | Applies linting suggestions and reformats the source code.                            |
| `vpr install`             | Installs dependencies.                                                                |
| `vpr test [...filenames]` | Runs the given unit test files or the entire test suite if no arguments are provided. |

## Get started

This section describes the necessary steps for you to start coding in this project.

### Prerequisites

- [Git](https://git-scm.com)
- [Vite+](https://viteplus.dev)
- [actionlint](https://rhysd.github.io/actionlint) (optional)

### Set up the Git repository

1. Generate separate pairs of authentication and signing keys with an SSH agent such as [1Password](https://www.1password.dev/ssh/get-started) or [OpenSSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent).

2. [Upload the public keys](https://github.com/settings/ssh/new) (`ssh-ed25519 AAAAC3...`) to your GitHub profile.

3. [Add GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints) to the list of trusted remotes:

   ```shell
   touch ~/.ssh/known_hosts && \
   echo 'github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl' >> ~/.ssh/known_hosts
   ```

4. [Clone the project](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository) with the authentication key:

   ```shell
   git clone 'git@github.com:rainstormy/comet.git' && \
   cd 'comet'
   ```

5. Declare your Git identity with your first and last names and GitHub noreply email address:

   ```shell
   git config user.name '<FirstName> <LastName>'
   ```

   ```shell
   git config user.email '<id>+<username>@users.noreply.github.com'
   ```

6. [Sign your commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification) with the signing key:

   ```shell
   git config user.signingkey 'ssh-ed25519 AAAAC3<SigningKey>'
   ```

   ```shell
   git config gpg.format 'ssh' && \
   git config commit.gpgsign 'true' && \
   git config tag.gpgsign 'true'
   ```

### Set up the workspace

1. Install dependencies, enable Git hooks, and generate local IDE workspaces:

   ```shell
   vpr setup
   ```

2. Open the workspace in the IDE of your choice.

   IntelliJ IDEA:

   ```shell
   idea .
   ```

   Visual Studio Code:

   ```shell
   code .
   ```
