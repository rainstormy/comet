import { spawn } from "node:child_process"
import { GitCommandError } from "#utilities/git/cli/GitCommandError.ts"

export type GitCommand =
	| ["--no-pager", "log", ...Array<string>]
	| ["fetch", ...Array<string>]
	| ["remote", ...Array<string>]
	| ["rev-parse", ...Array<string>]

export async function runGitCommand(args: GitCommand): Promise<string> {
	return new Promise((resolve, reject) => {
		let stdout = ""
		let stderr = ""

		const git = spawn("git", args)

		git.stdout.on("data", (data) => {
			stdout += data.toString()
		})

		git.stderr.on("data", (data) => {
			stderr += data.toString()
		})

		git.on("close", (exitCode) => {
			if (exitCode === 0) {
				resolve(stdout.trim())
			} else {
				// This case occurs when Git raises an error with a non-zero exit code.
				reject(new GitCommandError({ args, exitCode: exitCode ?? -1, stderr }))
			}
		})

		git.on("error", (error) => {
			// This case occurs when the Git process cannot be spawned, e.g. if Git is not installed.
			reject(new GitCommandError({ args, exitCode: -1, cause: error }))
		})
	})
}
