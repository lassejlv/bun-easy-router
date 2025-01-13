import { existsSync, rmSync } from 'fs'
import { $ } from 'bun'

const hasUpdatedVersion = prompt('Have you updated the version in package.json? ')
if (!hasUpdatedVersion) process.exit(1)

// Generating types
const dir = './lib'
if (existsSync(dir)) rmSync(dir, { recursive: true })

// Build source files
Bun.build({
  format: 'esm',
  target: 'bun',
  outdir: './lib',
  entrypoints: ['./src/index'],
  minify: {
    whitespace: true,
  },
})

await $`bun x tsc`
await $`bun publish`
