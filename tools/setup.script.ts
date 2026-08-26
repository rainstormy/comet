import { spawn } from "node:child_process"
import { cp as copyFiles, mkdir as createDirectory } from "node:fs/promises"
import { resolve as resolvePath } from "node:path"

// Run the commands sequentially to prevent their console outputs from interleaving with each other.
await installDependencies()
await installGitHooks()
await generateIntellijIdeaProject()

async function installDependencies(): Promise<void> {
	await runCommand("vpr", ["install"])
}

async function installGitHooks(): Promise<void> {
	await copyDirectory("tools/hooks/", ".vite-hooks/")
	await runCommand("vp", ["hooks", "enable"])
}

async function generateIntellijIdeaProject(): Promise<void> {
	await copyDirectory("tools/idea/", ".idea/")
}

async function copyDirectory(
	relativeSourcePath: string,
	relativeDestinationPath: string,
): Promise<void> {
	const projectDirectory = resolvePath(import.meta.dirname, "..")
	const sourcePath = resolvePath(projectDirectory, relativeSourcePath)
	const destinationPath = resolvePath(projectDirectory, relativeDestinationPath)

	await createDirectory(destinationPath, { recursive: true })
	await copyFiles(sourcePath, destinationPath, { recursive: true })
}

async function runCommand(command: string, args: Array<string>): Promise<void> {
	return new Promise((resolve, reject) => {
		const childProcess = spawn(command, args, { stdio: "inherit" })

		childProcess.on("close", (exitCode) => {
			if (exitCode === 0) {
				resolve()
				return
			}

			reject(new Error(`Command '${command} ${args.join(" ")}' exited with code ${exitCode}`))
		})
		childProcess.on("error", reject)
	})
}
