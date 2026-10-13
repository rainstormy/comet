import { vi } from "vitest"
// oxlint-disable-next-line no-restricted-imports -- Match the `package.json` import in `Package.ts`.
import packagejson from "../../../package.json" with { type: "json" }

export function mockPackageVersion(version: string): void {
	vi.spyOn(packagejson, "version", "get").mockReturnValue(version)
}
