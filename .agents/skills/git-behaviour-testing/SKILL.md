---
name: git-behaviour-testing
description: Verify Comet against the behaviour of the real local Git client. Use when changing code that depends on Git hooks, Git configuration, `git log` output, commit message cleanup, commit identities, merges, or rebases, and when reviewing such changes or the documentation of Git hook setups.
---

# Git behaviour testing

Code and documentation review is not enough for logic that mimics or depends on Git. Real Git disagreed with assumptions in this project several times (for instance about which hook sees which message, when `GIT_EDITOR=:` is set, and when comment-only messages abort a commit).
Verify behaviour empirically with differential tests in throwaway repositories, and only then write unit tests with mocks that encode what you observed.

## Rules

- Never experiment in the Comet repository. Create a fresh directory under `/tmp` per experiment (`mktemp -d`).
- Run experiments as `bash` scripts. Interactive shells may have `noclobber` or aliases like `cp -i`, which silently break scripts.
- Define helpers as shell functions, not as variables holding a command string (`g() { git -c user.name=a ...; }`).
- Treat the shell's working directory as non-persistent. Use absolute paths and `cd` in the same command.
- Record the Git version (`git --version`) next to every conclusion. Behaviour changes between versions.

## Set up a throwaway repository

```bash
D=$(mktemp -d /tmp/git-experiment.XXXX) && cd "$D" && git init -q -b main .
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1
unset GIT_EDITOR
git config user.name "Ada Lovelace"
git config user.email "ada@example.com"
git config commit.gpgsign false
```

To see what a `commit-msg` hook receives, install a hook that dumps its input and environment:

```bash
cat > .git/hooks/commit-msg <<'HOOK'
#!/bin/bash
{
  echo "ARG1=$1 PWD=$PWD"
  echo "GIT_EDITOR=${GIT_EDITOR-<unset>} REFLOG=${GIT_REFLOG_ACTION-<unset>}"
  echo "HEAD=$(git rev-parse --verify --quiet HEAD) MERGE_HEAD=$(git rev-parse --verify --quiet MERGE_HEAD)"
  sed -n l "$1"
} >> "$(git rev-parse --show-toplevel)/hook.log"
HOOK
chmod +x .git/hooks/commit-msg
```

To run Comet as the hook, use `exec node /path/to/comet/src/main-cli.ts --message-file "$1"` (absolute path to the Comet checkout; optionally add `--config`).
To simulate an editor, point `GIT_EDITOR` to a script that edits the file passed as `$1` and keeps Git's comment block.

## Differential tests

Compare what Git does with what Comet computes for the same input:

- What Git committed: `git log -1 --format=%B` or `git cat-file commit HEAD` (the message follows the first blank line; mind the final newline).
- What Comet saw: call the function from the repository root, for example
  `node --input-type=module -e "import { cleanupGitCommitMessage } from '#commits/git/CleanupGitCommitMessage.ts'; ..."`.

Vary one input at a time and compare. When Git and Comet disagree, Git is right.

## Scenarios to cover

Pick the ones relevant to the change:

- Message sources: `-m` (repeated), `-F file`, `-F -`, editor, `-v` and `commit.verbose`, template (`-t`), `--fixup`, `--squash`.
- History operations: `--amend` (with and without `--no-edit`), initial commit in an empty repository, `merge` (clean and conflicted, then `git commit` or `merge --continue`), `pull` creating a merge, `rebase -i` with reword, squash, and fixup, `cherry-pick`, `revert`.
- Configuration: `commit.cleanup` modes (`strip`, `whitespace`, `verbatim`, `scissors`, `default`), `core.commentChar` and `core.commentString` (including `auto`, case variants, and a trailing space), `GIT_EDITOR` set by Git versus set by the user.
- Message content: trailing whitespace, CRLF, runs of blank lines, leading blank lines, `#` lines, scissors lines typed by the user, empty and comment-only messages, `--allow-empty-message`.
- Environment: committing from a subdirectory, a linked worktree (absolute paths), paths with spaces, `--no-verify`, `--dry-run`.
- Hook managers: Husky, Lefthook, simple-git-hooks, and pre-commit/prek differ in `PATH` handling (Lefthook does not add `node_modules/.bin`) and quoting. Check documented snippets by running them.

## Verified facts (Git 2.56.0)

Re-verify before relying on them for a new situation.

- `commit-msg` runs before Git cleans up the message. Git reads the file back afterwards, so a hook may rewrite it in place.
- `pre-commit` never sees the message. `prepare-commit-msg` receives the message source (`message`, `commit`, `merge`, `squash`) as its second argument, but `commit-msg` does not.
- `commit-msg` runs for `git commit` (including `--amend --no-edit` and `--fixup`), `git merge` and `git pull` merges (the file is `.git/MERGE_MSG`), and `rebase -i` reword. It does not run for `cherry-pick`, `revert`, plain rebase picks, or `--no-verify`.
- `GIT_EDITOR=:` is set by Git in the hook environment when no editor is used. A `GIT_EDITOR=:` exported by the user looks identical but Git still treats the message as edited.
- The default cleanup is `strip` with an editor and `whitespace` without one. A hook cannot see `--cleanup`, `--verbose`, `--allow-empty-message`, `--amend`, `-a`, or paths.
- `MERGE_HEAD` exists while a merge commit is created. `HEAD` does not exist before the initial commit.
- The hook runs in the top-level directory of the working tree. `$1` is relative in the main working tree and absolute in linked worktrees.
- Git redirects the hook's stdout to stderr and connects stdin to `/dev/null`.
- After a rejected commit, `.git/COMMIT_EDITMSG` still holds the message.

## When to use more than one agent

Fan out only for broad, independent scenario sweeps (for example one agent per group of scenarios above, plus adversarial verification of each finding). Give every agent the setup above and tell it to compare against the real client. Reviews that only read the diff found few of the real defects.
