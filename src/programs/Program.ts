import { type Commits, mapCrudeCommitToCommit } from "#commits/Commit.ts"
import type { CrudeCommits } from "#commits/CrudeCommit.ts"
import type { Configuration } from "#configurations/GetConfiguration.ts"
import { type Concerns, mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import { commitwiseReport } from "#rules/reports/CommitwiseReport.ts"
import type { RuleLinkStyle } from "#rules/reports/RuleLink.ts"
import { EXIT_CODE_RULE_VIOLATION, EXIT_CODE_SUCCESS, type ExitCode } from "#types/ExitCode.ts"
import { printMessage } from "#utilities/logging/Logger.ts"

export async function program(
	crudeCommits: CrudeCommits,
	configuration: Configuration,
	options: {
		ruleLinkStyle: RuleLinkStyle
		/**
		 * Returns advice to print after the report of concerns, or `null` to print the report alone.
		 */
		getAdvice?: (concerns: Concerns, commits: Commits) => string | null
	},
): Promise<ExitCode> {
	const commits = crudeCommits.map((crudeCommit) =>
		mapCrudeCommitToCommit(crudeCommit, configuration.tokens),
	)

	const concerns = mapCommitsToConcerns(commits, configuration.rules)

	if (concerns.length > 0) {
		const report = commitwiseReport(concerns, commits, configuration, options.ruleLinkStyle)
		const advice = options.getAdvice?.(concerns, commits) ?? null

		printMessage(advice !== null ? `${report}\n\n${advice}` : report)
		return EXIT_CODE_RULE_VIOLATION
	}

	return EXIT_CODE_SUCCESS
}
