export type CharacterRange = [startIndex: number, endIndex: number]

export function nonEmptyRangeOf(start: number, end: number): CharacterRange {
	return end > start ? [start, end] : [start, start + 1]
}

export function rangeBetween(a: CharacterRange, b: CharacterRange): CharacterRange {
	return [Math.min(a[0], b[0]), Math.max(a[1], b[1])]
}
