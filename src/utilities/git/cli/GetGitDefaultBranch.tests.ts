import { beforeEach, describe, expect, it } from "vitest"
import { getGitDefaultBranch } from "#utilities/git/cli/GetGitDefaultBranch.ts"
import { mockGitCommand } from "#utilities/git/cli/RunGitCommand.fakes.ts"

describe.each`
	remote        | defaultBranch
	${"github"}   | ${"main"}
	${"origin"}   | ${"develop"}
	${"origin"}   | ${"master"}
	${"upstream"} | ${"next"}
`(
	"when there is 1 remote named $remote with HEAD pointing to $defaultBranch",
	(props: { remote: string; defaultBranch: string }) => {
		const remoteDefaultBranch = `${props.remote}/${props.defaultBranch}`

		beforeEach(() => {
			mockGitCommand("remote", { output: props.remote })
			mockGitCommand(`rev-parse --abbrev-ref ${props.remote}/HEAD`, {
				output: remoteDefaultBranch,
			})
		})

		it(`returns '${remoteDefaultBranch}'`, async () => {
			const actualBranch = await getGitDefaultBranch()
			expect(actualBranch).toBe(remoteDefaultBranch)
		})
	},
)

describe("when there are 2 remotes including one named 'origin'", () => {
	const originDefaultBranch = "origin/main"

	beforeEach(() => {
		mockGitCommand("remote", { output: "github\norigin" })
		mockGitCommand("rev-parse --abbrev-ref origin/HEAD", {
			output: originDefaultBranch,
		})
	})

	it("returns the default branch of the 'origin' remote", async () => {
		const actualBranch = await getGitDefaultBranch()
		expect(actualBranch).toBe(originDefaultBranch)
	})
})

describe("when there are 2 remotes and none named 'origin'", () => {
	const remoteDefaultBranch = "gitlab/next"

	beforeEach(() => {
		mockGitCommand("remote", { output: "gitlab\nupstream" })
		mockGitCommand("rev-parse --abbrev-ref gitlab/HEAD", {
			output: remoteDefaultBranch,
		})
	})

	it("returns the default branch of the first remote in alphabetical order", async () => {
		const actualBranch = await getGitDefaultBranch()
		expect(actualBranch).toBe(remoteDefaultBranch)
	})
})

describe("when there are 3 remotes including one named 'origin'", () => {
	const originDefaultBranch = "origin/develop"

	beforeEach(() => {
		mockGitCommand("remote", { output: "github\norigin\nupstream" })
		mockGitCommand("rev-parse --abbrev-ref origin/HEAD", {
			output: originDefaultBranch,
		})
	})

	it("returns the default branch of the 'origin' remote", async () => {
		const actualBranch = await getGitDefaultBranch()
		expect(actualBranch).toBe(originDefaultBranch)
	})
})

describe("when there are 3 remotes and none named 'origin'", () => {
	const remoteDefaultBranch = "github/main"

	beforeEach(() => {
		mockGitCommand("remote", { output: "github\nupstream\ngitlab" })
		mockGitCommand("rev-parse --abbrev-ref github/HEAD", {
			output: remoteDefaultBranch,
		})
	})

	it("returns the default branch of the first remote in alphabetical order", async () => {
		const actualBranch = await getGitDefaultBranch()
		expect(actualBranch).toBe(remoteDefaultBranch)
	})
})

describe("when the remote does not have a default branch", () => {
	beforeEach(() => {
		mockGitCommand("remote", { output: "origin" })
		mockGitCommand("rev-parse --abbrev-ref origin/HEAD", { output: "" })
	})

	describe("and a branch named 'main' exists locally", () => {
		beforeEach(() => {
			mockGitCommand("rev-parse --verify --quiet main", {
				output: "d799201951a348548eb063b548289b1ad58d61fd",
			})
		})

		it("falls back to 'main'", async () => {
			const actualBranch = await getGitDefaultBranch()
			expect(actualBranch).toBe("main")
		})
	})

	describe("and a branch named 'main' does not exist locally", () => {
		beforeEach(() => {
			mockGitCommand("rev-parse --verify --quiet main", { exitCode: 1 })
		})

		describe("and a branch named 'master' exists locally", () => {
			beforeEach(() => {
				mockGitCommand("rev-parse --verify --quiet master", {
					output: "bc26eb14f7314ece80f0a28d33d59535288dbad1",
				})
			})

			it("falls back to 'master'", async () => {
				const actualBranch = await getGitDefaultBranch()
				expect(actualBranch).toBe("master")
			})
		})

		describe("and a branch named 'master' does not exist locally", () => {
			beforeEach(() => {
				mockGitCommand("rev-parse --verify --quiet master", { exitCode: 1 })
			})

			it("returns null", async () => {
				const actualBranch = await getGitDefaultBranch()
				expect(actualBranch).toBeNull()
			})
		})
	})
})

describe("when there are no remotes", () => {
	beforeEach(() => {
		mockGitCommand("remote", { output: "" })
	})

	describe("and a branch named 'main' exists locally", () => {
		beforeEach(() => {
			mockGitCommand("rev-parse --verify --quiet main", {
				output: "d799201951a348548eb063b548289b1ad58d61fd",
			})
		})

		it("falls back to 'main'", async () => {
			const actualBranch = await getGitDefaultBranch()
			expect(actualBranch).toBe("main")
		})
	})

	describe("and a branch named 'main' does not exist locally", () => {
		beforeEach(() => {
			mockGitCommand("rev-parse --verify --quiet main", { exitCode: 1 })
		})

		describe("and a branch named 'master' exists locally", () => {
			beforeEach(() => {
				mockGitCommand("rev-parse --verify --quiet master", {
					output: "bc26eb14f7314ece80f0a28d33d59535288dbad1",
				})
			})

			it("falls back to 'master'", async () => {
				const actualBranch = await getGitDefaultBranch()
				expect(actualBranch).toBe("master")
			})
		})

		describe("and a branch named 'master' does not exist locally", () => {
			beforeEach(() => {
				mockGitCommand("rev-parse --verify --quiet master", { exitCode: 1 })
			})

			it("returns null", async () => {
				const actualBranch = await getGitDefaultBranch()
				expect(actualBranch).toBeNull()
			})
		})
	})
})

describe("when the 'git remote' command fails", () => {
	beforeEach(() => {
		mockGitCommand("remote", { exitCode: 1 })
		mockGitCommand("rev-parse --verify --quiet main", {
			output: "d799201951a348548eb063b548289b1ad58d61fd",
		})
	})

	it("throws an error", async () => {
		await expect(getGitDefaultBranch()).rejects.toThrow(
			"Command 'git remote' failed with exit code 1",
		)
	})
})

describe("when the 'git rev-parse' command fails", () => {
	beforeEach(() => {
		mockGitCommand("remote", { output: "origin" })
		mockGitCommand("rev-parse --abbrev-ref origin/HEAD", { exitCode: 128 })
	})

	describe("and a branch named 'main' exists locally", () => {
		beforeEach(() => {
			mockGitCommand("rev-parse --verify --quiet main", {
				output: "d799201951a348548eb063b548289b1ad58d61fd",
			})
		})

		it("falls back to 'main'", async () => {
			const actualBranch = await getGitDefaultBranch()
			expect(actualBranch).toBe("main")
		})
	})

	describe("and a branch named 'main' does not exist locally", () => {
		beforeEach(() => {
			mockGitCommand("rev-parse --verify --quiet main", { exitCode: 1 })
		})

		describe("and a branch named 'master' exists locally", () => {
			beforeEach(() => {
				mockGitCommand("rev-parse --verify --quiet master", {
					output: "bc26eb14f7314ece80f0a28d33d59535288dbad1",
				})
			})

			it("falls back to 'master'", async () => {
				const actualBranch = await getGitDefaultBranch()
				expect(actualBranch).toBe("master")
			})
		})

		describe("and a branch named 'master' does not exist locally", () => {
			beforeEach(() => {
				mockGitCommand("rev-parse --verify --quiet master", { exitCode: 1 })
			})

			it("returns null", async () => {
				const actualBranch = await getGitDefaultBranch()
				expect(actualBranch).toBeNull()
			})
		})
	})
})
