import type { CharacterRange } from "#types/CharacterRange.ts"
import type { NonEmptyArray } from "#utilities/Arrays.ts"

export type Token<Type extends TokenType = TokenType> = {
	type: Type
	value: string
	range: CharacterRange
}

export type Tokens<Type extends TokenType = TokenType> = Array<Token<Type>>

export type TokenType =
	| "code"
	| "codeblock"
	| "conventional"
	| "hyperlink"
	| "issuelink"
	| "punctuation"
	| "revert"
	| "semver"
	| "squash"
	| "trailerkey"
	| "whitespace"
	| "word"

export function code(value: string, rangeStart = 0): Token<"code"> {
	return tokenOf("code", value, rangeStart)
}

export function codeblock(value: string, rangeStart = 0): Token<"codeblock"> {
	return tokenOf("codeblock", value, rangeStart)
}

export function conventional(value: string, rangeStart = 0): Token<"conventional"> {
	return tokenOf("conventional", value, rangeStart)
}

export function hyperlink(value: string, rangeStart = 0): Token<"hyperlink"> {
	return tokenOf("hyperlink", value, rangeStart)
}

export function issuelink(value: string, rangeStart = 0): Token<"issuelink"> {
	return tokenOf("issuelink", value, rangeStart)
}

export function punctuation(value: string, rangeStart = 0): Token<"punctuation"> {
	return tokenOf("punctuation", value, rangeStart)
}

export function revert(value: string, rangeStart = 0): Token<"revert"> {
	return tokenOf("revert", value, rangeStart)
}

export function semver(value: string, rangeStart = 0): Token<"semver"> {
	return tokenOf("semver", value, rangeStart)
}

export function squash(value: string, rangeStart = 0): Token<"squash"> {
	return tokenOf("squash", value, rangeStart)
}

export function trailerkey(value: string, rangeStart = 0): Token<"trailerkey"> {
	return tokenOf("trailerkey", value, rangeStart)
}

export function space(rangeStart = 0): Token<"whitespace"> {
	return whitespace(" ", rangeStart)
}

export function whitespace(value: string, rangeStart = 0): Token<"whitespace"> {
	return tokenOf("whitespace", value, rangeStart)
}

export function word(value: string, rangeStart = 0): Token<"word"> {
	return tokenOf("word", value, rangeStart)
}

export function tokenOf<Type extends TokenType>(
	type: Type,
	value: string,
	rangeStart = 0,
): Token<Type> {
	return { type, value, range: [rangeStart, rangeStart + value.length] }
}

export function isToken<Type extends TokenType>(
	...desiredTypes: NonEmptyArray<Type>
): (token: Token) => token is Token<Type> {
	return (token): token is Token<Type> =>
		(desiredTypes as NonEmptyArray<TokenType>).includes(token.type)
}

export function isNotToken<Type extends TokenType>(
	...undesiredTypes: NonEmptyArray<Type>
): (token: Token) => token is Token<Exclude<TokenType, Type>> {
	return (token): token is Token<Exclude<TokenType, Type>> =>
		!(undesiredTypes as NonEmptyArray<TokenType>).includes(token.type)
}

export function tokenRangeEnd(tokens: Tokens): number {
	return tokens.at(-1)?.range[1] ?? 0
}

export function tokenOverflowRange(tokens: Tokens, maxLength: number): CharacterRange | null {
	let length = 0
	let overflowStart = 0
	let overflowEnd = 0

	for (const token of tokens) {
		length += token.value.length

		if (length > maxLength) {
			if (overflowStart === 0) {
				const offset = maxLength - length + token.value.length
				overflowStart = token.range[0] + offset
			}
			overflowEnd = token.range[1]
		}
	}

	return overflowEnd !== overflowStart ? [overflowStart, overflowEnd] : null
}
