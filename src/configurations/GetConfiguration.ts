import type { TokenConfiguration } from "#commits/TokenConfiguration.ts"
import type {
	JsonConfigurationGitDto,
	JsonConfigurationRulesDto,
	JsonConfigurationTokensDto,
} from "#configurations/json/dtos/JsonConfigurationDto.ts"
import { fetchJsonConfigurationDto } from "#configurations/json/FetchJsonConfigurationDto.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { isNotEmptyString, isNotNullishValue, uniqueItems } from "#utilities/Arrays.ts"
import { isReadableFile, normalisePath } from "#utilities/files/Files.ts"
import { type DeepPartial, deepMerge } from "#utilities/Objects.ts"

export type Configuration = {
	git: GitConfiguration
	rules: RulesetConfiguration
	tokens: TokenConfiguration
}

type GitConfiguration = {
	defaultBranch: string | null
}

export async function getConfiguration(configPath: string): Promise<DeepPartial<Configuration>> {
	const visitedPaths: Array<string> = []

	let currentPath: string | null = normalisePath(configPath)
	let configuration: DeepPartial<Configuration> = {}

	while (currentPath !== null) {
		if (visitedPaths.includes(currentPath)) {
			const cyclicPath = [...visitedPaths, currentPath].map((path) => `'${path}'`).join(" -> ")
			throw new TypeError(
				`Failed to parse '${currentPath}' as a Comet configuration: 'extends' has a cyclic dependency in ${cyclicPath}`,
			)
		}

		visitedPaths.push(currentPath)

		// oxlint-disable-next-line eslint/no-await-in-loop -- Configuration files must be loaded one by one to unfold the `extends` chain.
		const dto = await fetchJsonConfigurationDto(currentPath)

		const extendedBaseConfiguration: DeepPartial<Configuration> = {
			git: mapDtoToPartialGitConfiguration(dto.git),
			tokens: mapDtoToPartialTokenConfiguration(dto.tokens),
			rules: mapDtoToPartialRuleConfiguration(dto.rules),
		}
		configuration = deepMerge(extendedBaseConfiguration, configuration)
		currentPath = dto.extends !== undefined ? normalisePath(dto.extends, currentPath) : null
	}

	return sanitiseConfiguration(configuration)
}

function mapDtoToPartialGitConfiguration(
	dto: JsonConfigurationGitDto,
): DeepPartial<GitConfiguration> {
	if (dto?.defaultBranch === undefined) {
		return {}
	}

	return { defaultBranch: dto.defaultBranch }
}

function mapDtoToPartialTokenConfiguration(
	dto: JsonConfigurationTokensDto,
): DeepPartial<TokenConfiguration> {
	if (dto?.issueLinks === undefined) {
		return {}
	}

	return {
		issueLinks: {
			prefixes: dto.issueLinks.prefixes ?? [],
			wildcards: dto.issueLinks.wildcards ?? [],
		},
	}
}

function mapDtoToPartialRuleConfiguration(
	dto: JsonConfigurationRulesDto,
): DeepPartial<RulesetConfiguration> {
	if (dto === undefined) {
		return {}
	}

	return Object.fromEntries(
		Object.entries(dto)
			.filter(isNotNullishValue)
			.map(([ruleKey, ruleDto]) => [
				ruleKey as RuleKey,
				typeof ruleDto === "string" ? { level: ruleDto } : ruleDto,
			]),
	)
}

function sanitiseConfiguration(
	configuration: DeepPartial<Configuration>,
): DeepPartial<Configuration> {
	const issueLinks = configuration.tokens?.issueLinks ?? null

	if (issueLinks === null) {
		return configuration
	}

	const prefixes = issueLinks.prefixes ?? []
	const wildcards = issueLinks.wildcards ?? []

	const normalisedPrefixes = prefixes.map((value) => value.trim()).filter(isNotEmptyString)
	const normalisedWildcards = wildcards.map((value) => value.trim()).filter(isNotEmptyString)

	return {
		...configuration,
		tokens: {
			issueLinks: {
				prefixes: uniqueItems(normalisedPrefixes),
				wildcards: uniqueItems(normalisedWildcards),
			},
		},
	}
}

export async function getConfigurationPath(
	configPaths: Array<string>,
	skipMissingConfigPaths: boolean,
): Promise<string | null> {
	for (const configPath of configPaths) {
		// oxlint-disable-next-line eslint/no-await-in-loop -- Configurations must be checked from last to first until one exists.
		if (!skipMissingConfigPaths || (await isReadableFile(configPath))) {
			return configPath
		}
	}

	return getDefaultConfigurationPath()
}

async function getDefaultConfigurationPath(): Promise<string | null> {
	if (await isReadableFile("comet.json")) {
		return "comet.json"
	}
	if (await isReadableFile("comet.jsonc")) {
		return "comet.jsonc"
	}
	return null
}

export function* validateConfiguration(
	configuration: DeepPartial<Configuration>,
): Generator<string> {
	if (configuration.rules?.useIssueLinks?.level === "error") {
		const issueLinks = configuration.tokens?.issueLinks
		const prefixes = issueLinks?.prefixes ?? []
		const wildcards = issueLinks?.wildcards ?? []

		if (issueLinks === undefined) {
			yield "Flawed Comet configuration: 'issueLinks' in 'tokens' should be defined when 'useIssueLinks' is enabled"
		} else if (prefixes.length + wildcards.length === 0) {
			yield "Flawed Comet configuration: 'issueLinks' in 'tokens' should contain at least one non-blank prefix or wildcard when 'useIssueLinks' is enabled"
		}
	}
}
