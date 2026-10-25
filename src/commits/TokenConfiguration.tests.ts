import { describe, expect, it } from "vitest"
import { sanitiseTokenConfiguration } from "#commits/TokenConfiguration.ts"

describe("a sanitised token configuration", () => {
	it("removes excess whitespace from issue link prefixes and wildcards", () => {
		const configuration = sanitiseTokenConfiguration({
			issueLinks: {
				prefixes: [" COMET- ", "COMET-", "  "],
				wildcards: [" [incident] ", "[incident]", " "],
			},
		})

		expect(configuration).toEqual({
			issueLinks: {
				prefixes: ["COMET-"],
				wildcards: ["[incident]"],
			},
		})
	})
})
