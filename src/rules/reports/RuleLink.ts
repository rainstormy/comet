import { link } from "ansis"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import type { HttpUrlString } from "#types/HttpUrlString.ts"
import { getPackageVersion } from "#utilities/package/Package.ts"
import { capitalise } from "#utilities/Strings.ts"

export function ruleLink(rule: RuleKey): string {
	const url: HttpUrlString = `https://github.com/rainstormy/comet/blob/v${getPackageVersion()}/docs/rules/${capitalise(rule)}.md`
	return link(url, `(${rule})`)
}
