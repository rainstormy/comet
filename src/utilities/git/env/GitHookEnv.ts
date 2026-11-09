import process from "node:process"

/**
 * Determines whether Git has opened an editor to let the user edit the commit message.
 *
 * Git sets `GIT_EDITOR=:` in the environment of the `commit-msg` hook when it does not open an editor,
 * e.g. for `git commit --message`, `git commit --file`, `git commit --no-edit`, and `git merge`.
 *
 * Caveat: A `GIT_EDITOR=:` exported by the user (e.g. `GIT_EDITOR=: git commit --amend`) is indistinguishable from the one set by Git,
 * even though Git considers the message to be edited in that case.
 */
export function isGitEditorInUse(): boolean {
	return process.env.GIT_EDITOR !== ":"
}
