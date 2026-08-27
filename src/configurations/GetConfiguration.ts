import type { TokenConfiguration } from "#commits/TokenConfiguration.ts"
import { getJsonConfiguration } from "#configurations/json/GetJsonConfiguration.ts"
import type { RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import { deepMerge } from "#utilities/Objects.ts"

export type Configuration = {
	rules: RulesetConfiguration
	tokens: TokenConfiguration
}

export async function getConfiguration(
	defaultConfiguration: Configuration,
): Promise<Configuration> {
	const jsonConfiguration = await getJsonConfiguration()
	return deepMerge(defaultConfiguration, jsonConfiguration)
}
