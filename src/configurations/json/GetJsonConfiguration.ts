import {
	type TokenConfiguration,
	issueLinkTokenConfiguration,
} from "#commits/TokenConfiguration.ts"
import type { Configuration } from "#configurations/GetConfiguration.ts"
import type {
	JsonConfigurationRulesDto,
	JsonConfigurationTokensDto,
} from "#configurations/json/dtos/JsonConfigurationDto.ts"
import { fetchJsonConfigurationDto } from "#configurations/json/FetchJsonConfigurationDto.ts"
import type { RuleKey, RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { isNotNullishValue } from "#utilities/Arrays.ts"
import type { DeepPartial } from "#utilities/Objects.ts"

export async function getJsonConfiguration(): Promise<DeepPartial<Configuration>> {
	const dto = await fetchJsonConfigurationDto("./comet.json")

	return {
		tokens: mapDtoToPartialTokenConfiguration(dto.tokens),
		rules: mapDtoToPartialRuleConfiguration(dto.rules),
	}
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
