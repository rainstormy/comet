import { readFile, readdir, writeFile } from "node:fs/promises"
import { basename, join as joinPath } from "node:path"
import { toJsonSchema } from "@valibot/to-json-schema"
import { JSON_CONFIGURATION_DTO } from "#configurations/json/dtos/JsonConfigurationDto.ts"
import { decapitalise } from "#utilities/Strings.ts"

await Promise.all([
	generateJsonSchema({ destination: "dist/schema.json" }),
	generateRuleDocs({ source: "src/rules/", destination: "docs/rules/" }),
])

async function generateJsonSchema(options: { destination: string }): Promise<void> {
	const output = JSON.stringify(toJsonSchema(JSON_CONFIGURATION_DTO))
	await writeFile(options.destination, output, "utf8")
}

async function generateRuleDocs(options: { source: string; destination: string }): Promise<void> {
	const sourceEntries = await readdir(options.source)
	await Promise.all(
		sourceEntries
			.filter(isRuleSourceFile)
			.map(async (filename) => generateRuleDoc(filename, options)),
	)
}

function isRuleSourceFile(entry: string): boolean {
	return (
		(entry.startsWith("No") || entry.startsWith("Use")) &&
		entry.endsWith(".ts") &&
		!entry.endsWith(".tests.ts")
	)
}

async function generateRuleDoc(
	filename: string,
	options: { source: string; destination: string },
): Promise<void> {
	const ruleName = basename(filename, ".ts")
	const sourcePath = joinPath(options.source, filename)
	const destinationPath = joinPath(options.destination, `${ruleName}.md`)

	const sourceCode = await readFile(sourcePath, "utf8")

	const docsStartIndex = sourceCode.indexOf("/**\n") + "/**\n".length
	const docsEndIndex = sourceCode.indexOf("\n */\nexport function* ")

	if (docsStartIndex === -1 || docsEndIndex === -1) {
		throw new Error(`Missing rule docs in '${sourcePath}'`)
	}

	const sourceDocs = sourceCode.slice(docsStartIndex, docsEndIndex)
	const transformedDocs = sourceDocs
		.split("\n")
		.map((line) => {
			if (line.startsWith(" * ")) {
				return line.slice(" * ".length)
			}
			if (line.startsWith(" *")) {
				return line.slice(" *".length)
			}
			throw new Error(`Rule docs syntax error in '${sourcePath}':\n'${line}'`)
		})
		.join("\n")
	const output = `# ${decapitalise(ruleName)}\n\n${transformedDocs}\n`

	await writeFile(destinationPath, output, "utf8")
}
