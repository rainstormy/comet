import { beforeEach, describe, expect, it } from "vitest"
import { mockCommand } from "#utilities/commands/RunCommand.fakes.ts"
import { runCommand } from "#utilities/commands/RunCommand.ts"
import type { GitLogCommitDto } from "#utilities/git/cli/dtos/GitLogCommitDto.ts"
import { getGitLog } from "#utilities/git/cli/GetGitLog.ts"

describe.each`
	fromRef                                        | toRef
	${"github/main"}                               | ${"HEAD"}
	${"19b5b1b71002186c0b02d4d852cc65d358b70141a"} | ${"origin/develop"}
`(
	"when there are no commits between $fromRef and $toRef",
	(props: { fromRef: string; toRef: string }) => {
		beforeEach(() => {
			mockCommand(`git --no-pager log --format=raw --no-color ${props.fromRef}..${props.toRef}`, {
				output: "",
			})
		})

		it("returns an empty list", async () => {
			const actualCommits = await getGitLog(props.fromRef, props.toRef)
			expect(actualCommits).toEqual<Array<GitLogCommitDto>>([])
		})
	},
)

describe("when there is 1 commit with no parents", () => {
	beforeEach(() => {
		mockCommand("git --no-pager log --format=raw --no-color origin/main..HEAD", {
			output: `
commit d13efe7d13084bf4a026f74349478d40a713949e
tree 6feccc6788c0ef8667a9aaf6386d72b6b5deba17
author Leonardo da Vinci <71091436+katanaturtle@users.noreply.github.com> 1766222736 -0500
committer Leonardo da Vinci <71091436+katanaturtle@users.noreply.github.com> 1766222736 -0500

    init
`.trimStart(),
		})
	})

	it("returns a list of 1 commit", async () => {
		const actualCommits = await getGitLog("origin/main", "HEAD")
		expect(actualCommits).toEqual<Array<GitLogCommitDto>>([
			{
				commit: ["d13efe7d13084bf4a026f74349478d40a713949e"],
				parent: [],
				tree: ["6feccc6788c0ef8667a9aaf6386d72b6b5deba17"],
				author: [
					"Leonardo da Vinci <71091436+katanaturtle@users.noreply.github.com> 1766222736 -0500",
				],
				committer: [
					"Leonardo da Vinci <71091436+katanaturtle@users.noreply.github.com> 1766222736 -0500",
				],
				gpgsig: [],
				message: ["init"],
			},
		])
	})
})

describe("when there is 1 commit with a single parent", () => {
	beforeEach(() => {
		mockCommand("git --no-pager log --format=raw --no-color origin/main..HEAD", {
			output: `
commit 3ed87c9813318c942b8729d52b84027b584b5
tree d8242af2d280a7805e8d481a8ac36b7224edde6d
parent b34f54dae2045478f57846dfdd5762f4afb721
author Raph <theraffaelloexperience@tmnt.com> 1769800893 -0500
committer Master Splinter <sensei@ninja-academy.com> 1769801867 -0500

    fixup! fighting the foot clan
`.trimStart(),
		})
	})

	it("returns a list of 1 commit", async () => {
		const actualCommits = await getGitLog("origin/main", "HEAD")
		expect(actualCommits).toEqual<Array<GitLogCommitDto>>([
			{
				commit: ["3ed87c9813318c942b8729d52b84027b584b5"],
				tree: ["d8242af2d280a7805e8d481a8ac36b7224edde6d"],
				parent: ["b34f54dae2045478f57846dfdd5762f4afb721"],
				author: ["Raph <theraffaelloexperience@tmnt.com> 1769800893 -0500"],
				committer: ["Master Splinter <sensei@ninja-academy.com> 1769801867 -0500"],
				gpgsig: [],
				message: ["fixup! fighting the foot clan"],
			},
		])
	})
})

describe("when there is 1 commit with 2 parents", () => {
	beforeEach(() => {
		mockCommand("git --no-pager log --format=raw --no-color origin/main..HEAD", {
			output: `
commit 13441212913598c08d18d15ccc3aed86ab24a1b
tree b03e611c6d8ff9c63932ef5868253fc52c65cc
parent fd2d1de72b1ac59bfb375a0e1e946926ceb99d
parent 7ea6b181df3b6cac8989a46cc6623f74d686dd1
author April O'Neil <april@secondtimearound.com> 1771411236 -0500
committer Donatello <42069849+gogogadget@users.noreply.github.com> 1771411407 -0500

    Deliver unlimited power with technological genius
`.trimStart(),
		})
	})

	it("returns a list of 1 commit", async () => {
		const actualCommits = await getGitLog("origin/main", "HEAD")
		expect(actualCommits).toEqual<Array<GitLogCommitDto>>([
			{
				commit: ["13441212913598c08d18d15ccc3aed86ab24a1b"],
				tree: ["b03e611c6d8ff9c63932ef5868253fc52c65cc"],
				parent: [
					"fd2d1de72b1ac59bfb375a0e1e946926ceb99d",
					"7ea6b181df3b6cac8989a46cc6623f74d686dd1",
				],
				author: ["April O'Neil <april@secondtimearound.com> 1771411236 -0500"],
				committer: ["Donatello <42069849+gogogadget@users.noreply.github.com> 1771411407 -0500"],
				gpgsig: [],
				message: ["Deliver unlimited power with technological genius"],
			},
		])
	})
})

describe("when there is 1 commit with 3 parents", () => {
	beforeEach(() => {
		mockCommand("git --no-pager log --format=raw --no-color origin/main..HEAD", {
			output: `
commit 6bbee9b37a298f5e9140127d6363ed1d69d44f
tree 10205843deec3d2f71d4c1cc52a898467f246a7b
parent 5d5a4a61a0ac31c52c8f24412fa4732dfae48a9
parent 67c7cf2a57f70ab31eb375337b4ff5db31b6829
parent 6eb0d577bc0dd5b35949dc16f95882c75d9c7dd
author Michelangelo di Lodovico Buonarroti Simoni <cowabunga@pizza-party.com> 1784831778 -0500
committer Casey "Goongala" Jones <case@pizza-party.com> 1784831778 -0500

    Let's gather all mutants for a massive pizza party!!

    Under parental supervision, of course ;)
`.trimStart(),
		})
	})

	it("returns a list of 1 commit", async () => {
		const actualCommits = await getGitLog("origin/main", "HEAD")
		expect(actualCommits).toEqual<Array<GitLogCommitDto>>([
			{
				commit: ["6bbee9b37a298f5e9140127d6363ed1d69d44f"],
				tree: ["10205843deec3d2f71d4c1cc52a898467f246a7b"],
				parent: [
					"5d5a4a61a0ac31c52c8f24412fa4732dfae48a9",
					"67c7cf2a57f70ab31eb375337b4ff5db31b6829",
					"6eb0d577bc0dd5b35949dc16f95882c75d9c7dd",
				],
				author: [
					"Michelangelo di Lodovico Buonarroti Simoni <cowabunga@pizza-party.com> 1784831778 -0500",
				],
				committer: ['Casey "Goongala" Jones <case@pizza-party.com> 1784831778 -0500'],
				gpgsig: [],
				message: [
					"Let's gather all mutants for a massive pizza party!!\n\nUnder parental supervision, of course ;)",
				],
			},
		])
	})
})

describe("when there is 1 commit with a signature", () => {
	beforeEach(() => {
		mockCommand("git --no-pager log --format=raw --no-color origin/main..HEAD", {
			output: `
commit 76c79cc7bd33295c2c53aff2d1a25c9e698ab10
tree f36f404d67ee425b1e8e3374222eeb8cecff54
parent b8f2e2cca67d1e1866a58848c259d11b9c8f1
author Master Splinter <sensei@ninja-academy.com> 1675536219 +0100
committer Master Splinter <sensei@ninja-academy.com> 1675536219 +0100
gpgsig -----BEGIN SSH SIGNATURE-----
 k1MWQyOTVmM2UzY2E0YjFhNWRkN2UyZjY3ODk5MzJlZDM1NTRlZmY3NWY5OTg1OWFjMzdj
 OWQ4MjI3OWFhMGIzYTE2N2U/YWNmMTVkMzVhNzE0NyI4ZmZiODFkNzk1ZWVhM2QxOWMwNT
 YzFmMDExZWZiZGQ1NzAxNTQxYWY1YTQ0MTI4YzE4N2UzNTc3ZjNiMjg+3NzVmNjBkNmIyM
 jQkODBmOWFlNmNlOTU4GU=
 -----END SSH SIGNATURE-----

    Teach them the ancient signature move
`.trimStart(),
		})
	})

	it("returns a list of 1 commit", async () => {
		const actualCommits = await getGitLog("origin/main", "HEAD")
		expect(actualCommits).toEqual<Array<GitLogCommitDto>>([
			{
				commit: ["76c79cc7bd33295c2c53aff2d1a25c9e698ab10"],
				tree: ["f36f404d67ee425b1e8e3374222eeb8cecff54"],
				parent: ["b8f2e2cca67d1e1866a58848c259d11b9c8f1"],
				author: ["Master Splinter <sensei@ninja-academy.com> 1675536219 +0100"],
				committer: ["Master Splinter <sensei@ninja-academy.com> 1675536219 +0100"],
				gpgsig: [
					"-----BEGIN SSH SIGNATURE-----\n" +
						"k1MWQyOTVmM2UzY2E0YjFhNWRkN2UyZjY3ODk5MzJlZDM1NTRlZmY3NWY5OTg1OWFjMzdj\n" +
						"OWQ4MjI3OWFhMGIzYTE2N2U/YWNmMTVkMzVhNzE0NyI4ZmZiODFkNzk1ZWVhM2QxOWMwNT\n" +
						"YzFmMDExZWZiZGQ1NzAxNTQxYWY1YTQ0MTI4YzE4N2UzNTc3ZjNiMjg+3NzVmNjBkNmIyM\n" +
						"jQkODBmOWFlNmNlOTU4GU=\n" +
						"-----END SSH SIGNATURE-----",
				],
				message: ["Teach them the ancient signature move"],
			},
		])
	})
})

describe("when there are 5 commits", () => {
	beforeEach(() => {
		mockCommand("git --no-pager log --format=raw --no-color origin/main..HEAD", {
			output: `
commit 2128dcace99359e3a48329c99a4427ab9618433
tree 81211f2bd34af2b685705a50eaa6df9bb705591
parent 58bab2d74be7e9d1ec4acd59d6de43ef27c651
parent 1643d4a4aac6f87fae4fd79fca43ea6553cb4e0
author renovate[bot] <29139614+renovate[bot]@users.noreply.github.com> 1770501822 +0000
committer GitHub <noreply@github.com> 1770501822 +0100
gpgsig -----BEGIN PGP SIGNATURE-----

 MDNjYTMwZTktZTk5ZC00MDgxLTg3MWEtYTNiODJlZjlhNjViNWU4OThlOGYtNjM3
 Mi00ZGFhLWFjYTU+MDQ0ODM3NTAxODZiMGUzY2M4Y2EtMDM2OC00OTlkLWIzYmYt
 NTc3OTM3ZTJjZGJjYTM1MGI3NWItMDdhMC00MzMwLWFhYT+tNjAwZDdjYTFhM2Vi
 NWQ0NWVmOWEtYzNiMS00YWM1LWFhYzMtNDYzOTJmMjJhZTdkNzc/NTU5ZmYtY2Jh
 Y/00ZDM3LWEyMTctMjZhZGExMmIx/zRlMmQ3MT+kYzItODcwZC00MjExLWFjOGUt
 ZGY5MWJkNTBkMDM5MjkwNjNlNjctZmY/Yi00MjlmLTlhMDctOGVhZDM0OGFiMTk4
 MzhmNzZkMWEtMTZkMi00Mzg2LWI2ZTItZmNlNzNlYmFjNjJiNjc4YWRmOTUtNWQx
 Ny00YTgxLWJlN2Qt+zM2M2NhZmUzYWEyYmMzOTE5MTgtMWQxNS00YjJiLTg1YzUt
 ODFhZmU5OTE1OGZiYTE5Yjl/NzItZGMzYy00MGFlLTg0MDEtYWM1MzcxNWU1ZmU4
 YzVkN2U0OGItZDIzMC00MmEyLWJiYWYtYTUxZTA5O+MwYTY0ZmU1ZTQ1MTMtZjQy
 Mi00Y2YwLWIxODYtM2I5ZmUxNGZhOTBhM2I0MmFjMzQtMjQ1MC00ZGZmLThlNzYt
 NS00Zj+wLTg2Y2YtMzEw
 =ODMt
 -----END PGP SIGNATURE-----


    Merge pull request #440 from renovate/battle-shell-7.x

    Upgrade the Battle Shell to 7.3.1

commit 1643d4a4aac6f87fae4fd79fca43ea6553cb4e0
tree ec2365a11da8b0e8245669825db1ee2834adbd42
parent 319ec7772bcf224ee2e8bb4ad0e583e5dc9af0
author renovate[bot] <29139614+renovate[bot]@users.noreply.github.com> 1770330737 +0000
committer GitHub <noreply@github.com> 1770330737 +0000
gpgsig -----BEGIN PGP SIGNATURE-----

 MDgzZDZkNmFkYzRmMDAyYjFlNDQtYjI5NC00MjEzLTk0MzAtMWVkNmJjZDEyNjc2
 MTRmODJlYzItYWM2Mi00OGE0LWExZDAtMzhmOWQ0ZTgzO+VkZDRjYmFlZjQtNGZl
 Mi00NGJkLWJkMDUtZTRiNTc0YTEzZWQ4ZTU2NTBjZDEtNzky/S00YWZjLThkMDgt
 OTcwYmFlODI3MDE2MW/mZmJkNzQtMjllNS00MDkxLTgwOGItMjNjZDJkZGIwNjY1
 YTBhNzlmMmQtNmI3Zi+0ZWQ2LTkwOGYtNGYzNGE5ZjMwNzk5ODUwYjU5M2EtYWU4
 Yy00MmZmLWI2ZjAtOWE1ZTZhZGUzZjE5YTU4ZThiZGEtZjBiYS00MTQzLTk0NGEt
 Y2NiY/dmOTk1NDJkZjY1Yjc0YTctZTdjZi00ZTUxLWE5ZjItNzkxZjg3YjU3YjQx
 YmVhNzY1M2ItZWFkNC00Yzg4LTg+YzctMzZkNzcwMjdhNzlmOWE3Nm//ODYtNmFm
 Mi00ZjQyLTkyNDMtNTRlYW+4OGY5OWJmNDA4N2YzNjItNjZjZS00ZWUyLWIyMjYt
 NGI3NzQzZWIxODZiMjIyZDY0N2YtMmQ4MC00NjRmLTljY2UtYjZjMzBmZThmYzZk
 ZWU3YTZhN2EtYTk0OC00OTY0LWFlZDEtZ/A5NTY3YjczODM5ZTBmM2ZjNDUtN2U2
 NWNjMTg+MTQxMWZlMDUy
 =NjRk
 -----END PGP SIGNATURE-----


    Upgrade the Battle Shell to 7.3.1
`.trimStart(),
		})
	})

	it("returns a list of 2 commits", async () => {
		const actualCommits = await getGitLog("origin/main", "HEAD")
		expect(actualCommits).toEqual<Array<GitLogCommitDto>>([
			{
				commit: ["2128dcace99359e3a48329c99a4427ab9618433"],
				tree: ["81211f2bd34af2b685705a50eaa6df9bb705591"],
				parent: [
					"58bab2d74be7e9d1ec4acd59d6de43ef27c651",
					"1643d4a4aac6f87fae4fd79fca43ea6553cb4e0",
				],
				author: [
					"renovate[bot] <29139614+renovate[bot]@users.noreply.github.com> 1770501822 +0000",
				],
				committer: ["GitHub <noreply@github.com> 1770501822 +0100"],
				gpgsig: [
					"-----BEGIN PGP SIGNATURE-----\n" +
						"\n" +
						"MDNjYTMwZTktZTk5ZC00MDgxLTg3MWEtYTNiODJlZjlhNjViNWU4OThlOGYtNjM3\n" +
						"Mi00ZGFhLWFjYTU+MDQ0ODM3NTAxODZiMGUzY2M4Y2EtMDM2OC00OTlkLWIzYmYt\n" +
						"NTc3OTM3ZTJjZGJjYTM1MGI3NWItMDdhMC00MzMwLWFhYT+tNjAwZDdjYTFhM2Vi\n" +
						"NWQ0NWVmOWEtYzNiMS00YWM1LWFhYzMtNDYzOTJmMjJhZTdkNzc/NTU5ZmYtY2Jh\n" +
						"Y/00ZDM3LWEyMTctMjZhZGExMmIx/zRlMmQ3MT+kYzItODcwZC00MjExLWFjOGUt\n" +
						"ZGY5MWJkNTBkMDM5MjkwNjNlNjctZmY/Yi00MjlmLTlhMDctOGVhZDM0OGFiMTk4\n" +
						"MzhmNzZkMWEtMTZkMi00Mzg2LWI2ZTItZmNlNzNlYmFjNjJiNjc4YWRmOTUtNWQx\n" +
						"Ny00YTgxLWJlN2Qt+zM2M2NhZmUzYWEyYmMzOTE5MTgtMWQxNS00YjJiLTg1YzUt\n" +
						"ODFhZmU5OTE1OGZiYTE5Yjl/NzItZGMzYy00MGFlLTg0MDEtYWM1MzcxNWU1ZmU4\n" +
						"YzVkN2U0OGItZDIzMC00MmEyLWJiYWYtYTUxZTA5O+MwYTY0ZmU1ZTQ1MTMtZjQy\n" +
						"Mi00Y2YwLWIxODYtM2I5ZmUxNGZhOTBhM2I0MmFjMzQtMjQ1MC00ZGZmLThlNzYt\n" +
						"NS00Zj+wLTg2Y2YtMzEw\n" +
						"=ODMt\n" +
						"-----END PGP SIGNATURE-----\n",
				],
				message: [
					"Merge pull request #440 from renovate/battle-shell-7.x\n\nUpgrade the Battle Shell to 7.3.1",
				],
			},
			{
				commit: ["1643d4a4aac6f87fae4fd79fca43ea6553cb4e0"],
				tree: ["ec2365a11da8b0e8245669825db1ee2834adbd42"],
				parent: ["319ec7772bcf224ee2e8bb4ad0e583e5dc9af0"],
				author: [
					"renovate[bot] <29139614+renovate[bot]@users.noreply.github.com> 1770330737 +0000",
				],
				committer: ["GitHub <noreply@github.com> 1770330737 +0000"],
				gpgsig: [
					"-----BEGIN PGP SIGNATURE-----\n" +
						"\n" +
						"MDgzZDZkNmFkYzRmMDAyYjFlNDQtYjI5NC00MjEzLTk0MzAtMWVkNmJjZDEyNjc2\n" +
						"MTRmODJlYzItYWM2Mi00OGE0LWExZDAtMzhmOWQ0ZTgzO+VkZDRjYmFlZjQtNGZl\n" +
						"Mi00NGJkLWJkMDUtZTRiNTc0YTEzZWQ4ZTU2NTBjZDEtNzky/S00YWZjLThkMDgt\n" +
						"OTcwYmFlODI3MDE2MW/mZmJkNzQtMjllNS00MDkxLTgwOGItMjNjZDJkZGIwNjY1\n" +
						"YTBhNzlmMmQtNmI3Zi+0ZWQ2LTkwOGYtNGYzNGE5ZjMwNzk5ODUwYjU5M2EtYWU4\n" +
						"Yy00MmZmLWI2ZjAtOWE1ZTZhZGUzZjE5YTU4ZThiZGEtZjBiYS00MTQzLTk0NGEt\n" +
						"Y2NiY/dmOTk1NDJkZjY1Yjc0YTctZTdjZi00ZTUxLWE5ZjItNzkxZjg3YjU3YjQx\n" +
						"YmVhNzY1M2ItZWFkNC00Yzg4LTg+YzctMzZkNzcwMjdhNzlmOWE3Nm//ODYtNmFm\n" +
						"Mi00ZjQyLTkyNDMtNTRlYW+4OGY5OWJmNDA4N2YzNjItNjZjZS00ZWUyLWIyMjYt\n" +
						"NGI3NzQzZWIxODZiMjIyZDY0N2YtMmQ4MC00NjRmLTljY2UtYjZjMzBmZThmYzZk\n" +
						"ZWU3YTZhN2EtYTk0OC00OTY0LWFlZDEtZ/A5NTY3YjczODM5ZTBmM2ZjNDUtN2U2\n" +
						"NWNjMTg+MTQxMWZlMDUy\n" +
						"=NjRk\n" +
						"-----END PGP SIGNATURE-----\n",
				],
				message: ["Upgrade the Battle Shell to 7.3.1"],
			},
		])
	})
})

describe("when there are 4 commits", () => {
	beforeEach(() => {
		mockCommand("git --no-pager log --format=raw --no-color origin/main..HEAD", {
			output: `
commit f319eba917534964b83177abaa3de4bee24ee0fd
tree e5aeef82441e9041529c2d36c462cc9d5520e3
parent 9cd55379ae9a5107dcfd4dc8637b597112947be
author Mortu <mortu@utroms.outerspace> 1873522994 +1000
committer Professor Honeycutt <fugitoid@dhoonib.outerspace> 1873573232 +0900
gpgsig -----BEGIN PGP SIGNATURE-----

 ZGI3OTFkZmItZTVhNS00ZGFjLTlkODUtNDVjOGM5MzNiMDI/+GI2MGY4YzEtMjc4
 NS00YzU0LWI5N2YtNTcxY/ZiYmIxZGNjODEzZW/3OGMtYzVmZS00ZWQ4LTgxMmYt
 Y2FmMTlkZDUxOGRkYmU+YjY4YjYtODQ2Zi00M2E0LWIyNmItNmUyYTcwNGViMDgw
 ZTVlY2RhNGYtYWY5ZS00ZDkwLTg4MmEtMTJmYzY2OWU5ZGI5NmM4ZjhhZjktODRm
 Yi00NWZjLTk5ODEtODU4NWI1MDY1OWM1ZGY5M2+0YT/tODFlYS00OWU0LTkxMGQt
 M2Y0/zIzZTNmY2Q4N2ZjZWFlZW+tMzEwMi00ODZhLTk1ZGYtYTY2NGE0NjhlZWY2
 M2E1NjQ5OGItYz/4Mi00ZGI2LTlkZjktNGY2ZGEzMGRkYjFiMDJlMDhkNWItMWU3
 OC00OTFlLThhZjQtMjE4NDIwNzlmYjg5YTQ4MGYwMz/tNjc4ZC00YTVmLWJiO+Qt
 ZTJkYmVlNWY0MDAyYWMzMzJlMDYtNWM2Ni00NDllLWEyM2MtMTM2NGI2ZDdhZDI2
 ODYy/jEwZWItOGI4Mi00YTZkLWIzZ/ktNWQ4N2+wOTBiMDE5N2Y4NTBiNjAtYjlk
 OC00OWQ0LWIxNTgtNTQ1OWM1MmEyODAyMjBmODQ1YzctMGE4Ny00NTNhLWJjNTAt
 2LWE5ZGMtN+A3YjI0OTI
 =wN2M
 -----END PGP SIGNATURE-----


    A visit from Outer Space

commit 9cd55379ae9a5107dcfd4dc8637b597112947be
tree 3b4568b7e333c17d5777bdfc919832ace2e0ae56
parent b314f63fc4e891b47a44358cf5aeac5bb2e9820
author Leonardo da Vinci <71091436+katanaturtle@users.noreply.github.com> 1809064863 -0500
committer Donatello <42069849+gogogadget@users.noreply.github.com> 1809068484 -0500

    stealth: be one with the shadows

    mutant chain reaction
    in the underground

commit b314f63fc4e891b47a44358cf5aeac5bb2e9820
tree c9b89de1ee14b433fb37608d612b78143cb2949d
parent 26ecb332bc4787332cc9bb5fff90c8100225a69ff
author Oroku Saki <shredderhimself@thefoot.com> 1723364474 -0400
committer Karai <02968712+misssaki@users.noreply.github.com> 1723469209 -0400

    squash! the defects

commit 26ecb332bc4787332cc9bb5fff90c8100225a69ff
tree bd30f04235483f8c8732e5858259e019a3c3f
parent 7510ce207c15627da956d49da26f2726c36270
author Cody Jones <cody.jones@oneil.tech> 4265024500 +0000
committer Serling <10930296+turtle-x@users.noreply.github.com> 4265024500 +0000
gpgsig -----BEGIN SSH SIGNATURE-----
 OWJiNzhkYWJ+MmM3ZTdiZjhhNWMtMzU3MC00MGQxLTk/MTAtZWUzNDMyZTA4ZjU2NDdjMT
 c2NjYtNzIwYi00MTFjLTk+Y2UtYmY5NDc5M2NjMzEwYTg5NzY3ZjItMmVlNi00NzkwLWE0
 OWEtMDEwYTg3ZDYzODFjODljNTFiYmUtN2I5ZC00ZDMyLTlmZTMtNzUyOTAwOGE3OD/wMz
 QwYjUwNTAtM/QxNy00M2Y=
 -----END SSH SIGNATURE-----

    FAST FORWARD! #2105

    back, back, back to the sewers
`.trimStart(),
		})
	})

	it("returns a list of 4 commits", async () => {
		const actualCommits = await getGitLog("origin/main", "HEAD")
		expect(actualCommits).toEqual<Array<GitLogCommitDto>>([
			{
				commit: ["f319eba917534964b83177abaa3de4bee24ee0fd"],
				tree: ["e5aeef82441e9041529c2d36c462cc9d5520e3"],
				parent: ["9cd55379ae9a5107dcfd4dc8637b597112947be"],
				author: ["Mortu <mortu@utroms.outerspace> 1873522994 +1000"],
				committer: ["Professor Honeycutt <fugitoid@dhoonib.outerspace> 1873573232 +0900"],
				gpgsig: [
					"-----BEGIN PGP SIGNATURE-----\n" +
						"\n" +
						"ZGI3OTFkZmItZTVhNS00ZGFjLTlkODUtNDVjOGM5MzNiMDI/+GI2MGY4YzEtMjc4\n" +
						"NS00YzU0LWI5N2YtNTcxY/ZiYmIxZGNjODEzZW/3OGMtYzVmZS00ZWQ4LTgxMmYt\n" +
						"Y2FmMTlkZDUxOGRkYmU+YjY4YjYtODQ2Zi00M2E0LWIyNmItNmUyYTcwNGViMDgw\n" +
						"ZTVlY2RhNGYtYWY5ZS00ZDkwLTg4MmEtMTJmYzY2OWU5ZGI5NmM4ZjhhZjktODRm\n" +
						"Yi00NWZjLTk5ODEtODU4NWI1MDY1OWM1ZGY5M2+0YT/tODFlYS00OWU0LTkxMGQt\n" +
						"M2Y0/zIzZTNmY2Q4N2ZjZWFlZW+tMzEwMi00ODZhLTk1ZGYtYTY2NGE0NjhlZWY2\n" +
						"M2E1NjQ5OGItYz/4Mi00ZGI2LTlkZjktNGY2ZGEzMGRkYjFiMDJlMDhkNWItMWU3\n" +
						"OC00OTFlLThhZjQtMjE4NDIwNzlmYjg5YTQ4MGYwMz/tNjc4ZC00YTVmLWJiO+Qt\n" +
						"ZTJkYmVlNWY0MDAyYWMzMzJlMDYtNWM2Ni00NDllLWEyM2MtMTM2NGI2ZDdhZDI2\n" +
						"ODYy/jEwZWItOGI4Mi00YTZkLWIzZ/ktNWQ4N2+wOTBiMDE5N2Y4NTBiNjAtYjlk\n" +
						"OC00OWQ0LWIxNTgtNTQ1OWM1MmEyODAyMjBmODQ1YzctMGE4Ny00NTNhLWJjNTAt\n" +
						"2LWE5ZGMtN+A3YjI0OTI\n" +
						"=wN2M\n" +
						"-----END PGP SIGNATURE-----\n",
				],
				message: ["A visit from Outer Space"],
			},
			{
				commit: ["9cd55379ae9a5107dcfd4dc8637b597112947be"],
				tree: ["3b4568b7e333c17d5777bdfc919832ace2e0ae56"],
				parent: ["b314f63fc4e891b47a44358cf5aeac5bb2e9820"],
				author: [
					"Leonardo da Vinci <71091436+katanaturtle@users.noreply.github.com> 1809064863 -0500",
				],
				committer: ["Donatello <42069849+gogogadget@users.noreply.github.com> 1809068484 -0500"],
				gpgsig: [],
				message: ["stealth: be one with the shadows\n\nmutant chain reaction\nin the underground"],
			},
			{
				commit: ["b314f63fc4e891b47a44358cf5aeac5bb2e9820"],
				tree: ["c9b89de1ee14b433fb37608d612b78143cb2949d"],
				parent: ["26ecb332bc4787332cc9bb5fff90c8100225a69ff"],
				author: ["Oroku Saki <shredderhimself@thefoot.com> 1723364474 -0400"],
				committer: ["Karai <02968712+misssaki@users.noreply.github.com> 1723469209 -0400"],
				gpgsig: [],
				message: ["squash! the defects"],
			},
			{
				commit: ["26ecb332bc4787332cc9bb5fff90c8100225a69ff"],
				tree: ["bd30f04235483f8c8732e5858259e019a3c3f"],
				parent: ["7510ce207c15627da956d49da26f2726c36270"],
				author: ["Cody Jones <cody.jones@oneil.tech> 4265024500 +0000"],
				committer: ["Serling <10930296+turtle-x@users.noreply.github.com> 4265024500 +0000"],
				gpgsig: [
					"-----BEGIN SSH SIGNATURE-----\n" +
						"OWJiNzhkYWJ+MmM3ZTdiZjhhNWMtMzU3MC00MGQxLTk/MTAtZWUzNDMyZTA4ZjU2NDdjMT\n" +
						"c2NjYtNzIwYi00MTFjLTk+Y2UtYmY5NDc5M2NjMzEwYTg5NzY3ZjItMmVlNi00NzkwLWE0\n" +
						"OWEtMDEwYTg3ZDYzODFjODljNTFiYmUtN2I5ZC00ZDMyLTlmZTMtNzUyOTAwOGE3OD/wMz\n" +
						"QwYjUwNTAtM/QxNy00M2Y=\n" +
						"-----END SSH SIGNATURE-----",
				],
				message: ["FAST FORWARD! #2105\n\nback, back, back to the sewers"],
			},
		])
	})
})

describe("when the 'git log' command fails", () => {
	beforeEach(() => {
		mockCommand("git --no-pager log --format=raw --no-color upstream/next..HEAD", {
			exitCode: 128,
		})
	})

	it("throws an error", async () => {
		await expect(getGitLog("upstream/next", "HEAD")).rejects.toThrow(
			"Command 'git --no-pager log --format=raw --no-color upstream/next..HEAD' failed with exit code 128",
		)
	})
})

describe("when the 'from-ref' parameter contains spaces", () => {
	beforeEach(() => {
		mockCommand("git --no-pager log --format=raw --no-color main --output=victim.txt ..HEAD", {
			output: "",
		})
	})

	it("passes the whole range as a single argument to the Git client", async () => {
		await getGitLog("main --output=victim.txt ", "HEAD")
		expect(runCommand).toHaveBeenCalledExactlyOnceWith(
			"git",
			"--no-pager",
			"log",
			"--format=raw",
			"--no-color",
			"main --output=victim.txt ..HEAD",
		)
	})
})
