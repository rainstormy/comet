import { beforeEach, vi } from "vitest"
import type { JsonValue } from "#types/JsonValue.ts"

vi.mock(import("#utilities/files/Files.ts"), () => ({
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

export function mockJsonFile(path: string, content: JsonValue): void {
	contentsByPath.set(path, content)
}

export function mockNonexistingFile(path: string): void {
	contentsByPath.delete(path)
}
