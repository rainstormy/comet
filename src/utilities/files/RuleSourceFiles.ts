import { readFile, readdir } from "node:fs/promises"
import { basename, join, resolve } from "node:path"
import { DEFAULT_RULESET_CONFIGURATION } from "#configurations/defaults/DefaultRulesetConfiguration.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { decapitalise } from "#utilities/Strings.ts"

export type RuleSourceFile = {
	/**
	 * The camelCase rule name, e.g. `noSquashMarkers` or `useImperativeSubjects`.
	 */
	name: RuleKey

	/**
	 * The JSDoc comment above the rule function without the leading asterisks `*`.
	 */
	docs: string
}

const RULE_SOURCE_DIRECTORY = resolve(import.meta.dirname, "../../rules")

export async function readRuleSourceFiles(): Promise<Array<RuleSourceFile>> {
	const entries = await readdir(RULE_SOURCE_DIRECTORY)
	const filenames = entries.filter(isRuleSourceFilename).toSorted()

	return Promise.all(filenames.map(readRuleSourceFile))
}

function isRuleSourceFilename(filename: string): boolean {
	return (
		(filename.startsWith("No") || filename.startsWith("Use")) &&
		filename.endsWith(".ts") &&
		!filename.endsWith(".tests.ts")
	)
}

async function readRuleSourceFile(filename: string): Promise<RuleSourceFile> {
	const name = decapitalise(basename(filename, ".ts"))

	if (!isRuleKey(name)) {
		throw new Error(`Invalid rule key '${name}' in '${filename}'`)
	}

	const sourcePath = join(RULE_SOURCE_DIRECTORY, filename)
	const sourceCode = await readFile(sourcePath, "utf8")

	return { name, docs: extractDocs(sourcePath, sourceCode) }
}

function isRuleKey(name: string): name is RuleKey {
	return Object.hasOwn(DEFAULT_RULESET_CONFIGURATION, name)
}

function extractDocs(sourcePath: string, sourceCode: string): string {
	const docsStartIndex = sourceCode.indexOf("/**\n")
	const docsEndIndex = sourceCode.indexOf("\n */\nexport function* ")

	if (docsStartIndex === -1 || docsEndIndex === -1) {
		throw new Error(`Missing rule docs in '${sourcePath}'`)
	}

	const docs = sourceCode.slice(docsStartIndex + "/**\n".length, docsEndIndex)
	return docs
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
}
