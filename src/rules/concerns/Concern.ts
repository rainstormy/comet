import type { Commits } from "#commits/Commit.ts"
import type { RulesetConfiguration } from "#configurations/RulesetConfiguration.ts"
import type { BodyLineConcern } from "#rules/concerns/BodyLineConcern.ts"
import type { CommitConcern } from "#rules/concerns/CommitConcern.ts"
import type { SubjectConcern } from "#rules/concerns/SubjectConcern.ts"
import type { UserIdentityConcern } from "#rules/concerns/UserIdentityConcern.ts"
import { noBlankSubjects } from "#rules/NoBlankSubjects.ts"
import { noExcessiveCommitsPerBranch } from "#rules/NoExcessiveCommitsPerBranch.ts"
import { noExcessiveWhitespace } from "#rules/NoExcessiveWhitespace.ts"
import { noMergeCommits } from "#rules/NoMergeCommits.ts"
import { noRepeatedSubjects } from "#rules/NoRepeatedSubjects.ts"
import { noRestrictedTrailers } from "#rules/NoRestrictedTrailers.ts"
import { noRevertReverts } from "#rules/NoRevertReverts.ts"
import { noSingleWordSubjects } from "#rules/NoSingleWordSubjects.ts"
import { noSquashMarkers } from "#rules/NoSquashMarkers.ts"
import { noUnexpectedPunctuation } from "#rules/NoUnexpectedPunctuation.ts"
import { useAuthorEmailPatterns } from "#rules/UseAuthorEmailPatterns.ts"
import { useAuthorNamePatterns } from "#rules/UseAuthorNamePatterns.ts"
import { useCapitalisedSubjects } from "#rules/UseCapitalisedSubjects.ts"
import { useCommitterEmailPatterns } from "#rules/UseCommitterEmailPatterns.ts"
import { useCommitterNamePatterns } from "#rules/UseCommitterNamePatterns.ts"
import { useConciseSubjects } from "#rules/UseConciseSubjects.ts"
import { useConventionalCommits } from "#rules/UseConventionalCommits.ts"
import { useEmptyLineBeforeBody } from "#rules/UseEmptyLineBeforeBody.ts"
import { useImperativeSubjects } from "#rules/UseImperativeSubjects.ts"
import { useIssueLinks } from "#rules/UseIssueLinks.ts"
import { useLineWrapping } from "#rules/UseLineWrapping.ts"
import { useSignedCommits } from "#rules/UseSignedCommits.ts"
import { type Comparator, uniqueItemsByKey } from "#utilities/Arrays.ts"
import { requireNotNullish } from "#utilities/Assertions.ts"

export type Concern = BodyLineConcern | CommitConcern | SubjectConcern | UserIdentityConcern
export type Concerns = Array<Concern>

export function mapCommitsToConcerns(commits: Commits, ruleset: RulesetConfiguration): Concerns {
	const allConcerns: Concerns = [
		...noBlankSubjects(commits, ruleset),
		...noExcessiveCommitsPerBranch(commits, ruleset),
		...noExcessiveWhitespace(commits, ruleset),
		...noMergeCommits(commits, ruleset),
		...noRepeatedSubjects(commits, ruleset),
		...noRestrictedTrailers(commits, ruleset),
		...noRevertReverts(commits, ruleset),
		...noSingleWordSubjects(commits, ruleset),
		...noSquashMarkers(commits, ruleset),
		...noUnexpectedPunctuation(commits, ruleset),
		...useAuthorEmailPatterns(commits, ruleset),
		...useAuthorNamePatterns(commits, ruleset),
		...useCapitalisedSubjects(commits, ruleset),
		...useCommitterEmailPatterns(commits, ruleset),
		...useCommitterNamePatterns(commits, ruleset),
		...useConciseSubjects(commits, ruleset),
		...useConventionalCommits(commits, ruleset),
		...useEmptyLineBeforeBody(commits, ruleset),
		...useImperativeSubjects(commits, ruleset),
		...useIssueLinks(commits, ruleset),
		...useLineWrapping(commits, ruleset),
		...useSignedCommits(commits, ruleset),
	]

	const uniqueConcerns = uniqueItemsByKey(allConcerns, (concern) => concern.key)

	if (uniqueConcerns.length === 0) {
		return []
	}

	const indicesByCommitSha = new Map(commits.map((commit, index) => [commit.sha, index]))

	const byLocation: Comparator<Concern> = (a, b) => {
		if (a.commitSha === b.commitSha) {
			return a.key.localeCompare(b.key, "en", { numeric: true })
		}

		const commitIndexA = requireNotNullish(
			indicesByCommitSha.get(a.commitSha),
			() => `Concerned commit ${a.commitSha} not found`,
		)
		const commitIndexB = requireNotNullish(
			indicesByCommitSha.get(b.commitSha),
			() => `Concerned commit ${b.commitSha} not found`,
		)

		return commitIndexA - commitIndexB
	}

	return uniqueConcerns.toSorted(byLocation)
}
