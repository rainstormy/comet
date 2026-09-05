export class GitCommandError extends Error {
	exitCode: number

	constructor(props: { args: Array<string>; exitCode: number; stderr?: string; cause?: Error }) {
		super(
			[
				`Command 'git ${props.args.join(" ")}' failed`,
				props.exitCode !== 0 ? ` with exit code ${props.exitCode}` : "",
				props.stderr !== undefined ? `:\n\n${props.stderr.trim()}` : "",
			].join(""),
			{ cause: props.cause },
		)
		this.name = "GitCommandError"
		this.exitCode = props.exitCode
	}
}

export function assertGitCommandError(error: unknown): asserts error is GitCommandError {
	if (!(error instanceof GitCommandError && error.exitCode !== 0)) {
		throw error
	}
}
