export class CommandError extends Error {
	exitCode: number

	constructor(props: {
		program: string
		args: Array<string>
		exitCode: number
		stderr?: string
		cause?: Error
	}) {
		super(
			[
				`Command '${props.program} ${props.args.join(" ")}' failed`,
				props.exitCode !== 0 ? ` with exit code ${props.exitCode}` : "",
				props.stderr !== undefined ? `:\n\n${props.stderr.trim()}` : "",
			].join(""),
			{ cause: props.cause },
		)
		this.name = "CommandError"
		this.exitCode = props.exitCode
	}
}

export function assertCommandError(error: unknown): asserts error is CommandError {
	if (!(error instanceof CommandError && error.exitCode !== 0)) {
		throw error
	}
}
