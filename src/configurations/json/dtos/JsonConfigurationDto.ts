import * as v from "valibot"
import {
	RULESET_CONFIGURATION_SCHEMA,
	RULE_LEVEL_SCHEMA,
	type RuleKey,
} from "#configurations/RulesetConfiguration.ts"
import { stringArray } from "#types/StringArray.ts"

export type JsonConfigurationDto = v.InferOutput<typeof JSON_CONFIGURATION_DTO>

export type JsonConfigurationTokensDto = JsonConfigurationDto["tokens"]
export type JsonConfigurationRulesDto = JsonConfigurationDto["rules"]

const TOKENS_DTO = v.strictObject({
	issueLinks: v.exactOptional(
		v.strictObject({
			prefixes: v.exactOptional(stringArray()),
			wildcards: v.exactOptional(stringArray()),
		}),
	),
})

// Allow JSON configuration files to provide an `error` or `off` string literal directly, omitting the object of `level` and `options`.
// The rule falls back to its default options in this case.
const RULES_DTO = v.strictObject(
	Object.fromEntries(
		Object.entries(RULESET_CONFIGURATION_SCHEMA.entries).map(
			([ruleKey, ruleConfigurationSchema]) => [
				ruleKey,
				v.exactOptional(
					v.union(
						[RULE_LEVEL_SCHEMA, ruleConfigurationSchema],
						"'error', 'off', or an object of 'level' and 'options'",
					),
				),
			],
		),
	) as { [Key in RuleKey]: RuleDtoSchema<Key> },
)

type RuleDtoSchema<Key extends RuleKey> = v.ExactOptionalSchema<
	v.UnionSchema<
		[typeof RULE_LEVEL_SCHEMA, (typeof RULESET_CONFIGURATION_SCHEMA.entries)[Key]],
		v.ErrorMessage<v.GenericIssue>
	>,
	undefined
>

export const JSON_CONFIGURATION_DTO = v.strictObject({
	$schema: v.exactOptional(v.unknown()), // Ignore the `$schema` property.
	extends: v.exactOptional(v.string()),
	rules: v.exactOptional(RULES_DTO),
	tokens: v.exactOptional(TOKENS_DTO),
})
