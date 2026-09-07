import { writeFile } from "node:fs/promises"
import { toJsonSchema } from "@valibot/to-json-schema"
import { JSON_CONFIGURATION_DTO } from "#configurations/json/dtos/JsonConfigurationDto.ts"

await generateJsonSchema("dist/schema.json")

export async function generateJsonSchema(destinationPath: string): Promise<void> {
	const output = JSON.stringify(toJsonSchema(JSON_CONFIGURATION_DTO))
	await writeFile(destinationPath, output, "utf8")
}
