import { vi } from "vitest"
import { type GithubEnv, clearCachedGithubEnv } from "#utilities/github/env/GithubEnv.ts"

export function mockGithubEnv(overrides: Partial<GithubEnv> = {}): void {
	const {
		apiBaseUrl = "https://api.github.com/repos/rainstormy/comet",
		configPath = null,
		eventPath = "/github/workflow/event.json",
		__secretToken__ = "ghp_RGVuIGtvcnRlc3RlIHZlaiBtZWxsZW0gdG8gcHVua3RlciBlciBlbiBsaWdlIGxpbmpl",
	} = overrides

	const [githubApiUrl, repository] = apiBaseUrl.split("/repos/")

	clearCachedGithubEnv()

	vi.stubEnv("GITHUB_API_URL", githubApiUrl)
	vi.stubEnv("GITHUB_EVENT_PATH", eventPath)
	vi.stubEnv("GITHUB_REPOSITORY", repository)
	vi.stubEnv("INPUT_CONFIG-PATH", configPath ?? "")
	vi.stubEnv("INPUT_GITHUB-TOKEN", __secretToken__)
}
