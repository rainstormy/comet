import { readFile, writeFile } from "node:fs/promises"
import { resolve as resolvePath } from "node:path"
import { runGitCommand } from "#utilities/git/cli/RunGitCommand.ts"
import { trimPrefix } from "#utilities/Strings.ts"

const args = process.argv.slice(2)

await updateReadme(args[0] ?? "")

async function updateReadme(targetVersion: string): Promise<void> {
	const version = extractSemanticVersion(targetVersion)
	const tag = `v${version}` as const
	const commitSha = await getCommitSha(tag)

	const projectDirectory = resolvePath(import.meta.dirname, "..")
	const readmePath = resolvePath(projectDirectory, "README.md")

	const readmeContent = await readFile(readmePath, "utf8")

	const commitShaReference = /\b(?<prefix>rainstormy\/comet@)[0-9a-f]{40}\b/gu
	const semverReference =
		/\b(?<prefix>rainstormy\/comet@|(?<=rainstormy\/comet.*)v)(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9a-z.-]*)?\b/gu

	const updatedReadmeContent = readmeContent
		.replace(commitShaReference, `$<prefix>${commitSha}`)
		.replace(semverReference, `$<prefix>${version}`)

	await writeFile(readmePath, updatedReadmeContent, "utf8")
}

function extractSemanticVersion(targetVersion: string): string {
	if (targetVersion === "") {
		throw new Error("No semantic version number provided")
	}
	if (!isSemanticVersion(targetVersion)) {
		throw new Error(`'${targetVersion}' is not a semantic version number`)
	}
	return trimPrefix(targetVersion, "v")
}

function isSemanticVersion(targetVersion: string): boolean {
	const semver = /^v?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9a-z.-]*)?$/u
	return semver.test(targetVersion)
}

async function getCommitSha(tag: `v${string}`): Promise<string> {
	try {
		// Grab the commit SHA with `^{commit}` instead of the annotated tag SHA.
		const commitSha = await runGitCommand(["rev-parse", "--verify", `refs/tags/${tag}^{commit}`])
		await runGitCommand(["merge-base", "--is-ancestor", commitSha, "main"])

		return commitSha
	} catch (error) {
		throw new Error(`'${tag}' does not exist on the 'main' branch`, { cause: error })
	}
}
