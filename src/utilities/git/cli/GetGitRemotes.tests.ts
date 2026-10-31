import { beforeEach, describe, expect, it } from "vitest"
import { mockCommand } from "#utilities/commands/RunCommand.fakes.ts"
import { getGitRemotes } from "#utilities/git/cli/GetGitRemotes.ts"

describe("when there are no remotes", () => {
	beforeEach(() => {
		mockCommand("git remote", { output: "" })
	})

	it("returns an empty list", async () => {
		const actualRemotes = await getGitRemotes()
		expect(actualRemotes).toEqual([])
	})
})

describe.each`
	remote
	${"github"}
	${"origin"}
	${"upstream"}
`("when there is 1 remote named $remote", (props: { remote: string }) => {
	beforeEach(() => {
		mockCommand("git remote", { output: props.remote })
	})

	it("returns a list with 1 remote", async () => {
		const actualRemotes = await getGitRemotes()
		expect(actualRemotes).toEqual([props.remote])
	})
})

describe("when there are 2 remotes", () => {
	beforeEach(() => {
		mockCommand("git remote", { output: "github\norigin" })
	})

	it("returns a list with 2 remotes", async () => {
		const actualRemotes = await getGitRemotes()
		expect(actualRemotes).toEqual(["github", "origin"])
	})
})

describe("when there are 3 remotes", () => {
	beforeEach(() => {
		mockCommand("git remote", { output: "github\norigin\nupstream" })
	})

	it("returns a list with 3 remotes", async () => {
		const actualRemotes = await getGitRemotes()
		expect(actualRemotes).toEqual(["github", "origin", "upstream"])
	})
})

describe("when the 'git remote' command fails", () => {
	beforeEach(() => {
		mockCommand("git remote", { exitCode: 1 })
	})

	it("throws an error", async () => {
		await expect(getGitRemotes()).rejects.toThrow("Command 'git remote' failed with exit code 1")
	})
})
