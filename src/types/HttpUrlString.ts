export type HttpUrlString = `https://${string}`

export function requireHttpUrlString(
	value: unknown,
	errorMessage: (invalidValue: unknown) => string,
): HttpUrlString {
	assertHttpUrlString(value, errorMessage)
	return value
}

export function assertHttpUrlString(
	value: unknown,
	errorMessage: (invalidValue: unknown) => string,
): asserts value is HttpUrlString {
	if (
		typeof value !== "string" ||
		!value.startsWith("https://") ||
		value.length <= "https://".length
	) {
		throw new TypeError(errorMessage(value))
	}
}
