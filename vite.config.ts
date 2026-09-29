import { defineOxfmtConfig } from "@rainstormy/presets-web/oxfmt"
import { defineOxlintConfig, oxlintRestrictedImportPatterns } from "@rainstormy/presets-web/oxlint"
import { type UserConfig, defineConfig } from "vite-plus"

const bundledDependencies = ["ansis", "strip-json-comments", "valibot"]

type UserOxfmtConfig = NonNullable<UserConfig["fmt"]>

/**
 * Configure Vite+.
 *
 * @see https://viteplus.dev/config
 */
export default defineConfig({
	/**
	 * Configure Oxfmt.
	 *
	 * @see https://viteplus.dev/config/fmt
	 * @see https://oxc.rs/docs/guide/usage/formatter/config.html
	 */
	fmt: defineOxfmtConfig({ ignorePatterns: ["dist/**/*", "**/*.md"] }) as UserOxfmtConfig,

	/**
	 * Configure Oxlint.
	 *
	 * @see https://viteplus.dev/config/lint
	 * @see https://oxc.rs/docs/guide/usage/linter/config.html
	 */
	lint: defineOxlintConfig({
		ignorePatterns: ["dist/**/*"],
		options: { typeCheck: false },
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

	/**
	 * Configure tsdown.
	 *
	 * @see https://viteplus.dev/config/pack
	 * @see https://tsdown.dev/options/config-file
	 */
	pack: [
		{
			entry: "src/main-cli.ts",
			minify: { compress: true },
			deps: { alwaysBundle: bundledDependencies, onlyBundle: bundledDependencies },
		},
		{
			entry: "src/main-gha.ts",
			minify: { compress: true },
			deps: { alwaysBundle: bundledDependencies, onlyBundle: bundledDependencies },
		},
	],

	/**
	 * Define tasks.
	 *
	 * @see https://viteplus.dev/config/run
	 */
	run: {
		// language=sh
		tasks: {
			build: { command: ["vp pack", "node tools/jsonschema.script.ts"] },
			check: { command: "vp lint --type-check" },
			comet: { command: "node src/main-cli.ts --config .github/comet.jsonc", cache: false },
			fmt: { command: "vp check --fix" },
			install: { command: "vp install --frozen-lockfile --ignore-scripts", cache: false },
			setup: { command: "node tools/setup.script.ts", cache: false },
			test: { command: "vp test" },
		},
	},

	/**
	 * Configure lint-staged for the pre-commit hook.
	 *
	 * @see https://viteplus.dev/config/staged
	 * @see https://github.com/lint-staged/lint-staged
	 */
	// language=sh
	staged: {
		"*.{json,jsonc,md,ts,yaml}": "vpr fmt",
	},

	/**
	 * Configure Vitest.
	 *
	 * @see https://viteplus.dev/config/test
	 * @see https://vitest.dev/config
	 */
	test: {
		fsModuleCache: true,
		include: ["src/**/*.tests.ts"],
		pool: "vmThreads",
		setupFiles: ["src/utilities/vitest/VitestSetup.fakes.ts"],
		mockReset: true,
		unstubEnvs: true,
		unstubGlobals: true,
	},
})
