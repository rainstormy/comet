import { describe, expect, it } from "vitest"
import { parseGitIdentity } from "#utilities/git/cli/ParseGitIdentity.ts"

describe.each`
	line                                                                                  | expectedName         | expectedEmail
	${"Master Splinter <sensei@ninja-academy.com> 1769801867 -0500"}                      | ${"Master Splinter"} | ${"sensei@ninja-academy.com"}
	${"renovate[bot] <29139614+renovate[bot]@users.noreply.github.com> 1794259164 +0100"} | ${"renovate[bot]"}   | ${"29139614+renovate[bot]@users.noreply.github.com"}
	${"Nimbus <Bot> <146315497+nimbus@users.noreply.github.com> 1769801867 +0000"}        | ${"Nimbus <Bot>"}    | ${"146315497+nimbus@users.noreply.github.com"}
	${"  bmo  <bmo@adventure.time> 1769801867 -0500"}                                     | ${"  bmo "}          | ${"bmo@adventure.time"}
`(
	"when the Git identity is $line",
	(props: { line: string; expectedName: string; expectedEmail: string }) => {
		const [actualName, actualEmail] = parseGitIdentity(props.line)

		it(`has a name of '${props.expectedName}'`, () => {
			expect(actualName).toBe(props.expectedName)
		})

		it(`has an email address of '${props.expectedEmail}'`, () => {
			expect(actualEmail).toBe(props.expectedEmail)
		})
	},
)

describe.each`
	line
	${"<sensei@ninja-academy.com> 1769801867 -0500"}
	${" <sensei@ninja-academy.com> 1769801867 -0500"}
`("when the Git identity of $line does not have a name", (props: { line: string }) => {
	const [actualName, actualEmail] = parseGitIdentity(props.line)

	it("has an empty name", () => {
		expect(actualName).toBe("")
	})

	it("preserves the email address", () => {
		expect(actualEmail).toBe("sensei@ninja-academy.com")
	})
})

describe.each`
	line
	${"Master Splinter 1769801867 -0500"}
	${"Master Splinter <sensei@ninja-academy.com 1769801867 -0500"}
`("when the Git identity of $line does not have an email address", (props: { line: string }) => {
	const [actualName, actualEmail] = parseGitIdentity(props.line)

	it("has an empty email address", () => {
		expect(actualEmail).toBe("")
	})

	it("treats the remaining text as the name", () => {
		expect(actualName).not.toBe("")
	})
})

describe.each`
	line
	${undefined}
	${""}
	${"Master Splinter"}
	${"1769801867"}
`(
	"when the Git identity of $line does not have a timestamp and a timezone",
	(props: { line: string | undefined }) => {
		const [actualName, actualEmail] = parseGitIdentity(props.line)

		it("has an empty name", () => {
			expect(actualName).toBe("")
		})

		it("has an empty email address", () => {
			expect(actualEmail).toBe("")
		})
	},
)
