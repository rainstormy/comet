import * as v from "valibot"
import {
	JSON_CONFIGURATION_DTO,
	type JsonConfigurationDto,
} from "#configurations/json/dtos/JsonConfigurationDto.ts"
import { isNotNullish } from "#utilities/Arrays.ts"
import { requireNotNullish } from "#utilities/Assertions.ts"
import { readJsonFile } from "#utilities/files/Files.ts"
import { collapseWhitespace } from "#utilities/Strings.ts"
import { getDetailedValiIssue } from "#utilities/valibot/ValiIssue.ts"

export async function fetchJsonConfigurationDto(path: string): Promise<JsonConfigurationDto> {
	const json = await readJsonFile(path)

	try {
		return v.parse(JSON_CONFIGURATION_DTO, json)
	} catch (error) {
		if (error instanceof v.ValiError) {
			throw new TypeError(
				`Failed to parse '${path}' as a Comet configuration: ${formatValiError(error.issues[0])}`,
				{ cause: error },
			)
		}

		throw error
	}
}

function formatValiError(firstOriginalIssue: v.GenericIssue): string {
	const configuration = firstOriginalIssue.path?.[0]?.input ?? firstOriginalIssue.input

	if (configuration === null || typeof configuration !== "object" || Array.isArray(configuration)) {
		return `The configuration must be a JSON object, but it is ${configuration === "" ? "empty" : formatActual(configuration)}`
	}

	const { issue, path } = getDetailedValiIssue(firstOriginalIssue)

	if (issue.expected === "never") {
		return formatUnknownProperty(path)
	}
	if (issue.input === undefined) {
		return formatMissingProperty(path)
	}

	return `${formatPath(path)} ${formatExpected(issue)}, but it ${isArrayPathSegment(path) ? "contains" : "is"} ${formatActual(issue.input)}`
}

function formatUnknownProperty(path: Array<v.IssuePathItem>): string {
	const properties = getProperties(path)
	const property = requireNotNullish(
		properties.at(-1),
		() => `Unnamed unknown configuration property: ${JSON.stringify(path)}`,
	)

	if (properties[0] === "rules" && properties.length === 2) {
		return `'${property}' is not a valid rule`
	}

	const parent = discardNoisyProperties(properties).at(-2) ?? ""
	return `'${property}' is not a valid option${parent ? ` of '${parent}'` : ""}`
}

function formatMissingProperty(path: Array<v.IssuePathItem>): string {
	const properties = getProperties(path)
	const property = requireNotNullish(
		properties.at(-1),
		() => `Unnamed missing configuration property: ${JSON.stringify(path)}`,
	)

	const parent = properties.at(-2) ?? ""

	if (!parent) {
		return `'${property}' is missing`
	}

	if (parent === "options") {
		const relevantParent = discardNoisyProperties(properties).at(-2) ?? ""
		return relevantParent
			? `'${property}' of '${relevantParent}' is missing`
			: `'${property}' is missing`
	}

	return `'${property}' is missing in '${parent}'`
}

function formatPath(path: Array<v.IssuePathItem>): string {
	const properties = discardNoisyProperties(getProperties(path))
	if (isArrayPathSegment(path)) {
		properties.pop()
	}
	const property = requireNotNullish(
		properties.at(-1),
		() => `Unnamed configuration property: ${JSON.stringify(path)}`,
	)

	const parent = properties.at(-2) ?? ""
	return parent ? `'${property}' of '${parent}'` : `'${property}'`
}

function getProperties(path: Array<v.IssuePathItem>): Array<string> {
	return path
		.map((segment) => segment.key)
		.filter(isNotNullish)
		.map(String)
}

function discardNoisyProperties(properties: Array<string>): Array<string> {
	const relevantProperties = [...properties]
	if (
		relevantProperties.length > 1 &&
		(relevantProperties[0] === "rules" || relevantProperties[0] === "tokens")
	) {
		relevantProperties.shift()
	}

	return relevantProperties.filter(
		(property, index) => property !== "options" || index === relevantProperties.length - 1,
	)
}

function formatExpected(issue: v.GenericIssue): string {
	const expected = getExpectedDescription(issue)
	return `must be ${expected}`
}

function getExpectedDescription(issue: v.GenericIssue): string {
	if (!issue.message.startsWith("Invalid ")) {
		return issue.message
	}

	const expectedType = requireNotNullish(
		issue.expected,
		() => `JSON configuration file schema expects an unknown type: ${JSON.stringify(issue)}`,
	)

	switch (expectedType) {
		case "Array": {
			return "an array"
		}
		case "Object": {
			return "an object"
		}
		case "boolean": {
			return "a boolean"
		}
		case "number": {
			return "a number"
		}
		case "string": {
			return "a string"
		}
		default: {
			return expectedType
		}
	}
}

function isArrayPathSegment(path: Array<v.IssuePathItem>): boolean {
	return path.at(-1)?.type === "array"
}

function formatActual(actual: unknown): string {
	switch (typeof actual) {
		case "boolean": {
			return `a boolean: ${actual}`
		}
		case "number": {
			return `a number: ${actual}`
		}
		case "object": {
			if (actual === null) {
				return "null"
			}
			if (Array.isArray(actual)) {
				return `an array: ${formatJsonValue(actual)}`
			}
			return `an object: ${formatJsonValue(actual)}`
		}
		case "string": {
			return `a string: ${actual}`
		}
		case "bigint":
		case "function":
		case "symbol":
		case "undefined": {
			return `an unexpected type: ${typeof actual}`
		}
	}
}

function formatJsonValue(value: unknown): string {
	return collapseWhitespace(JSON.stringify(value, undefined, " "))
}
