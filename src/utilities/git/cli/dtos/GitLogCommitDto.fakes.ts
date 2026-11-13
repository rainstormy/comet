import { fakeCommitSha } from "#types/CommitSha.fakes.ts"
import { type Vector, vectorOf } from "#types/Vector.ts"
import type { GitLogCommitDto } from "#utilities/git/cli/dtos/GitLogCommitDto.ts"

export type GitLogCommitDtoTemplate = Partial<GitLogCommitDto>

export function fakeGitLogCommitDto(overrides: GitLogCommitDtoTemplate = {}): GitLogCommitDto {
	return {
		author: ["Master Splinter <sensei@ninja-academy.com> 1769801867 -0500"],
		commit: [fakeCommitSha()],
		committer: ["Master Splinter <sensei@ninja-academy.com> 1769801867 -0500"],
		gpgsig: [],
		"gpgsig-sha256": [],
		message: ["Introduce a cool feature\n\nIt is really awesome!"],
		parent: [fakeCommitSha()],
		...overrides,
	}
}

export function fakeGitLogCommitDtos<Count extends number>(
	count: Count,
): Vector<GitLogCommitDto, Count> {
	return vectorOf(count, (index) =>
		fakeGitLogCommitDto({
			message: [`Commit ${index + 1}\n\nMore lines of text.`],
		}),
	)
}
