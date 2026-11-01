import { readFile, writeFile } from "node:fs/promises"
import { resolve as resolvePath } from "node:path"
import { DEFAULT_COMMAND_LINE_CONFIGURATION } from "#configurations/defaults/DefaultCommandLineConfiguration.ts"
import { DEFAULT_GITHUB_ACTIONS_CONFIGURATION } from "#configurations/defaults/DefaultGithubActionsConfiguration.ts"
import { runCommand } from "#utilities/commands/RunCommand.ts"
import { type RuleSourceFile, readRuleSourceFiles } from "#utilities/files/RuleSourceFiles.ts"
import { getCommitSha } from "#utilities/git/cli/GetCommitSha.ts"
import { extractSemanticVersion } from "#utilities/SemanticVersion.ts"
import { capitalise } from "#utilities/Strings.ts"

const args = process.argv.slice(2)
await updateReadme(args[0] ?? "")

async function updateReadme(targetVersion: string): Promise<void> {
	const readmePath = resolvePath(import.meta.dirname, "..", "README.md")

	let content = await readFile(readmePath, "utf8")
	content = await updateVersionReferences(content, targetVersion)
	content = await updateRulesTable(content)

	await writeFile(readmePath, content, "utf8")
	await runCommand("vp", "fmt", readmePath)
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

async function updateRulesTable(content: string): Promise<string> {
	const sources = await readRuleSourceFiles()

	const ruleTable = /^\| Name .*\n(?:\|.*\n)+/mu

	// Use a replacer function so that `$` characters in the table are not interpreted as replacement patterns.
	return content.replace(ruleTable, () => formatRuleTable(sources))
}

function formatRuleTable(sources: Array<RuleSourceFile>): string {
	return `
| Name | Description | Default |
| ---- | ----------- | ------- |
${sources.map(formatRuleTableRow).join("\n")}
`.trim()
}

function formatRuleTableRow(source: RuleSourceFile): string {
	// The description is the first line of the rule docs.
	const [description = ""] = source.docs.split("\n")

	const defaultSymbols: Array<string> = []

	if (DEFAULT_GITHUB_ACTIONS_CONFIGURATION.rules[source.name].level !== "off") {
		defaultSymbols.push("![GitHub Actions](docs/assets/github.svg)")
	}
	if (DEFAULT_COMMAND_LINE_CONFIGURATION.rules[source.name].level !== "off") {
		defaultSymbols.push("![Command-line](docs/assets/commandline.svg)")
	}

	return `| [\`${source.name}\`](docs/rules/${capitalise(source.name)}.md) | ${description} | ${defaultSymbols.join(" ")} |`
}
