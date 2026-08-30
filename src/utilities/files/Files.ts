import { access, constants, readFile } from "node:fs/promises"
import { isAbsolute, normalize, resolve } from "node:path"
import process from "node:process"
import type { JsonValue } from "#types/JsonValue.ts"
import { assertError } from "#utilities/Assertions.ts"

export async function isReadableFile(path: string): Promise<boolean> {
	try {
		await access(path, constants.R_OK)
		return true
	} catch {
		return false
	}
}

export function normalisePath(path: string): string {
	return normalize(isAbsolute(path) ? path : resolve(process.cwd(), path))
}

export async function readJsonFile(path: string): Promise<JsonValue> {
	try {
		const content = await readFile(path, "utf8")
		return JSON.parse(content)
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new TypeError(`Failed to parse '${path}' as JSON: ${error.message}`, { cause: error })
		}

		assertError(error)
		throw new Error(`Failed to read '${path}': ${error.message}`, { cause: error })
	}
}
