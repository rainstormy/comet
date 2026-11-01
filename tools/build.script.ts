import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { toJsonSchema } from "@valibot/to-json-schema"
import { JSON_CONFIGURATION_DTO } from "#configurations/json/dtos/JsonConfigurationDto.ts"
import { type RuleSourceFile, readRuleSourceFiles } from "#utilities/files/RuleSourceFiles.ts"
import { capitalise } from "#utilities/Strings.ts"

await Promise.all([generateJsonSchema("dist/schema.json"), generateRuleDocs("docs/rules/")])

async function generateJsonSchema(destination: string): Promise<void> {
	const output = JSON.stringify(toJsonSchema(JSON_CONFIGURATION_DTO))
	await writeFile(destination, output, "utf8")
}

async function generateRuleDocs(destination: string): Promise<void> {
	await mkdir(destination, { recursive: true })

	const sources = await readRuleSourceFiles()
	await Promise.all(sources.map(async (source) => generateRuleDoc(source, destination)))
}

async function generateRuleDoc(source: RuleSourceFile, destination: string): Promise<void> {
	const destinationPath = join(destination, `${capitalise(source.name)}.md`)
	const output = `# ${source.name}\n\n${source.docs}\n`

	await writeFile(destinationPath, output, "utf8")
}
