import * as v from "valibot"
import type { GithubUrlString } from "#utilities/github/api/GithubUrlString.ts"
import { githubEnv } from "#utilities/github/env/GithubEnv.ts"

const nextPageRegex = /<(?<nextResourceUrl>\S*)>; rel="next"/iu

/**
 * Retrieves a paginated resource from the GitHub REST API and returns a flattened array.
 *
 * @see https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api?apiVersion=2026-03-10#example-creating-a-pagination-method
 */
export async function fetchGithubResourceDto<Schema extends v.GenericSchema>(
	resourceUrl: `${GithubUrlString}/${string}`,
	schema: Schema,
): Promise<Array<v.InferOutput<Schema>>> {
	const env = githubEnv()

	const arraySchema = v.array(schema)
	const deferredCheckedPages: Array<Promise<Array<v.InferOutput<Schema>>>> = []

	let nextResourceUrl: string | null = resourceUrl

	while (nextResourceUrl !== null) {
		// oxlint-disable-next-line eslint/no-await-in-loop -- The paginated API makes each loop iteration depend on the result of the previous iteration.
		const response: Response = await fetch(nextResourceUrl, {
			headers: {
				accept: "application/vnd.github+json",
				authorization: `Bearer ${env.__secretToken__}`,
				"x-github-api-version": "2026-03-10",
			},
		})

		if (!response.ok) {
			throw new Error(
				`Failed to fetch '${nextResourceUrl}': ${response.status} ${response.statusText}`,
			)
		}

		deferredCheckedPages.push(response.json().then((data: unknown) => v.parse(arraySchema, data)))

		const link = response.headers.get("link")
		const nextPageMatch = link !== null ? nextPageRegex.exec(link) : null

		nextResourceUrl = nextPageMatch?.groups?.nextResourceUrl ?? null
	}

	const checkedPages = await Promise.all(deferredCheckedPages)
	return checkedPages.flat()
}
