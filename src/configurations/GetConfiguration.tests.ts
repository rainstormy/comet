import { beforeEach, describe, expect, it } from "vitest"
import { type Configuration, getConfiguration } from "#configurations/GetConfiguration.ts"
import type { JsonConfigurationDto } from "#configurations/json/dtos/JsonConfigurationDto.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import type { JsonObject } from "#types/JsonValue.ts"
import { mockFile, mockJsonFile, mockNonexistingFile } from "#utilities/files/Files.fakes.ts"
import type { DeepPartial, DeepRequired } from "#utilities/Objects.ts"

const path = "comet.json"
const jsoncPath = "comet.jsonc"

describe("a configuration file with an empty object", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>(path, {})
	})

	it("falls back to the default configuration", async () => {
		const configuration = await getConfiguration(path)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			tokens: {},
			rules: {},
		})
	})
})

describe("a configuration file with metadata fields only", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto & { $schema: string }>(path, {
			$schema: "https://example.com/schema.json",
		})
	})

	it("falls back to the default configuration", async () => {
		const configuration = await getConfiguration(path)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			tokens: {},
			rules: {},
		})
	})
})

describe("a configuration file with GitHub-/GitLab-style issue link tokens", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>(path, {
			tokens: {
				issueLinks: {
					prefixes: ["#", "GH-", "GL-"],
				},
			},
		})
	})

	it("returns the configured tokens", async () => {
		const configuration = await getConfiguration(path)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			tokens: {
				issueLinks: {
					prefixes: ["#", "GH-", "GL-"],
					wildcards: [],
				},
			},
			rules: {},
		})
	})
})

describe("a configuration file with Jira-style issue link tokens", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>(path, {
			tokens: {
				issueLinks: {
					prefixes: ["UNICORN-"],
					wildcards: ["[incident]", "*"],
				},
			},
		})
	})

	it("returns the configured tokens", async () => {
		const configuration = await getConfiguration(path)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			tokens: {
				issueLinks: {
					prefixes: ["UNICORN-"],
					wildcards: ["[incident]", "*"],
				},
			},
			rules: {},
		})
	})
})

describe("a configuration file with some rules configured as 'error'", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>(path, {
			rules: {
				noBlankSubjectLines: "error",
				noMergeCommits: "error",
				useConciseSubjectLines: "error",
				useImperativeSubjectLines: "error",
			},
		})
	})

	it("returns the configured ruleset", async () => {
		const configuration = await getConfiguration(path)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			rules: {
				noBlankSubjectLines: { level: "error" },
				noMergeCommits: { level: "error" },
				useConciseSubjectLines: { level: "error" },
				useImperativeSubjectLines: { level: "error" },
			},
			tokens: {},
		})
	})
})

describe("a configuration file with some rules configured as 'off'", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>(path, {
			rules: {
				noExcessiveCommitsPerBranch: "off",
				noRepeatedSubjectLines: "off",
				useCapitalisedSubjectLines: "off",
				useLineWrapping: "off",
			},
		})
	})

	it("returns the configured ruleset", async () => {
		const configuration = await getConfiguration(path)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			rules: {
				noExcessiveCommitsPerBranch: { level: "off" },
				noRepeatedSubjectLines: { level: "off" },
				useCapitalisedSubjectLines: { level: "off" },
				useLineWrapping: { level: "off" },
			},
			tokens: {},
		})
	})
})

describe("a configuration file with some rules configured as objects", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>(path, {
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 7 },
				},
				noRepeatedSubjectLines: {
					level: "error",
					options: {},
				},
				useAuthorEmailPatterns: {
					level: "error",
					options: { patterns: [String.raw`.+@users\.noreply\.github\.com`] },
				},
				useSignedCommits: {
					level: "error",
					options: {},
				},
			},
		})
	})

	it("returns the configured ruleset", async () => {
		const configuration = await getConfiguration(path)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 7 },
				},
				noRepeatedSubjectLines: {
					level: "error",
					options: {},
				},
				useAuthorEmailPatterns: {
					level: "error",
					options: { patterns: [String.raw`.+@users\.noreply\.github\.com`] },
				},
				useSignedCommits: {
					level: "error",
					options: {},
				},
			},
			tokens: {},
		})
	})
})

describe.each`
	ruleKey                          | options
	${"noExcessiveCommitsPerBranch"} | ${{ maxCommits: 8 }}
	${"noRestrictedTrailers"}        | ${{ restrictedKeys: ["Co-authored-by", "Reviewed-by"] }}
	${"useAuthorEmailPatterns"}      | ${{ patterns: [String.raw`.+@example\.com`, String.raw`.+@users\.noreply\.github\.com`] }}
	${"useAuthorNamePatterns"}       | ${{ patterns: ["Ada Lovelace", String.raw`Grace .+`] }}
	${"useCommitterEmailPatterns"}   | ${{ patterns: [String.raw`automation@.+\.dev`] }}
	${"useCommitterNamePatterns"}    | ${{ patterns: ["Release Robot", String.raw`Dependabot .+`] }}
	${"useConciseSubjectLines"}      | ${{ maxLength: 64 }}
	${"useImperativeSubjectLines"}   | ${{ whitelist: ["Revert", "Release"] }}
	${"useIssueLinks"}               | ${{ position: "anywhere" }}
	${"useIssueLinks"}               | ${{ position: "prefix" }}
	${"useIssueLinks"}               | ${{ position: "suffix" }}
	${"useLineWrapping"}             | ${{ maxLength: 80 }}
`(
	"a configuration file with valid options of $ruleKey",
	(props: { ruleKey: RuleKey; options: JsonObject }) => {
		beforeEach(() => {
			mockJsonFile<JsonConfigurationDto>(path, {
				rules: {
					[props.ruleKey]: { level: "error", options: props.options },
				},
			})
		})

		it("returns the configured ruleset", async () => {
			const configuration = await getConfiguration(path)
			expect(configuration).toEqual<DeepPartial<Configuration>>({
				rules: {
					[props.ruleKey]: { level: "error", options: props.options },
				},
				tokens: {},
			})
		})
	},
)

describe("a configuration file with a mixed ruleset of valid options", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>(path, {
			rules: {
				noBlankSubjectLines: "off",
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 5 },
				},
				useConciseSubjectLines: "error",
				useImperativeSubjectLines: {
					level: "error",
					options: { whitelist: ["chatify"] },
				},
				useSignedCommits: {
					level: "off",
					options: {},
				},
			},
		})
	})

	it("returns the configured ruleset", async () => {
		const configuration = await getConfiguration(path)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			rules: {
				noBlankSubjectLines: { level: "off" },
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 5 },
				},
				useConciseSubjectLines: { level: "error" },
				useImperativeSubjectLines: {
					level: "error",
					options: { whitelist: ["chatify"] },
				},
				useSignedCommits: {
					level: "off",
					options: {},
				},
			},
			tokens: {},
		})
	})
})

describe("a complete configuration file", () => {
	beforeEach(() => {
		mockJsonFile<Omit<DeepRequired<JsonConfigurationDto>, "extends"> & { $schema: string }>(path, {
			$schema: "https://example.com/schema.json",
			rules: {
				noBlankSubjectLines: "error",
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 7 },
				},
				noExcessiveWhitespace: {
					level: "off",
					options: {},
				},
				noMergeCommits: "off",
				noRepeatedSubjectLines: "error",
				noRestrictedTrailers: {
					level: "error",
					options: { restrictedKeys: ["Co-authored-by"] },
				},
				noRevertRevertCommits: "off",
				noSingleWordSubjectLines: {
					level: "error",
					options: {},
				},
				noSquashMarkers: "error",
				noUnexpectedPunctuation: "off",
				useAuthorEmailPatterns: {
					level: "error",
					options: { patterns: [String.raw`.+@example\.com`] },
				},
				useAuthorNamePatterns: {
					level: "error",
					options: { patterns: ["Ada Lovelace"] },
				},
				useCapitalisedSubjectLines: "error",
				useCommitterEmailPatterns: {
					level: "off",
					options: { patterns: [String.raw`automation@.+\.dev`] },
				},
				useCommitterNamePatterns: {
					level: "off",
					options: { patterns: ["Release Robot"] },
				},
				useConciseSubjectLines: {
					level: "error",
					options: { maxLength: 64 },
				},
				useEmptyLineBeforeBodyLines: "off",
				useImperativeSubjectLines: {
					level: "error",
					options: { whitelist: ["Revert"] },
				},
				useIssueLinks: {
					level: "error",
					options: { position: "prefix" },
				},
				useLineWrapping: {
					level: "off",
					options: { maxLength: 80 },
				},
				useSignedCommits: "error",
			},
			tokens: {
				issueLinks: {
					prefixes: ["#", "GH-"],
					wildcards: ["*", "[incident]"],
				},
			},
		})
	})

	it("returns the configured tokens and ruleset", async () => {
		const configuration = await getConfiguration(path)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			rules: {
				noBlankSubjectLines: { level: "error" },
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 7 },
				},
				noExcessiveWhitespace: { level: "off", options: {} },
				noMergeCommits: { level: "off" },
				noRepeatedSubjectLines: { level: "error" },
				noRestrictedTrailers: {
					level: "error",
					options: { restrictedKeys: ["Co-authored-by"] },
				},
				noRevertRevertCommits: { level: "off" },
				noSingleWordSubjectLines: { level: "error", options: {} },
				noSquashMarkers: { level: "error" },
				noUnexpectedPunctuation: { level: "off" },
				useAuthorEmailPatterns: {
					level: "error",
					options: { patterns: [String.raw`.+@example\.com`] },
				},
				useAuthorNamePatterns: {
					level: "error",
					options: { patterns: ["Ada Lovelace"] },
				},
				useCapitalisedSubjectLines: { level: "error" },
				useCommitterEmailPatterns: {
					level: "off",
					options: { patterns: [String.raw`automation@.+\.dev`] },
				},
				useCommitterNamePatterns: {
					level: "off",
					options: { patterns: ["Release Robot"] },
				},
				useConciseSubjectLines: {
					level: "error",
					options: { maxLength: 64 },
				},
				useEmptyLineBeforeBodyLines: { level: "off" },
				useImperativeSubjectLines: {
					level: "error",
					options: { whitelist: ["Revert"] },
				},
				useIssueLinks: {
					level: "error",
					options: { position: "prefix" },
				},
				useLineWrapping: {
					level: "off",
					options: { maxLength: 80 },
				},
				useSignedCommits: { level: "error" },
			},
			tokens: {
				issueLinks: {
					prefixes: ["#", "GH-"],
					wildcards: ["*", "[incident]"],
				},
			},
		})
	})
})

describe("a configuration file that extends another file", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>("base.json", {
			tokens: {
				issueLinks: {
					prefixes: ["BASE-", "SHARED-"],
					wildcards: ["[base]", "[shared]"],
				},
			},
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "off",
					options: { maxCommits: 10 },
				},
				noMergeCommits: "off",
			},
		})
		mockJsonFile<JsonConfigurationDto>(path, {
			extends: "base.json",
			tokens: {
				issueLinks: {
					prefixes: ["SHARED-", "CHILD-"],
					wildcards: ["[shared]", "[child]"],
				},
			},
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 5 },
				},
			},
		})
	})

	it("merges the configurations additively with the nearest scalar values taking precedence", async () => {
		const configuration = await getConfiguration(path)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 5 },
				},
				noMergeCommits: { level: "off" },
			},
			tokens: {
				issueLinks: {
					prefixes: ["BASE-", "SHARED-", "CHILD-"],
					wildcards: ["[base]", "[shared]", "[child]"],
				},
			},
		})
	})
})

describe("a configuration file that extends another file that extends a third file", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>("base.json", {
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "off",
					options: { maxCommits: 10 },
				},
				noMergeCommits: "off",
			},
		})
		mockJsonFile<JsonConfigurationDto>("configs/team.json", {
			extends: "../base.json",
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 5 },
				},
				noRepeatedSubjectLines: "error",
			},
		})
		mockJsonFile<JsonConfigurationDto>(path, {
			extends: "configs/team.json",
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "off",
					options: { maxCommits: 3 },
				},
				noSquashMarkers: "off",
			},
		})
	})

	it("merges the configurations additively with the nearest scalar values taking precedence", async () => {
		const configuration = await getConfiguration(path)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "off",
					options: { maxCommits: 3 },
				},
				noMergeCommits: { level: "off" },
				noRepeatedSubjectLines: { level: "error" },
				noSquashMarkers: { level: "off" },
			},
			tokens: {},
		})
	})
})

describe("a large configuration file that extends another large file", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>("base.json", {
			tokens: {
				issueLinks: {
					prefixes: ["#", "BASE-"],
					wildcards: ["[skip ci]"],
				},
			},
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "off",
					options: { maxCommits: 10 },
				},
				noMergeCommits: "off",
				useAuthorEmailPatterns: {
					level: "error",
					options: { patterns: [String.raw`.+@example\.com`] },
				},
				useIssueLinks: {
					level: "error",
					options: { position: "anywhere" },
				},
			},
		})
		mockJsonFile<JsonConfigurationDto>(path, {
			extends: "base.json",
			tokens: {
				issueLinks: {
					prefixes: ["CHILD-"],
					wildcards: ["*"],
				},
			},
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 5 },
				},
				noRestrictedTrailers: {
					level: "error",
					options: { restrictedKeys: ["Signed-off-by"] },
				},
				useAuthorEmailPatterns: {
					level: "off",
					options: { patterns: [String.raw`.+@contractors\.example\.com`] },
				},
				useIssueLinks: {
					level: "error",
					options: { position: "suffix" },
				},
			},
		})
	})

	it("merges the configurations additively with the nearest scalar values taking precedence", async () => {
		const configuration = await getConfiguration(path)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 5 },
				},
				noMergeCommits: { level: "off" },
				noRestrictedTrailers: {
					level: "error",
					options: { restrictedKeys: ["Signed-off-by"] },
				},
				useAuthorEmailPatterns: {
					level: "off",
					options: {
						patterns: [String.raw`.+@example\.com`, String.raw`.+@contractors\.example\.com`],
					},
				},
				useIssueLinks: {
					level: "error",
					options: { position: "suffix" },
				},
			},
			tokens: {
				issueLinks: {
					prefixes: ["#", "BASE-", "CHILD-"],
					wildcards: ["[skip ci]", "*"],
				},
			},
		})
	})
})

describe("a large configuration file that extends another large file that extends a third large file", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>("base.json", {
			tokens: {
				issueLinks: {
					prefixes: ["#"],
					wildcards: ["[skip ci]"],
				},
			},
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 10 },
				},
				noMergeCommits: "off",
				useAuthorEmailPatterns: {
					level: "error",
					options: { patterns: [String.raw`.+@example\.com`] },
				},
				useIssueLinks: {
					level: "error",
					options: { position: "anywhere" },
				},
			},
		})
		mockJsonFile<JsonConfigurationDto>("configs/team.json", {
			extends: "../base.json",
			tokens: {
				issueLinks: {
					prefixes: ["TEAM-"],
					wildcards: ["[team]"],
				},
			},
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 5 },
				},
				noRepeatedSubjectLines: "error",
				useAuthorEmailPatterns: {
					level: "error",
					options: { patterns: [String.raw`.+@team\.example\.com`] },
				},
				useIssueLinks: {
					level: "error",
					options: { position: "suffix" },
				},
			},
		})
		mockJsonFile<JsonConfigurationDto>(path, {
			extends: "configs/team.json",
			tokens: {
				issueLinks: {
					prefixes: ["PROJECT-"],
					wildcards: ["[release]"],
				},
			},
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "off",
					options: { maxCommits: 3 },
				},
				noSquashMarkers: "off",
				useConciseSubjectLines: {
					level: "error",
					options: { maxLength: 72 },
				},
				useIssueLinks: "off",
			},
		})
	})

	it("merges the configurations additively with the nearest scalar values taking precedence", async () => {
		const configuration = await getConfiguration(path)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "off",
					options: { maxCommits: 3 },
				},
				noMergeCommits: { level: "off" },
				noRepeatedSubjectLines: { level: "error" },
				noSquashMarkers: { level: "off" },
				useAuthorEmailPatterns: {
					level: "error",
					options: {
						patterns: [String.raw`.+@example\.com`, String.raw`.+@team\.example\.com`],
					},
				},
				useConciseSubjectLines: {
					level: "error",
					options: { maxLength: 72 },
				},
				useIssueLinks: {
					level: "off",
					options: { position: "suffix" },
				},
			},
			tokens: {
				issueLinks: {
					prefixes: ["#", "TEAM-", "PROJECT-"],
					wildcards: ["[skip ci]", "[team]", "[release]"],
				},
			},
		})
	})
})

describe("a simple JSONC configuration file with line and block comments", () => {
	beforeEach(() => {
		mockFile(
			jsoncPath,
			// language=json5
			`{
	// Merge commits obscure the changes that introduced a regression.
	"rules": {
		"noMergeCommits": "error",
		/*
		 * This repository has auto-generated commit messages which may exceed the usual width.
		 * Keep this rule disabled until those messages are updated in the tooling.
		 */
		"useLineWrapping": "off"
	}
}`,
		)
	})

	it("returns the configured ruleset", async () => {
		const configuration = await getConfiguration(jsoncPath)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			rules: {
				noMergeCommits: { level: "error" },
				useLineWrapping: { level: "off" },
			},
			tokens: {},
		})
	})
})

describe("a complex JSONC configuration file with line and block comments", () => {
	beforeEach(() => {
		mockFile(
			jsoncPath,
			// language=json5
			`
{
	/**
	 * Configure commit message rules.
	 * https://github.com/rainstormy/comet
	 */
	"$schema": "https://example.com/schema.json",
	"tokens": {
		"issueLinks": {
			"prefixes": ["UNICORN-"]
		}
	},
	"rules": {
		"useSignedCommits": "error", // Company requirement.
		"noBlankSubjectLines": "error",
		"noExcessiveCommitsPerBranch": {
			"level": "error",
			// We've agreed on the limit in our team to keep pull requests small.
			"options": { "maxCommits": 2 }
		},
		"noExcessiveWhitespace": {
			"level": "off",
			"options": { }
		},
		"noMergeCommits": "error",
		"noRepeatedSubjectLines": "error",
		"noRestrictedTrailers": {
			"level": "error",
			"options": { 
				"restrictedKeys": [
					/* Required by company policy to remove affiliation with agents. */
					"Co-authored-by"
				]
			}
		},
		"noRevertRevertCommits": "error",
		"noSingleWordSubjectLines": {
			"level": "error",
			"options": { }
		},
		"noSquashMarkers": "error",
		"noUnexpectedPunctuation": "off",
		"useAuthorEmailPatterns": "off",
		"useAuthorNamePatterns": "off",
		"useCapitalisedSubjectLines": "error",
		"useCommitterEmailPatterns": "off",
		"useCommitterNamePatterns": "off",
		"useConciseSubjectLines": {
			"level": "off", // temporarily disabled
			"options": { "maxLength": 72 }
		},
		"useEmptyLineBeforeBodyLines": "off",
		"useImperativeSubjectLines": {
			"level": "error",
			"options": { "whitelist": ["chatify", "dockerise"] }
		},
		/*"useIssueLinks": {
			"level": "error",
			"options": { "position": "anywhere" }
		},*/
		"useLineWrapping": {
			"level": "off",
			"options": { "maxLength": 80 }
		}
	}
}`,
		)
	})

	it("returns the configured tokens and ruleset", async () => {
		const configuration = await getConfiguration(jsoncPath)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			rules: {
				noBlankSubjectLines: { level: "error" },
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 2 },
				},
				noExcessiveWhitespace: {
					level: "off",
					options: {},
				},
				noMergeCommits: { level: "error" },
				noRepeatedSubjectLines: { level: "error" },
				noRestrictedTrailers: {
					level: "error",
					options: {
						restrictedKeys: ["Co-authored-by"],
					},
				},
				noRevertRevertCommits: { level: "error" },
				noSingleWordSubjectLines: {
					level: "error",
					options: {},
				},
				noSquashMarkers: { level: "error" },
				noUnexpectedPunctuation: { level: "off" },
				useAuthorEmailPatterns: { level: "off" },
				useAuthorNamePatterns: { level: "off" },
				useCapitalisedSubjectLines: { level: "error" },
				useCommitterEmailPatterns: { level: "off" },
				useCommitterNamePatterns: { level: "off" },
				useConciseSubjectLines: {
					level: "off", // temporarily disabled
					options: { maxLength: 72 },
				},
				useEmptyLineBeforeBodyLines: { level: "off" },
				useImperativeSubjectLines: {
					level: "error",
					options: { whitelist: ["chatify", "dockerise"] },
				},
				useLineWrapping: {
					level: "off",
					options: { maxLength: 80 },
				},
				useSignedCommits: { level: "error" },
			},
			tokens: {
				issueLinks: {
					prefixes: ["UNICORN-"],
					wildcards: [],
				},
			},
		})
	})
})

describe("a JSONC configuration file that extends another JSONC configuration file that extends a third JSONC configuration file", () => {
	beforeEach(() => {
		mockFile(
			"base.jsonc",
			// language=json5
			`{
	/* Base policy shared across all projects. */
	"tokens": {
		"issueLinks": {
			"prefixes": ["BASE-", "#"],
			"wildcards": ["[base]", "*"]
		}
	},
	"rules": {
		"noMergeCommits": "off",
		"useAuthorEmailPatterns": {
			"level": "error",
			"options": { "patterns": [".+@example.com"] }
		}
	}
}`,
		)
		mockFile(
			"configs/team.jsonc",
			// language=json5
			`{
	"extends": "../base.jsonc",
	"tokens": {
		"issueLinks": {
			"prefixes": ["TEAM-", "#"],
			"wildcards": ["[team]", "*"]
		}
	},
	"rules": {
		"noMergeCommits": "error",
		"noRepeatedSubjectLines": "error",
		"useAuthorEmailPatterns": {
			"level": "error",
			"options": { "patterns": [".+@team.example.com"] }
		}
	}
}`,
		)
		mockFile(
			jsoncPath,
			// language=json5
			`{
	// Project-specific policy takes precedence over shared policy.
	"extends": "configs/team.jsonc",
	"tokens": {
		"issueLinks": {
			"prefixes": ["PROJECT-", "TEAM-"],
			"wildcards": ["[release]", "[team]"]
		}
	},
	"rules": {
		"noMergeCommits": "off",
		"noSquashMarkers": "off",
		"useAuthorEmailPatterns": {
			"level": "off",
			"options": { "patterns": [".+@project.example.com"] }
		}
	}
}`,
		)
	})

	it("merges the configurations additively with the nearest scalar values taking precedence", async () => {
		const configuration = await getConfiguration(jsoncPath)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			rules: {
				noMergeCommits: { level: "off" },
				noRepeatedSubjectLines: { level: "error" },
				noSquashMarkers: { level: "off" },
				useAuthorEmailPatterns: {
					level: "off",
					options: {
						patterns: [".+@example.com", ".+@team.example.com", ".+@project.example.com"],
					},
				},
			},
			tokens: {
				issueLinks: {
					prefixes: ["BASE-", "#", "TEAM-", "PROJECT-"],
					wildcards: ["[base]", "*", "[team]", "[release]"],
				},
			},
		})
	})
})

describe("a JSONC configuration file that extends a JSON configuration file", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>("base.json", {
			tokens: {
				issueLinks: {
					prefixes: ["JSON-", "SHARED-"],
					wildcards: ["[json]", "[skip ci]"],
				},
			},
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "off",
					options: { maxCommits: 10 },
				},
				noUnexpectedPunctuation: "off",
				useIssueLinks: {
					level: "error",
					options: { position: "anywhere" },
				},
			},
		})
		mockFile(
			jsoncPath,
			// language=json5
			`{
	// JSONC adds project-specific limits to the shared JSON policy.
	"extends": "base.json",
	"tokens": {
		"issueLinks": {
			"prefixes": ["JSONC-", "SHARED-"],
			"wildcards": ["[jsonc]", "[skip ci]"]
		}
	},
	"rules": {
		"noExcessiveCommitsPerBranch": {
			"level": "error",
			"options": { "maxCommits": 5 }
		},
		"useIssueLinks": {
			"level": "error",
			"options": { "position": "suffix" }
		},
		"useLineWrapping": {
			"level": "off",
			"options": { "maxLength": 72 }
		}
	}
}`,
		)
	})

	it("merges the configurations additively with the nearest scalar values taking precedence", async () => {
		const configuration = await getConfiguration(jsoncPath)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			rules: {
				noExcessiveCommitsPerBranch: {
					level: "error",
					options: { maxCommits: 5 },
				},
				noUnexpectedPunctuation: { level: "off" },
				useIssueLinks: {
					level: "error",
					options: { position: "suffix" },
				},
				useLineWrapping: {
					level: "off",
					options: { maxLength: 72 },
				},
			},
			tokens: {
				issueLinks: {
					prefixes: ["JSON-", "SHARED-", "JSONC-"],
					wildcards: ["[json]", "[skip ci]", "[jsonc]"],
				},
			},
		})
	})
})

describe("a JSON configuration file that extends a JSONC configuration file", () => {
	beforeEach(() => {
		mockFile(
			"base.jsonc",
			// language=json5
			`{
	/* JSONC contains the shared policy for the plain JSON project file. */
	"tokens": {
		"issueLinks": {
			"prefixes": ["JSONC-BASE-", "GL-"],
			"wildcards": ["[jsonc-base]", "[incident]"]
		}
	},
	"rules": {
		"noRestrictedTrailers": {
			"level": "error",
			"options": { "restrictedKeys": ["Co-authored-by"] }
		},
		"useAuthorNamePatterns": {
			"level": "error",
			"options": { "patterns": ["Ada Lovelace"] }
		},
		"useSignedCommits": "error"
	}
}`,
		)
		mockJsonFile<JsonConfigurationDto>(path, {
			extends: "base.jsonc",
			tokens: {
				issueLinks: {
					prefixes: ["JSON-", "GL-"],
					wildcards: ["[json]", "[incident]"],
				},
			},
			rules: {
				noRestrictedTrailers: {
					level: "off",
					options: { restrictedKeys: ["Reviewed-by"] },
				},
				noSingleWordSubjectLines: "off",
				useAuthorNamePatterns: "off",
				useSignedCommits: "off",
			},
		})
	})

	it("merges the configurations additively with the nearest scalar values taking precedence", async () => {
		const configuration = await getConfiguration(path)
		expect(configuration).toEqual<DeepPartial<Configuration>>({
			rules: {
				noRestrictedTrailers: {
					level: "off",
					options: { restrictedKeys: ["Co-authored-by", "Reviewed-by"] },
				},
				noSingleWordSubjectLines: { level: "off" },
				useAuthorNamePatterns: {
					level: "off",
					options: { patterns: ["Ada Lovelace"] },
				},
				useSignedCommits: { level: "off" },
			},
			tokens: {
				issueLinks: {
					prefixes: ["JSONC-BASE-", "GL-", "JSON-"],
					wildcards: ["[jsonc-base]", "[incident]", "[json]"],
				},
			},
		})
	})
})

describe("a configuration file with issue link 'prefixes' being a boolean", () => {
	beforeEach(() => {
		mockJsonFile(path, {
			tokens: {
				issueLinks: { prefixes: true },
			},
		})
	})

	it("raises an error", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			"Failed to parse 'comet.json' as a Comet configuration: 'prefixes' of 'issueLinks' must be an array of strings, but it is a boolean: true",
		)
	})
})

describe("a configuration file with issue link 'prefixes' containing invalid items", () => {
	beforeEach(() => {
		mockJsonFile(path, {
			tokens: {
				issueLinks: {
					prefixes: ["#", { key: 10 }, "GH-", false, 11],
				},
			},
		})
	})

	it("raises an error about the first invalid item", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			`Failed to parse 'comet.json' as a Comet configuration: 'prefixes' of 'issueLinks' must be an array of strings, but it contains an object: { "key": 10 }`,
		)
	})
})

describe("a configuration file with issue link 'wildcards' being a string", () => {
	beforeEach(() => {
		mockJsonFile(path, {
			tokens: {
				issueLinks: { wildcards: "*" },
			},
		})
	})

	it("raises an error", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			`Failed to parse 'comet.json' as a Comet configuration: 'wildcards' of 'issueLinks' must be an array of strings, but it is a string: *`,
		)
	})
})

describe("a configuration file with an unknown option in 'issueLinks'", () => {
	beforeEach(() => {
		mockJsonFile(path, {
			tokens: {
				issueLinks: { idunnothisone: ["GG-"] },
			},
		})
	})

	it("raises an error", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			"Failed to parse 'comet.json' as a Comet configuration: 'idunnothisone' is not a valid option of 'issueLinks'",
		)
	})
})

describe("a configuration file with 'issueLinks' being null", () => {
	beforeEach(() => {
		mockJsonFile(path, {
			tokens: {
				issueLinks: null,
			},
		})
	})

	it("raises an error", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			"Failed to parse 'comet.json' as a Comet configuration: 'issueLinks' must be an object, but it is null",
		)
	})
})

describe("a configuration file with some rules configured as 'warn'", () => {
	beforeEach(() => {
		mockJsonFile(path, {
			rules: {
				noBlankSubjectLines: "warn",
				noRepeatedSubjectLines: "off",
				useCapitalisedSubjectLines: "warn",
				useLineWrapping: "error",
				useSignedCommits: "off",
			},
		})
	})

	it("raises an error about the first invalid rule", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			`Failed to parse 'comet.json' as a Comet configuration: 'noBlankSubjectLines' must be 'error', 'off', or an object of 'level' and 'options', but it is a string: warn`,
		)
	})
})

describe("a configuration file with some rules configured as numbers", () => {
	beforeEach(() => {
		mockJsonFile(path, {
			rules: {
				noMergeCommits: 0,
				useCommitterNamePatterns: 1,
				useLineWrapping: "off",
				useSignedCommits: "error",
			},
		})
	})

	it("raises an error about the first invalid rule", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			`Failed to parse 'comet.json' as a Comet configuration: 'noMergeCommits' must be 'error', 'off', or an object of 'level' and 'options', but it is a number: 0`,
		)
	})
})

describe("a configuration file with a rule object that has no level", () => {
	beforeEach(() => {
		mockJsonFile(path, {
			rules: {
				useConciseSubjectLines: { options: {} },
			},
		})
	})

	it("raises an error", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			"Failed to parse 'comet.json' as a Comet configuration: 'level' is missing in 'useConciseSubjectLines'",
		)
	})
})

describe("a configuration file with a rule object that has a level of 'warn'", () => {
	beforeEach(() => {
		mockJsonFile(path, {
			rules: {
				noRevertRevertCommits: { level: "warn", options: {} },
			},
		})
	})

	it("raises an error", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			`Failed to parse 'comet.json' as a Comet configuration: 'level' of 'noRevertRevertCommits' must be 'error' or 'off', but it is a string: warn`,
		)
	})
})

describe("a configuration file with a rule object that has a level being a number", () => {
	beforeEach(() => {
		mockJsonFile(path, {
			rules: {
				useCapitalisedSubjectLines: { level: 0, options: {} },
			},
		})
	})

	it("raises an error", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			"Failed to parse 'comet.json' as a Comet configuration: 'level' of 'useCapitalisedSubjectLines' must be 'error' or 'off', but it is a number: 0",
		)
	})
})

describe("a configuration file with a rule object that has no options", () => {
	beforeEach(() => {
		mockJsonFile(path, {
			rules: {
				noRestrictedTrailers: { level: "error" },
			},
		})
	})

	it("raises an error", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			"Failed to parse 'comet.json' as a Comet configuration: 'options' is missing in 'noRestrictedTrailers'",
		)
	})
})

describe.each`
	ruleKey                          | options                                | expectedError
	${"noExcessiveCommitsPerBranch"} | ${{ maxCommits: -5 }}                  | ${"'maxCommits' of 'noExcessiveCommitsPerBranch' must be a positive integer, but it is a number: -5"}
	${"noRestrictedTrailers"}        | ${{ restrictedKeys: null }}            | ${"'restrictedKeys' of 'noRestrictedTrailers' must be an array of strings, but it is null"}
	${"useAuthorEmailPatterns"}      | ${{ patterns: true }}                  | ${"'patterns' of 'useAuthorEmailPatterns' must be an array of strings, but it is a boolean: true"}
	${"useAuthorNamePatterns"}       | ${{ patterns: 512 }}                   | ${"'patterns' of 'useAuthorNamePatterns' must be an array of strings, but it is a number: 512"}
	${"useCommitterEmailPatterns"}   | ${{ patterns: "hello world" }}         | ${`'patterns' of 'useCommitterEmailPatterns' must be an array of strings, but it is a string: hello world`}
	${"useCommitterNamePatterns"}    | ${{ patterns: { untold: "message" } }} | ${`'patterns' of 'useCommitterNamePatterns' must be an array of strings, but it is an object: { "untold": "message" }`}
	${"useConciseSubjectLines"}      | ${{ maxLength: -5 }}                   | ${"'maxLength' of 'useConciseSubjectLines' must be a positive integer, but it is a number: -5"}
	${"useConciseSubjectLines"}      | ${{}}                                  | ${"'maxLength' of 'useConciseSubjectLines' is missing"}
	${"useImperativeSubjectLines"}   | ${{ whitelist: false }}                | ${"'whitelist' of 'useImperativeSubjectLines' must be an array of strings, but it is a boolean: false"}
	${"useIssueLinks"}               | ${{ position: "middle" }}              | ${`'position' of 'useIssueLinks' must be 'anywhere', 'prefix', or 'suffix', but it is a string: middle`}
	${"useLineWrapping"}             | ${{ maxLength: 1.5 }}                  | ${"'maxLength' of 'useLineWrapping' must be a positive integer, but it is a number: 1.5"}
`(
	"a configuration file with invalid options of $ruleKey",
	(props: { ruleKey: RuleKey; options: JsonObject; expectedError: string }) => {
		beforeEach(() => {
			mockJsonFile(path, {
				rules: {
					[props.ruleKey]: { level: "error", options: props.options },
				},
			})
		})

		it("raises an error", async () => {
			await expect(getConfiguration(path)).rejects.toThrow(
				`Failed to parse 'comet.json' as a Comet configuration: ${props.expectedError}`,
			)
		})
	},
)

describe("a configuration file with a rule object containing invalid items", () => {
	beforeEach(() => {
		mockJsonFile(path, {
			rules: {
				useAuthorEmailPatterns: {
					level: "error",
					options: {
						patterns: [String.raw`.+@example\.com`, 42, false, "hello", 43],
					},
				},
			},
		})
	})

	it("raises an error about the first invalid item", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			"Failed to parse 'comet.json' as a Comet configuration: 'patterns' of 'useAuthorEmailPatterns' must be an array of strings, but it contains a number: 42",
		)
	})
})

describe("a configuration file with a rule object containing an unknown option", () => {
	beforeEach(() => {
		mockJsonFile(path, {
			rules: {
				useEmptyLineBeforeBodyLines: {
					level: "off",
					options: { unknownOption: true },
				},
			},
		})
	})

	it("raises an error", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			"Failed to parse 'comet.json' as a Comet configuration: 'unknownOption' is not a valid option of 'useEmptyLineBeforeBodyLines'",
		)
	})
})

describe("a configuration file with an unknown rule", () => {
	beforeEach(() => {
		mockJsonFile(path, {
			rules: {
				unrecognisedRuleName: "error",
			},
		})
	})

	it("raises an error", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			"Failed to parse 'comet.json' as a Comet configuration: 'unrecognisedRuleName' is not a valid rule",
		)
	})
})

describe("a configuration file that extends a non-existing file", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>(path, { extends: "base.json" })
	})

	it("raises an error", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			"Failed to read 'base.json': File not found",
		)
	})
})

describe("a configuration file that extends another file that extends a non-existing file", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>(path, { extends: "configs/team.json" })
		mockJsonFile<JsonConfigurationDto>("configs/team.json", { extends: "../base.json" })
	})

	it("raises an error", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			"Failed to read 'base.json': File not found",
		)
	})
})

describe("a configuration file that extends another file with an invalid 'extends' field", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>(path, { extends: "base.json" })
		mockJsonFile("base.json", { extends: true })
	})

	it("raises an error", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			"Failed to parse 'base.json' as a Comet configuration: 'extends' must be a string, but it is a boolean: true",
		)
	})
})

describe("a JSON configuration file that extends an invalid JSONC configuration file", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>(path, { extends: "base.jsonc" })
		mockFile(
			"base.jsonc",
			`{
	// The shared policy has not been migrated to the current ruleset yet.
	"rules": 31
}`,
		)
	})

	it("raises the extended configuration error", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			"Failed to parse 'base.jsonc' as a Comet configuration: 'rules' must be an object, but it is a number: 31",
		)
	})
})

describe("a configuration file that extends itself", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>(path, { extends: "./comet.json" })
	})

	it("raises an error", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			"Failed to parse 'comet.json' as a Comet configuration: 'extends' has a cyclic dependency in 'comet.json' -> 'comet.json'",
		)
	})
})

describe("two configuration files that extend each other", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>(path, { extends: "base.json" })
		mockJsonFile<JsonConfigurationDto>("base.json", { extends: "./comet.json" })
	})

	it("raises an error", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			"Failed to parse 'comet.json' as a Comet configuration: 'extends' has a cyclic dependency in 'comet.json' -> 'base.json' -> 'comet.json'",
		)
	})
})

describe("three configuration files that extend each other", () => {
	beforeEach(() => {
		mockJsonFile<JsonConfigurationDto>(path, { extends: "configs/team.json" })
		mockJsonFile<JsonConfigurationDto>("configs/team.json", { extends: "../base.json" })
		mockJsonFile<JsonConfigurationDto>("base.json", { extends: "./comet.json" })
	})

	it("raises an error", async () => {
		await expect(getConfiguration(path)).rejects.toThrow(
			"Failed to parse 'comet.json' as a Comet configuration: 'extends' has a cyclic dependency in 'comet.json' -> 'configs/team.json' -> 'base.json' -> 'comet.json'",
		)
	})
})

describe("two JSONC configuration files that extend each other", () => {
	beforeEach(() => {
		mockFile(
			jsoncPath,
			// language=json5
			`{
	// The shared team policy contains the common rules.
	"extends": "base.jsonc"
}`,
		)
		mockFile(
			"base.jsonc",
			// language=json5
			`{
	/* Project-specific exceptions belong in the root configuration. */
	"extends": "./comet.jsonc"
}`,
		)
	})

	it("raises a cyclic dependency error", async () => {
		await expect(getConfiguration(jsoncPath)).rejects.toThrow(
			"Failed to parse 'comet.jsonc' as a Comet configuration: 'extends' has a cyclic dependency in 'comet.jsonc' -> 'base.jsonc' -> 'comet.jsonc'",
		)
	})
})

describe.each`
	path                               | content                                               | expectedError
	${"comet.json"}                    | ${JSON.stringify({ rules: 31 })}                      | ${"Failed to parse 'comet.json' as a Comet configuration: 'rules' must be an object, but it is a number: 31"}
	${".github/comet.json"}            | ${JSON.stringify({ extends: true })}                  | ${"Failed to parse '.github/comet.json' as a Comet configuration: 'extends' must be a string, but it is a boolean: true"}
	${"comet.local.json"}              | ${JSON.stringify({ extends: ["a.json", "b.json"] })}  | ${`Failed to parse 'comet.local.json' as a Comet configuration: 'extends' must be a string, but it is an array: [ "a.json", "b.json" ]`}
	${"./comet.json"}                  | ${JSON.stringify([{ rules: {}, tokens: {} }])}        | ${`Failed to parse 'comet.json' as a Comet configuration: The configuration must be a JSON object, but it is an array: [ { "rules": {}, "tokens": {} …`}
	${"comet2.jsonc"}                  | ${JSON.stringify("Release the amazing robot butler")} | ${"Failed to parse 'comet2.jsonc' as a Comet configuration: The configuration must be a JSON object, but it is a string: Release the amazing robot butl…"}
	${"validate-commit-messages.json"} | ${JSON.stringify({ whatIsThis: true })}               | ${"Failed to parse 'validate-commit-messages.json' as a Comet configuration: 'whatIsThis' is not a valid option"}
	${"temp.txt"}                      | ${""}                                                 | ${`Failed to parse 'temp.txt' as JSON: Unexpected end of JSON input`}
	${"readme.md"}                     | ${"hello"}                                            | ${`Failed to parse 'readme.md' as JSON: Unexpected token 'h', "hello" is not valid JSON`}
	${"./.github/comet.github.jsonc"}  | ${"// bogus file\n-1"}                                | ${"Failed to parse '.github/comet.github.jsonc' as a Comet configuration: The configuration must be a JSON object, but it is a number: -1"}
`(
	"an invalid configuration file $path",
	(props: { path: string; content: string; expectedError: string }) => {
		beforeEach(() => {
			mockFile(props.path, props.content)
		})

		it("raises an error", async () => {
			await expect(getConfiguration(props.path)).rejects.toThrow(props.expectedError)
		})
	},
)

describe("a malformed JSONC configuration file", () => {
	beforeEach(() => {
		mockFile(
			".github/comet.jsonc",
			`{
	// Merge commits obscure the changes that introduced a regression.
	"rules": {
		"noMergeCommits": "error"
		/* This rule is disabled until generated commit messages are updated. */
		"useLineWrapping": "off"
	}
}`,
		)
	})

	it("raises an error", async () => {
		await expect(getConfiguration(".github/comet.jsonc")).rejects.toThrow(
			"Failed to parse '.github/comet.jsonc' as JSON: Expected ',' or '}' after property value in JSON at position 187 (line 6 column 3)",
		)
	})
})

describe.each`
	path                             | expectedError
	${"comet.json"}                  | ${"Failed to read 'comet.json': File not found"}
	${"./configs/comet.local.jsonc"} | ${`Failed to read 'configs/comet.local.jsonc': File not found`}
`("a non-existing configuration file $path", (props: { path: string; expectedError: string }) => {
	beforeEach(() => {
		mockNonexistingFile(props.path)
	})

	it("raises an error", async () => {
		await expect(getConfiguration(props.path)).rejects.toThrow(props.expectedError)
	})
})
