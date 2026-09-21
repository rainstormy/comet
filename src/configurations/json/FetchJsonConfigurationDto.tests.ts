import { beforeEach, describe, expect, it } from "vitest"
import type { JsonConfigurationDto } from "#configurations/json/dtos/JsonConfigurationDto.ts"
import { fetchJsonConfigurationDto } from "#configurations/json/FetchJsonConfigurationDto.ts"
import { mockJsonFile } from "#utilities/files/Files.fakes.ts"

const path = "comet.json"

describe("a configuration file with a Git default branch", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>(path, {
			git: { defaultBranch: "origin/main" },
		})
	})

	it("returns the configured Git options", async () => {
		const dto = await fetchJsonConfigurationDto(path)
		expect(dto).toEqual({ git: { defaultBranch: "origin/main" } })
	})
})
