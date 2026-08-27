import {
	type TokenConfiguration,
	issueLinkTokenConfiguration,
} from "#commits/TokenConfiguration.ts"
import type {
	JsonConfigurationRulesDto,
	JsonConfigurationTokensDto,
} from "#configurations/json/dtos/JsonConfigurationDto.ts"
import { fetchJsonConfigurationDto } from "#configurations/json/FetchJsonConfigurationDto.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { isNotNullishValue } from "#utilities/Arrays.ts"
import { isReadableFile, normalisePath } from "#utilities/files/Files.ts"
import { type DeepPartial, deepMerge } from "#utilities/Objects.ts"

export type Configuration = {
	rules: RulesetConfiguration
	tokens: TokenConfiguration
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
			tokens: mapDtoToPartialTokenConfiguration(dto.tokens),
			rules: mapDtoToPartialRuleConfiguration(dto.rules),
		}
		configuration = deepMerge(extendedBaseConfiguration, configuration)
		currentPath = dto.extends !== undefined ? normalisePath(dto.extends, currentPath) : null
	}

	return configuration
}

function mapDtoToPartialTokenConfiguration(
	dto: JsonConfigurationTokensDto,
): DeepPartial<TokenConfiguration> {
	if (dto?.issueLinks === undefined) {
		return {}
	}

	return {
		issueLinks: issueLinkTokenConfiguration(
			dto.issueLinks.prefixes ?? [],
			dto.issueLinks.wildcards ?? [],
		),
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

export async function getConfigurationPath(configPath: string | null): Promise<string | null> {
	return configPath ?? (await getDefaultConfigurationPath())
}

async function getDefaultConfigurationPath(): Promise<string | null> {
	const defaultExists = await isReadableFile("comet.json")
	return defaultExists ? "comet.json" : null
}
