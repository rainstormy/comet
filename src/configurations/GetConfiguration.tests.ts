import { beforeEach, describe, expect, it } from "vitest"
import { type Configuration, getConfiguration } from "#configurations/GetConfiguration.ts"
import type { JsonConfigurationDto } from "#configurations/json/dtos/JsonConfigurationDto.ts"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import type { JsonObject } from "#types/JsonValue.ts"
import { mockFile, mockJsonFile, mockNonexistingFile } from "#utilities/files/Files.fakes.ts"
import type { DeepPartial, DeepRequired } from "#utilities/Objects.ts"

const path = "comet.json"

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
			extends: "@rainstormy/comet-config",
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
		mockJsonFile<DeepRequired<JsonConfigurationDto> & { $schema: string }>(path, {
			$schema: "https://example.com/schema.json",
			extends: "@rainstormy/comet-config",
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
	${"./.github/comet.github.jsonc"}  | ${"// bogus file\n-1"}                                | ${`Failed to parse '.github/comet.github.jsonc' as JSON: Unexpected token '/', "// bogus file\n-1" is not valid JSON`}
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

describe.each`
	path                            | expectedError
	${"comet.json"}                 | ${"Failed to read 'comet.json': File not found"}
	${"./configs/comet.local.json"} | ${`Failed to read 'configs/comet.local.json': File not found`}
`("a non-existing configuration file $path", (props: { path: string; expectedError: string }) => {
	beforeEach(() => {
		mockNonexistingFile(props.path)
	})

	it("raises an error", async () => {
		await expect(getConfiguration(props.path)).rejects.toThrow(props.expectedError)
	})
})
