import process from "node:process"
import { type HttpUrlString, requireHttpUrlString } from "#types/HttpUrlString.ts"
import { requireNotBlankString } from "#utilities/Assertions.ts"
import type { GithubUrlString } from "#utilities/github/api/GithubUrlString.ts"

export type GithubEnv = {
	apiBaseUrl: GithubUrlString
	configPath: string | null
	eventPath: string
	__secretToken__: string
}

let cachedEnv: GithubEnv | null = null

/**
 * @see https://docs.github.com/en/actions/reference/workflows-and-actions/variables
 * @see https://docs.github.com/en/actions/reference/workflows-and-actions/metadata-syntax#example-specifying-inputs
 */
export function githubEnv(): GithubEnv {
	if (cachedEnv !== null) {
		return cachedEnv
	}

	cachedEnv = {
		apiBaseUrl: `${envHttpUrlString("GITHUB_API_URL")}/repos/${envString("GITHUB_REPOSITORY")}`,
		configPath: envStringOrNull("INPUT_CONFIG-PATH"),
		eventPath: envString("GITHUB_EVENT_PATH"),
		__secretToken__: envString("INPUT_GITHUB-TOKEN"),
	}

	return cachedEnv
}

export function clearCachedGithubEnv(): void {
	cachedEnv = null
}

function envHttpUrlString(key: EnvKey): HttpUrlString {
	const value = process.env[key]?.trim() ?? null
	return requireHttpUrlString(
		value,
		() => `Expected the environment variable '${key}' to be a URL string, but got '${value}'`,
	)
}

function envString(key: EnvKey): string {
	const value = process.env[key]?.trim() ?? null
	return requireNotBlankString(value, () =>
		isInputParameter(key)
			? `The 'rainstormy/comet' action expects the '${nameOfInputParameter(key)}' input parameter to be set`
			: `Expected the environment variable '${key}' to be set`,
	)
}

function envStringOrNull(key: EnvKey): string | null {
	const value = process.env[key]?.trim() ?? null
	return value !== "" ? value : null
}

type EnvKey = `GITHUB_${string}` | `INPUT_${string}`

function isInputParameter(key: string): key is `INPUT_${string}` {
	return key.startsWith("INPUT_")
}

function nameOfInputParameter(key: `INPUT_${string}`): string {
	return key.slice("INPUT_".length).toLowerCase()
}
