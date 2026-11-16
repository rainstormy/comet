import type { CrudeCommit } from "#commits/CrudeCommit.ts"
import { fakeCommitSha } from "#types/CommitSha.fakes.ts"

export type CrudeCommitTemplate = Partial<CrudeCommit>

export function fakeCrudeCommit(overrides: CrudeCommitTemplate = {}): CrudeCommit {
	return {
		parents: overrides.parents ?? [fakeCommitSha()],
		sha: overrides.sha ?? fakeCommitSha(),
		authorName: "Master Splinter",
		authorEmail: "58390854+sensei@users.noreply.github.com",
		committerName: "Leonardo da Vinci",
		committerEmail: "71091436+katanaturtle@users.noreply.github.com",
		message: "Introduce a cool feature\n\nIt is really awesome!",
		signatures: [
			`-----BEGIN SSH SIGNATURE-----
k1MWQyOTVmM2UzY2E0YjFhNWRkN2UyZjY3ODk5MzJlZDM1NTRlZmY3NWY5OTg1OWFjMzdj
OWQ4MjI3OWFhMGIzYTE2N2U/YWNmMTVkMzVhNzE0NyI4ZmZiODFkNzk1ZWVhM2QxOWMwNT
YzFmMDExZWZiZGQ1NzAxNTQxYWY1YTQ0MTI4YzE4N2UzNTc3ZjNiMjg+3NzVmNjBkNmIyM
jQkODBmOWFlNmNlOTU4GU=
-----END SSH SIGNATURE-----`,
		],
		...overrides,
	}
}
