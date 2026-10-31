import { isNotEmptyString } from "#utilities/Arrays.ts"
import { runCommand } from "#utilities/commands/RunCommand.ts"

export async function getGitRemotes(): Promise<Array<string>> {
	const output = await runCommand("git", "remote")
	return output.split("\n").filter(isNotEmptyString)
}
