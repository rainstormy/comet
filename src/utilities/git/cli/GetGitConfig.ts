import { assertCommandError } from "#utilities/commands/CommandError.ts"
import { runCommand } from "#utilities/commands/RunCommand.ts"

/**
 * @returns The value of the given key in the Git configuration, or `null` if the key is not set.
 */
export async function getGitConfigValue(key: string): Promise<string | null> {
	try {
		return await runCommand("git", "config", "--get", key)
	} catch (error) {
		return nullIfKeyIsNotSet(error)
	}
}

/**
 * @returns All values of the keys in the Git configuration that match the given regular expression, in the order of precedence from lowest to highest.
 * The values preserve leading and trailing whitespace.
 */
export async function getGitConfigEntries(
	keyPattern: string,
): Promise<Array<[key: string, value: string]>> {
	try {
		// `--null` terminates every entry with a NUL character and separates the key and the value by a line break.
		// It preserves whitespace at the end of the last value, which would otherwise be trimmed from the output.
		const output = await runCommand("git", "config", "--null", "--get-regexp", keyPattern)
		return output
			.split("\0")
			.filter((entry) => entry !== "")
			.map(parseConfigEntry)
	} catch (error) {
		nullIfKeyIsNotSet(error)
		return []
	}
}

function parseConfigEntry(entry: string): [key: string, value: string] {
	// A key without a value (e.g. `[core] commentChar`) does not have a line break.
	const valueIndex = entry.indexOf("\n")
	return valueIndex !== -1 ? [entry.slice(0, valueIndex), entry.slice(valueIndex + 1)] : [entry, ""]
}

function nullIfKeyIsNotSet(error: unknown): null {
	assertCommandError(error)

	// `git config` exits with code 1 if the key is not set.
	if (error.exitCode !== 1) {
		throw error
	}

	return null
}
