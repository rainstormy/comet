import * as v from "valibot"

// oxlint-disable-next-line typescript/explicit-function-return-type -- Rely on type inference for Valibot schemas.
export function stringArray() {
	const errorMessage = "an array of strings"
	return v.array(v.string(errorMessage), errorMessage)
}
