import { readFile, writeFile } from "node:fs/promises"
import { resolve as resolvePath } from "node:path"
import { getCommitSha } from "#utilities/git/cli/GetCommitSha.ts"
import { extractSemanticVersion } from "#utilities/SemanticVersion.ts"

const args = process.argv.slice(2)
await updateReadme(args[0] ?? "")

async function updateReadme(targetVersion: string): Promise<void> {
	const readmePath = resolvePath(import.meta.dirname, "..", "README.md")

	let content = await readFile(readmePath, "utf8")
	content = await updateVersionReferences(content, targetVersion)

	await writeFile(readmePath, content, "utf8")
}

async function updateVersionReferences(content: string, targetVersion: string): Promise<string> {
	if (targetVersion === "") {
		return content
	}

	const version = extractSemanticVersion(targetVersion)
	const tag = `v${version}` as const
	const commitSha = await getCommitSha(tag)

	const commitShaReference = /\b(?<prefix>rainstormy\/comet@)[0-9a-f]{40}\b/gu
	const semverReference =
		/\b(?<prefix>rainstormy\/comet@|(?<=rainstormy\/comet.*)v)(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9a-z.-]*)?\b/gu

	return content
		.replace(commitShaReference, `$<prefix>${commitSha}`)
		.replace(semverReference, `$<prefix>${version}`)
}
