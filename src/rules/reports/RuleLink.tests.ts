import { link } from "ansis"
import { beforeEach, describe, expect, it } from "vitest"
import type { RuleKey } from "#configurations/RulesetConfiguration.ts"
import { ruleLink } from "#rules/reports/RuleLink.ts"
import { mockPackageVersion } from "#utilities/package/Package.fakes.ts"

beforeEach(() => {
	mockPackageVersion("3.4.5-beta.2")
})

describe.each`
	rule                  | expectedUrl
	${"noSquashMarkers"}  | ${"https://github.com/rainstormy/comet/blob/v3.4.5-beta.2/docs/rules/NoSquashMarkers.md"}
	${"useSignedCommits"} | ${"https://github.com/rainstormy/comet/blob/v3.4.5-beta.2/docs/rules/UseSignedCommits.md"}
`("when linking to $rule", (props: { rule: RuleKey; expectedUrl: string }) => {
	it("embeds a clickable OSC 8 hyperlink into the rule key by default", () => {
		expect(ruleLink(props.rule)).toBe(link(props.expectedUrl, `(${props.rule})`))
	})

	it("embeds a clickable OSC 8 hyperlink into the rule key in the 'hyperlink' style", () => {
		expect(ruleLink(props.rule, "hyperlink")).toBe(link(props.expectedUrl, `(${props.rule})`))
	})

	it("prints the rule key and documentation URL as plain text in the 'plain' style", () => {
		expect(ruleLink(props.rule, "plain")).toBe(`(${props.rule}) ${props.expectedUrl}`)
	})
})
