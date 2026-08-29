import { beforeEach, vi } from "vitest"
import type { JsonValue, JsonValueFrom } from "#types/JsonValue.ts"
import { trimPrefix } from "#utilities/Strings.ts"

vi.mock(import("#utilities/files/Files.ts"), () => ({
	isReadableFile: vi.fn(async (path: string): Promise<boolean> => contentsByPath.has(path)),
	normalisePath: vi.fn((path: string): string => trimPrefix(path, "./")),
	readJsonFile: vi.fn(async (path: string): Promise<JsonValue> => {
		const content = contentsByPath.get(path) ?? null

		if (content === null) {
			throw new Error(`Failed to read '${path}': File not found`)
		}

		try {
			return JSON.parse(content)
		} catch (error) {
			if (error instanceof SyntaxError) {
				throw new TypeError(`Failed to parse '${path}' as JSON: ${error.message}`, { cause: error })
			}
			throw error
		}
	}),
}))

const contentsByPath = new Map<string, string>()

export function mockFiles(): void {
	beforeEach(() => {
		contentsByPath.clear()
	})
}

export function mockFile(path: string, content: string): void {
	contentsByPath.set(trimPrefix(path, "./"), content)
}

export function mockJsonFile<Content = JsonValue>(
	path: string,
	content: JsonValueFrom<Content>,
): void {
	contentsByPath.set(trimPrefix(path, "./"), JSON.stringify(content))
}

export function mockNonexistingFile(path: string): void {
	contentsByPath.delete(path)
}
