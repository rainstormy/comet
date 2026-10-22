import { isNotEmptyString, uniqueItems } from "#utilities/Arrays.ts"
import type { DeepPartial } from "#utilities/Objects.ts"

export type TokenConfiguration = {
	conventionalCommits: ConventionalTokenConfiguration
	issueLinks: IssueLinkTokenConfiguration
}

type ConventionalTokenConfiguration = {
	types: Array<string>
}

type IssueLinkTokenConfiguration = {
	prefixes: Array<string>
	wildcards: Array<string>
}

export function sanitiseTokenConfiguration(
	tokens: DeepPartial<TokenConfiguration>,
): DeepPartial<TokenConfiguration> {
	const result: DeepPartial<TokenConfiguration> = {}

	if (tokens.conventionalCommits !== undefined) {
		result.conventionalCommits = sanitiseConventionalCommits(tokens.conventionalCommits)
	}
	if (tokens.issueLinks !== undefined) {
		result.issueLinks = sanitiseIssueLinks(tokens.issueLinks)
	}

	return result
}

function sanitiseConventionalCommits(
	conventionalCommits: DeepPartial<ConventionalTokenConfiguration>,
): DeepPartial<ConventionalTokenConfiguration> {
	const result: DeepPartial<ConventionalTokenConfiguration> = {}

	if (conventionalCommits.types !== undefined) {
		result.types = normaliseValues(conventionalCommits.types)
	}

	return result
}

function sanitiseIssueLinks(
	issueLinks: DeepPartial<IssueLinkTokenConfiguration>,
): DeepPartial<IssueLinkTokenConfiguration> {
	const result: DeepPartial<IssueLinkTokenConfiguration> = {}

	if (issueLinks.prefixes !== undefined) {
		result.prefixes = normaliseValues(issueLinks.prefixes)
	}
	if (issueLinks.wildcards !== undefined) {
		result.wildcards = normaliseValues(issueLinks.wildcards)
	}

	return result
}

function normaliseValues(items: Array<string>): Array<string> {
	return uniqueItems(items.map((value) => value.trim()).filter(isNotEmptyString))
}
