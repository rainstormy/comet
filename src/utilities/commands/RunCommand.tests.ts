import { beforeEach, describe, expect, it, vi } from "vitest"
import { CommandError } from "#utilities/commands/CommandError.ts"
import { runCommand } from "#utilities/commands/RunCommand.ts"

// Undo the automatic use of `mockCommands` in `VitestSetup.fakes.ts`.
vi.unmock(import("#utilities/commands/RunCommand.ts"))

// This test suite spawns real Node.js processes.
const node = process.execPath

describe("when the program exits with code 0", () => {
	let actualOutput: string

	beforeEach(async () => {
		actualOutput = await runCommand(node, "-e", String.raw`process.stdout.write('  output  \n')`)
	})

	it("returns the standard output without surrounding whitespace", () => {
		expect(actualOutput).toBe("output")
	})
})

describe.each`
	args
	${["one two", "three"]}
	${["--output=/tmp/out file.txt", "..HEAD"]}
	${["  leading and trailing  "]}
	${["main --output=victim.txt ", "..HEAD"]}
`("when the arguments are $args", (props: { args: Array<string> }) => {
	let actualArgs: Array<string>

	beforeEach(async () => {
		// The `--` separator stops Node.js from parsing option-like arguments as its own options.
		const output = await runCommand(
			node,
			"-p",
			"JSON.stringify(process.argv.slice(1))",
			"--",
			...props.args,
		)
		actualArgs = JSON.parse(output)
	})

	it("passes all arguments to the program exactly as they are, including whitespace", () => {
		expect(actualArgs).toStrictEqual(props.args)
	})
})

describe("when the program exits with a non-zero exit code", () => {
	let actualError: unknown

	beforeEach(async () => {
		actualError = await runCommand(
			node,
			"-e",
			String.raw`process.stderr.write('boom\n'); process.exit(3)`,
		).catch((error: unknown) => error)
	})

	it("raises an error that includes the exit code", () => {
		expect(actualError).toBeInstanceOf(CommandError)
		expect(actualError).toHaveProperty("exitCode", 3)
	})

	it("includes the error log in the message", () => {
		expect(actualError).toHaveProperty(
			"message",
			expect.stringContaining("with exit code 3:\n\nboom"),
		)
	})
})

describe("when the program cannot be spawned", () => {
	let actualError: unknown

	beforeEach(async () => {
		actualError = await runCommand("rainstormycometimaginaryprogram", "--version").catch(
			(error: unknown) => error,
		)
	})

	it("raises an error with exit code -1", () => {
		expect(actualError).toBeInstanceOf(CommandError)
		expect(actualError).toHaveProperty("exitCode", -1)
	})

	it("keeps the spawn error as the cause", () => {
		expect(actualError).toHaveProperty("cause", expect.objectContaining({ code: "ENOENT" }))
	})
})
