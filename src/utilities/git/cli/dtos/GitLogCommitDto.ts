export type GitLogCommitDto = {
	author: Array<string>
	commit: [string]
	committer: Array<string>
	gpgsig: Array<string>
	"gpgsig-sha256": Array<string>
	message: [string]
	parent: Array<string>
	[key: string]: Array<string>
}
