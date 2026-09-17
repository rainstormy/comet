// oxlint-disable eslint/no-console -- Using `console` is intentional in this file.
import { red, yellow } from "ansis"

export function printMessage(message: string): void {
	console.log(message)
}

export function printCommandLineError(message: string): void {
	console.error(red`${message}`)
}

export function printCommandLineWarning(message: string): void {
	console.warn(yellow`${message}`)
}

/**
 * @see https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/workflow-commands-for-github-actions#setting-an-error-message
 */
export function printGithubActionsError(message: string): void {
	console.log(`::error::${escapeGithubActionsMessage(message)}`)
}

/**
 * @see https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands#setting-a-warning-message
 */
export function printGithubActionsWarning(message: string): void {
	console.log(`::warning::${escapeGithubActionsMessage(message)}`)
}

/**
 * @see https://github.com/actions/toolkit/issues/193
 */
function escapeGithubActionsMessage(message: string): string {
	return message.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A")
}
