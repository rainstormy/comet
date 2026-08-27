import { access as accessFile, readFile } from "node:fs/promises"
import type { JsonValue } from "#types/JsonValue.ts"
import { assertError } from "#utilities/Assertions.ts"

export async function isReadableFile(path: string): Promise<boolean> {
	try {
		await accessFile(path)
		return true
	} catch {
		return false
	}
}

export async function readJsonFile(path: string): Promise<JsonValue> {
	try {
		const content = await readFile(path, "utf8")
		return JSON.parse(content)
	} catch (error) {
		assertError(error)
		throw new Error(`Failed to read ${path}: ${error.message}`, { cause: error })
	}
}
