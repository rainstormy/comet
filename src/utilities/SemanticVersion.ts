import { trimPrefix } from "#utilities/Strings.ts"

export function extractSemanticVersion(value: string): string {
	if (!isSemanticVersion(value)) {
		throw new Error(`'${value}' is not a semantic version number`)
	}
	return trimPrefix(value, "v")
}

export function isSemanticVersion(value: string): boolean {
	const semver = /^v?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9a-z.-]*)?$/u
	return semver.test(value)
}
