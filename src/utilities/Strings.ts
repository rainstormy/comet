export function capitalise(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Replaces each block of one of more whitespace characters with a single regular space character.
 * Hence, it collapses multiple spaces to a single space, and it replaces newlines with spaces.
 */
export function collapseWhitespace(value: string): string {
	return value.replaceAll(/\s+/gu, " ")
}

export function formatCount(count: number, singular: string, plural: string): string {
	return `${count} ${count === 1 ? singular : plural}`
}

export function indentString(value: string, offset: number): string {
	return prefixStringLines(value, " ".repeat(offset))
}

export function pluralise(subject: number, singular: string, plural?: string): string {
	return subject === 1 ? singular : (plural ?? `${singular}s`)
}

export function prefixStringLines(value: string, prefix: string): string {
	return prefix + value.replaceAll("\n", `\n${prefix}`)
}

export function trimPrefix(value: string, prefix: string): string {
	return value.startsWith(prefix) ? value.slice(prefix.length) : value
}

export function truncate(value: string, limit: number): string {
	return value.length <= limit ? value : `${value.slice(0, limit)}…`
}
