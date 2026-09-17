import { vi } from "vitest"

vi.mock(import("#utilities/logging/Logger.ts"), () => ({
	printMessage: vi.fn(() => {
		// Do nothing.
	}),
	printCommandLineError: vi.fn(() => {
		// Do nothing.
	}),
	printCommandLineWarning: vi.fn(() => {
		// Do nothing.
	}),
	printGithubActionsError: vi.fn(() => {
		// Do nothing.
	}),
	printGithubActionsWarning: vi.fn(() => {
		// Do nothing.
	}),
}))

export function mockLogger(): void {
	// Do nothing, but importing this file triggers `vi.mock()` above as a side effect.
}
