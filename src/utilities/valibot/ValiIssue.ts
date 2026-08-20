import type * as v from "valibot"

export type ValiIssue = {
	issue: v.GenericIssue
	path: Array<v.IssuePathItem>
}

/**
 * Traverses a Valibot issue and recursively selects the first nested issue to uncover more details.
 */
export function getDetailedValiIssue(issue: v.GenericIssue): ValiIssue {
	const currentIssue: ValiIssue = { issue, path: issue.path ?? [] }

	if (issue.issues === undefined) {
		return currentIssue
	}

	let mostSpecificIssue = currentIssue

	for (const nestedIssue of issue.issues) {
		const candidate = getDetailedValiIssue(nestedIssue)
		const candidateWithParentPath: ValiIssue = {
			issue: candidate.issue,
			path: [...currentIssue.path, ...candidate.path],
		}

		if (
			mostSpecificIssue === currentIssue &&
			candidateWithParentPath.path.length > currentIssue.path.length
		) {
			mostSpecificIssue = candidateWithParentPath
		}
	}

	return mostSpecificIssue
}
