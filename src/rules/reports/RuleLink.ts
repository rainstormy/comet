import { link } from "ansis"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import type { HttpUrlString } from "#types/HttpUrlString.ts"
import { getPackageVersion } from "#utilities/package/Package.ts"
import { capitalise } from "#utilities/Strings.ts"

/**
 * - `hyperlink`: Embeds a clickable hyperlink into the rule name. For terminals that support OSC 8 sequences.
 * - `plain`: Renders the documentation URL as autolinkable plain text after the rule name. For logs that do not render hyperlinks such as GitHub Actions.
 */
export type RuleLinkStyle = "hyperlink" | "plain"

export function ruleLink(rule: RuleKey, style: RuleLinkStyle = "hyperlink"): string {
	const url: HttpUrlString = `https://github.com/rainstormy/comet/blob/v${getPackageVersion()}/docs/rules/${capitalise(rule)}.md`
	return style === "hyperlink" ? link(url, `(${rule})`) : `(${rule}) ${url}`
}
