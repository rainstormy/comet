// oxlint-disable-next-line no-restricted-imports -- Access the `version` field directly from `package.json`.
import * as packagejson from "../../../package.json" with { type: "json" }

export function getPackageVersion(): string {
	return packagejson.version
}
