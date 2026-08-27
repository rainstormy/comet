import * as v from "valibot"

// oxlint-disable-next-line typescript/explicit-function-return-type -- Rely on type inference for Valibot schemas.
export function naturalNumber(options?: { minValue: 0 | 1 }) {
	const errorMessage = options?.minValue === 0 ? "a non-negative integer" : "a positive integer"

	return v.pipe(
		v.number(errorMessage),
		v.integer(errorMessage),
		v.minValue(options?.minValue ?? 1, errorMessage),
	)
}
