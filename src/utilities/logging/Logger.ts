// oxlint-disable eslint/no-console -- Using `console` is intentional in this file.
import { red } from "ansis"

export function printMessage(message: string): void {
	console.log(message)
}

export function printCommandLineError(message: string): void {
	console.error(red`${message}`)
}

/**
 * @see https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/workflow-commands-for-github-actions#setting-an-error-message
 * @see https://github.com/actions/toolkit/issues/193
 */
export function printGithubActionsError(message: string): void {
	const escapedMessage = message
		.replaceAll("%", "%25")
		.replaceAll("\r", "%0D")
		.replaceAll("\n", "%0A")

	console.log(`::error::${escapedMessage}`)
}
