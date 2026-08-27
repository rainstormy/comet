export type DeepPartial<Source> = Source extends object ? DeepPartialObject<Source> : Source

type DeepPartialObject<Source extends object> = { [Key in keyof Source]?: DeepPartial<Source[Key]> }

export type DeepRequired<Source> = Required<{
	[Key in keyof Source]: Source[Key] extends Required<Source[Key]>
		? Source[Key]
		: DeepRequired<Source[Key]>
}>

export function deepMerge<Source extends object>(
	source: Source,
	overrides: DeepPartialObject<Source>,
): Source {
	const merged: Source = { ...source }

	for (const key in overrides) {
		if (Object.hasOwn(overrides, key) && overrides[key] !== undefined) {
			const a = merged[key]
			const b = overrides[key] as Source[typeof key]

			if (Array.isArray(a) && Array.isArray(b)) {
				merged[key] = [...a, ...b] as Source[typeof key]
			} else if (isObject(a) && isObject(b)) {
				merged[key] = deepMerge(a, b)
			} else {
				merged[key] = b
			}
		}
	}

	return merged
}

function isObject(value: unknown): value is object {
	return typeof value === "object" && value !== null
}
