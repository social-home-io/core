#!/usr/bin/env node
/**
 * i18n:check — PR gate for the Weblate-backed translation workflow
 * (spec §30.5). Fails the build when any `t("…")` / `t('…')` call
 * in `src/` references a key that isn't in `src/i18n/locales/en.json`,
 * and warns when `en.json` contains keys with no call site (dead
 * strings that shouldn't be pushed to translators).
 *
 * Missing-from-en → HARD FAIL (exit 1). This is the PR gate.
 * Unused-in-en    → WARNING (exit 0). Useful signal but not fatal —
 *                   some keys are built dynamically (e.g.
 *                   `t(\`presence.state.${state}\`)`) and can't be
 *                   statically detected.
 *
 * Runs in Node, no deps beyond what ships with the client bundle.
 */
import { readFileSync } from 'node:fs'
import { readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SRC_DIR = join(ROOT, 'src')
const EN_FILE = join(SRC_DIR, 'i18n', 'locales', 'en.json')

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      // Skip node_modules, dist, .vite, generated catalogs.
      if (entry === 'node_modules' || entry === 'dist' || entry === '.vite'
          || entry === 'locales') continue
      yield* walk(full)
    } else if (/\.(ts|tsx|js|jsx)$/.test(extname(full))) {
      // Skip tests — they deliberately reference missing keys to
      // verify fallback behaviour.
      if (/\.test\.(ts|tsx|js|jsx)$/.test(full)) continue
      yield full
    }
  }
}

// Match t("key") / t('key') — ignore template literals (dynamic
// composition). The pattern intentionally excludes ${…} keys so a
// false positive on `t(\`presence.state.${s}\`)` doesn't break CI.
const T_CALL = /\bt\(\s*['"]([A-Za-z0-9_.-]+)['"]/g

const en = JSON.parse(readFileSync(EN_FILE, 'utf8'))
const enKeys = new Set(Object.keys(en))

const used = new Set()
const offenders = [] // {file, key, line}

for (const file of walk(SRC_DIR)) {
  const src = readFileSync(file, 'utf8')
  T_CALL.lastIndex = 0
  let m
  while ((m = T_CALL.exec(src))) {
    const key = m[1]
    used.add(key)
    if (!enKeys.has(key)) {
      // Compute line for a clean error message.
      const upto = src.slice(0, m.index)
      const line = upto.split('\n').length
      offenders.push({ file, key, line })
    }
  }
}

let failed = false
if (offenders.length) {
  console.error(`✗ i18n:check — ${offenders.length} missing key(s) in en.json:`)
  for (const o of offenders) {
    const rel = o.file.slice(ROOT.length)
    console.error(`  ${rel}:${o.line}  →  ${o.key}`)
  }
  console.error('\nAdd the missing keys to src/i18n/locales/en.json and try again.')
  console.error('Weblate will pick the new keys up on the next poll (≤ 5 min).')
  failed = true
}

// Dead-string warnings — helpful but non-fatal (see preamble).
const unused = [...enKeys].filter((k) => !used.has(k))
if (unused.length) {
  const cap = 20
  console.warn(`⚠ ${unused.length} key(s) in en.json have no matching t() call site:`)
  for (const k of unused.slice(0, cap)) console.warn(`  ${k}`)
  if (unused.length > cap) console.warn(`  … and ${unused.length - cap} more`)
  console.warn('If these are truly unused, remove them from en.json so translators don\'t waste cycles.')
  console.warn('If they are looked up dynamically, add a comment in src/ listing them so future greps hit.')
}

if (!failed) {
  const count = enKeys.size
  console.log(`✓ i18n:check — ${count} keys, no missing strings.`)
}

process.exit(failed ? 1 : 0)
