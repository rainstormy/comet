import { access, constants, cp, mkdir, readFile } from "node:fs/promises"
import { dirname, extname, isAbsolute, normalize, relative, resolve } from "node:path"
import process from "node:process"
import stripJsonComments from "strip-json-comments"
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

export function normalisePath(path: string, relativeTo?: string): string {
	if (isAbsolute(path)) {
		return normalize(path)
	}

	const resolvedPath = relativeTo !== undefined ? resolve(dirname(relativeTo), path) : path
	return normalize(relative(process.cwd(), resolvedPath))
}

export async function readJsonFile(path: string): Promise<JsonValue> {
	try {
		const content = await readFile(path, "utf8")
		return JSON.parse(stripCommentsFromJsonc(path, content))
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new TypeError(`Failed to parse '${path}' as JSON: ${error.message}`, { cause: error })
		}

		assertError(error)
		throw new Error(`Failed to read '${path}': ${error.message}`, { cause: error })
	}
}

function stripCommentsFromJsonc(path: string, content: string): string {
	return extname(path) === ".jsonc" ? stripJsonComments(content) : content
}

export async function copyDirectory(
	relativeSourcePath: string,
	relativeDestinationPath: string,
): Promise<void> {
	const projectDirectory = resolve(import.meta.dirname, "../../..")
	const sourcePath = resolve(projectDirectory, relativeSourcePath)
	const destinationPath = resolve(projectDirectory, relativeDestinationPath)

	await mkdir(destinationPath, { recursive: true })
	await cp(sourcePath, destinationPath, { recursive: true })
}
