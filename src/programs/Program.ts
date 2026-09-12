import { mapCrudeCommitToCommit } from "#commits/Commit.ts"
import type { CrudeCommits } from "#commits/CrudeCommit.ts"
import type { Configuration } from "#configurations/GetConfiguration.ts"
import { mapCommitsToConcerns } from "#rules/concerns/Concern.ts"
import { commitwiseReport } from "#rules/reports/CommitwiseReport.ts"
import { EXIT_CODE_RULE_VIOLATION, EXIT_CODE_SUCCESS, type ExitCode } from "#types/ExitCode.ts"
import { printMessage } from "#utilities/logging/Logger.ts"

export async function program(
	crudeCommits: CrudeCommits,
	configuration: Configuration,
): Promise<ExitCode> {
	const commits = crudeCommits.map((crudeCommit) =>
		mapCrudeCommitToCommit(crudeCommit, configuration.tokens),
	)

	const concerns = mapCommitsToConcerns(commits, configuration.rules)

	if (concerns.length > 0) {
		printMessage(commitwiseReport(concerns, commits, configuration))
		return EXIT_CODE_RULE_VIOLATION
	}

	return EXIT_CODE_SUCCESS
}
