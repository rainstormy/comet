/**
 * CAUTION: `vitest.config.ts` references this file by its exact pathname `src/utilities/vitest/VitestSetup.fakes.ts`.
 */

import { expect } from "vitest"
import { mockGitBranchCrudeCommits } from "#commits/git/GetGitBranchCrudeCommits.fakes.ts"
import { mockGithubPullRequestCrudeCommits } from "#commits/github/GetGithubPullRequestCrudeCommits.fakes.ts"
import { mockCommands } from "#utilities/commands/RunCommand.fakes.ts"
import { mockFiles } from "#utilities/files/Files.fakes.ts"
import { mockFetch } from "#utilities/http/Fetch.fakes.ts"
import { mockLogger } from "#utilities/logging/Logger.fakes.ts"
import { toContainToken } from "#utilities/vitest/VitestCustomMatchers.fakes.ts"

mockCommands()
mockFetch()
mockFiles()
mockGitBranchCrudeCommits()
mockGithubPullRequestCrudeCommits()
mockLogger()

expect.extend({ toContainToken })
