import { pluralise } from "#utilities/Strings.ts"

export function parseArgs<Option extends string>(
	schema: OptionSchema<Option>,
	args: Array<string>,
): Record<Option, Array<string> | undefined> {
	const parsedArgs: Record<string, Array<string> | undefined> = {}
	let currentOption: string | null = null

	for (const arg of args) {
		if (arg.startsWith("-")) {
			currentOption = arg
			parsedArgs[currentOption] ??= []
		} else if (currentOption !== null) {
			parsedArgs[currentOption]?.push(arg)
		}
	}

	assertNoInvalidOptions(schema, parsedArgs)
	assertRequiredOptions(schema, parsedArgs)
	assertExactNumberOfOptionArguments(schema, parsedArgs)
	assertMinimumNumberOfOptionArguments(schema, parsedArgs)
	assertMaximumNumberOfOptionArguments(schema, parsedArgs)

	return parsedArgs
}

function assertNoInvalidOptions<Option extends string>(
	schema: OptionSchema<Option>,
	parsedArgs: Record<string, Array<string> | undefined>,
): asserts parsedArgs is Record<Option, Array<string> | undefined> {
	for (const observedOption of Object.keys(parsedArgs)) {
		if (!(observedOption in schema)) {
			throw new TypeError(`Unknown option '${observedOption}'`)
		}
	}
}

function assertRequiredOptions<Option extends string>(
	schema: OptionSchema<Option>,
	parsedArgs: Record<Option, Array<string> | undefined>,
): void {
	const constraints = Object.entries(schema) as Array<[Option, OptionConstraints]>

	for (const [option, { required }] of constraints) {
		if (required && !(option in parsedArgs)) {
			throw new TypeError(`${option} is required`)
		}
	}
}

function assertExactNumberOfOptionArguments<Option extends string>(
	schema: OptionSchema<Option>,
	parsedArgs: Record<Option, Array<string> | undefined>,
): void {
	const constraints = Object.entries(schema) as Array<[Option, OptionConstraints]>

	for (const [option, { args }] of constraints) {
		const optionArgs = parsedArgs[option]

		if (optionArgs !== undefined) {
			const min = args.min ?? null
			const max = args.max ?? null
			const count = optionArgs.length

			if (min !== null && min === max && count !== min) {
				const constraint = `exactly ${min} ${pluralise(min, "argument")}`
				throw new TypeError(`'${option}' requires ${constraint}, but got ${count}`)
			}
		}
	}
}

function assertMinimumNumberOfOptionArguments<Option extends string>(
	schema: OptionSchema<Option>,
	parsedArgs: Record<Option, Array<string> | undefined>,
): void {
	const constraints = Object.entries(schema) as Array<[Option, OptionConstraints]>

	for (const [option, { args }] of constraints) {
		const optionArgs = parsedArgs[option]

		if (optionArgs !== undefined) {
			const min = args.min ?? null
			const count = optionArgs.length

			if (min !== null && count < min) {
				const constraint = `at least ${min} ${pluralise(min, "argument")}`
				throw new TypeError(`'${option}' requires ${constraint}, but got ${count}`)
			}
		}
	}
}

function assertMaximumNumberOfOptionArguments<Option extends string>(
	schema: OptionSchema<Option>,
	parsedArgs: Record<Option, Array<string> | undefined>,
): void {
	const constraints = Object.entries(schema) as Array<[Option, OptionConstraints]>

	for (const [option, { args }] of constraints) {
		const optionArgs = parsedArgs[option]

		if (optionArgs !== undefined) {
			const max = args.max ?? null
			const count = optionArgs.length

			if (max !== null && count > max) {
				const constraint = `at most ${max} ${pluralise(max, "argument")}`
				throw new TypeError(`'${option}' requires ${constraint}, but got ${count}`)
			}
		}
	}
}

export function defineOptions<Option extends string>(
	schema: OptionSchema<Option>,
): OptionSchema<Option> {
	return schema
}

export type OptionSchema<Option extends string> = Record<Option, OptionConstraints>

type OptionConstraints = {
	args: {
		min?: number
		max?: number
	}
	required?: true
}
