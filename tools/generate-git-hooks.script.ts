/**
 * Copies the contents of `<project>/tools/hooks/` to `<project>/.vite-hooks/`.
 */

import { cp as copyFiles, mkdir as createDirectory } from "node:fs/promises"
import { resolve as resolvePath } from "node:path"

const projectDirectory = resolvePath(import.meta.dirname, "..")
const sourceDirectory = resolvePath(projectDirectory, "tools/hooks/")
const destinationDirectory = resolvePath(projectDirectory, ".vite-hooks/")

await createDirectory(destinationDirectory, { recursive: true })
await copyFiles(sourceDirectory, destinationDirectory, { recursive: true })
