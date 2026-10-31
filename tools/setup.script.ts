import { runCommand } from "#utilities/commands/RunCommand.ts"
import { copyDirectory } from "#utilities/files/Files.ts"

// Run the commands sequentially to prevent their console outputs from interleaving with each other.
await installDependencies()
await installGitHooks()
await generateIntellijIdeaProject()

async function installDependencies(): Promise<void> {
	await runCommand("vpr", "install")
}

async function installGitHooks(): Promise<void> {
	await copyDirectory("tools/hooks/", ".vite-hooks/")
	await runCommand("vp", "hooks", "enable")
}

async function generateIntellijIdeaProject(): Promise<void> {
	await copyDirectory("tools/idea/", ".idea/")
}
