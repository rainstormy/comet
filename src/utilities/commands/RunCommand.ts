import { spawn } from "node:child_process"
import { CommandError } from "#utilities/commands/CommandError.ts"

export async function runCommand(program: string, ...args: Array<string>): Promise<string> {
	return new Promise((resolve, reject) => {
		let stdout = ""
		let stderr = ""

		const childProcess = spawn(program, args)

		childProcess.stdout.on("data", (data) => {
			stdout += data.toString()
		})

		childProcess.stderr.on("data", (data) => {
			stderr += data.toString()
		})

		childProcess.on("close", (exitCode) => {
			if (exitCode === 0) {
				resolve(stdout.trim())
			} else {
				// This case occurs when the command raises an error with a non-zero exit code.
				reject(new CommandError({ program, args, exitCode: exitCode ?? -1, stderr }))
			}
		})

		childProcess.on("error", (error) => {
			// This case occurs when the process cannot be spawned, e.g. if the program is not installed.
			reject(new CommandError({ program, args, exitCode: -1, cause: error }))
		})
	})
}
