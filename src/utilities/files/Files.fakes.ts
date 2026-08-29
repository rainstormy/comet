import { beforeEach, vi } from "vitest"
import type { JsonValue, JsonValueFrom } from "#types/JsonValue.ts"

vi.mock(import("#utilities/files/Files.ts"), () => ({
	isReadableFile: vi.fn(async (path) => contentsByPath.has(path)),
	readJsonFile: vi.fn(async (path) => {
		const content = contentsByPath.get(path) ?? null

		if (content === null) {
			throw new Error(`Failed to read ${path}: File not found`)
		}

		return content
	}),
}))

const contentsByPath = new Map<string, JsonValue>()

export function mockFiles(): void {
	beforeEach(() => {
		contentsByPath.clear()
	})
}

export function mockFile(path: string, content: string): void {
	contentsByPath.set(path, content)
}

export function mockJsonFile<Content = JsonValue>(
	path: string,
	content: JsonValueFrom<Content>,
): void {
	contentsByPath.set(path, content)
}

export function mockNonexistingFile(path: string): void {
	contentsByPath.delete(path)
}
