import { isNotEmptyString, uniqueItems } from "#utilities/Arrays.ts"

export type TokenConfiguration = {
	issueLinks: {
		prefixes: Array<string>
		wildcards: Array<string>
	}
}

export function sanitiseTokenConfiguration(configuration: TokenConfiguration): TokenConfiguration {
	const normalisedPrefixes = normaliseStrings(configuration.issueLinks.prefixes)
	const normalisedWildcards = normaliseStrings(configuration.issueLinks.wildcards)

	return {
		...configuration,
		issueLinks: {
			prefixes: uniqueItems(normalisedPrefixes),
			wildcards: uniqueItems(normalisedWildcards),
		},
	}
}

function normaliseStrings(items: Array<string>): Array<string> {
	return items.map((value) => value.trim()).filter(isNotEmptyString)
}
