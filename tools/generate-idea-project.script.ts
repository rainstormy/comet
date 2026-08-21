/**
 * Copies the contents of `<project>/tools/idea/` to `<project>/.idea/`.
 */

import { cp as copyFiles, mkdir as createDirectory } from "node:fs/promises"
import { resolve as resolvePath } from "node:path"

const projectDirectory = resolvePath(import.meta.dirname, "..")
const sourceDirectory = resolvePath(projectDirectory, "tools/idea/")
const destinationDirectory = resolvePath(projectDirectory, ".idea/")

await createDirectory(destinationDirectory, { recursive: true })
await copyFiles(sourceDirectory, destinationDirectory, { recursive: true })
