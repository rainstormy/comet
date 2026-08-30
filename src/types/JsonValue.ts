export type JsonValue = JsonArray | JsonObject | JsonPrimitive

export type JsonArray = Array<JsonValue>

export type JsonObject = {
	[key: string]: JsonValue
}

export type JsonPrimitive = boolean | number | string | null

export type JsonValueFrom<Input> = Input extends JsonValue
	? Input
	: Input extends JsonPrimitive
		? Input
		: Input extends Array<infer Item>
			? Array<JsonValueFrom<Item>>
			: Input extends object
				? {
						[Key in keyof Input as JsonValueFrom<Input[Key]> extends never
							? never
							: Key]: JsonValueFrom<Input[Key]>
					}
				: never
