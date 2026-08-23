import { defineOxfmtConfig } from "@rainstormy/presets-web/oxfmt"
import { defineOxlintConfig, oxlintRestrictedImportPatterns } from "@rainstormy/presets-web/oxlint"
import { type UserConfig, defineConfig } from "vite-plus"

type UserOxfmtConfig = NonNullable<UserConfig["fmt"]>

export default defineConfig({
	fmt: defineOxfmtConfig({ ignorePatterns: ["dist/**/*", "**/*.md"] }) as UserOxfmtConfig,
	lint: defineOxlintConfig({
		ignorePatterns: ["dist/**/*"],
		overrides: [
			{
				files: [
					"src/main-*.ts",
					"src/utilities/files/Files.ts",
					"src/utilities/git/cli/RunGitCommand.ts",
					"src/utilities/github/env/GithubEnv.ts",
				],
				rules: {
					"eslint/no-restricted-imports": [
						"warn",
						{ patterns: oxlintRestrictedImportPatterns({ allowNodejs: true }) },
					],
				},
			},
		],
	}),
	pack: [
		{
			entry: "src/main-cli.ts",
			minify: { compress: true },
		},
		{
			entry: "src/main-gha.ts",
			minify: { compress: true },
			deps: {
				alwaysBundle: ["ansis", "valibot"],
				onlyBundle: ["ansis", "valibot"],
			},
		},
	],
	run: {
		// language=sh
		tasks: {
			build: { command: "vp pack" },
			check: { command: "vp check" },
			fmt: { command: "vp check --fix" },
			install: { command: "vp install --frozen-lockfile --ignore-scripts", cache: false },
			test: { command: "vp test" },
		},
	},
	test: {
		include: ["src/**/*.tests.ts"],
		pool: "vmThreads",
		setupFiles: ["src/utilities/vitest/VitestSetup.fakes.ts"],
		mockReset: true,
		unstubEnvs: true,
		unstubGlobals: true,
	},
})
