// node --test 'scripts/*.test.mjs'   (CI runs it): scripts/svg-to-tsx.mjs
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { convert, convertDir, pascal } from './svg-to-tsx.mjs'

const SVG = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="8" aria-hidden="true" focusable="false">
  <!-- c -->
  <path d="M0 0L8 8" stroke="var(--text-2, #5B6168)" stroke-width="2" stroke-linecap="round"/>
  <g data-x="1"><circle cx="4" cy="4" r="2" fill-opacity="0.5"></circle></g>
</svg>`

test('convert: camelCase attributes, aria/data kept, aria-hidden="true" after the props, valid component', () => {
  const out = convert(SVG, 'empty-inbox')
  assert.match(out, /export function EmptyInbox\(props: JSX\.SVGAttributes<SVGSVGElement>\)/)
  assert.match(out, /strokeWidth="2" strokeLinecap="round"/)
  assert.match(out, /fillOpacity="0\.5"/)
  assert.match(out, /<g data-x="1">/)
  assert.match(out, /<path d="M0 0L8 8" stroke="var\(--text-2, #5B6168\)"/)
  assert.doesNotMatch(out, /stroke-width|<\?xml|<!--/)
  assert.equal(out.match(/aria-hidden/g).length, 1) // the original one is replaced, not duplicated
  assert.match(
    out,
    /<svg xmlns="[^"]+" viewBox="0 0 8 8" width="8" \{\.\.\.props\} aria-hidden="true" focusable="false">/,
  )
})

test('convert: refuses text, style, scripts, handlers and external links (CSP)', () => {
  for (const bad of [
    '<svg><text>hi</text></svg>',
    '<svg style="color:red"/>',
    '<svg><style>a{}</style></svg>',
    '<svg onclick="x()"/>',
    '<svg><use href="https://x/y.svg#a"/></svg>',
    '<g/>',
  ])
    assert.throws(() => convert(bad, 'bad'), /bad:/, bad)
})

test('pascal and convertDir: one .tsx per svg without -dark files, plus index.ts', () => {
  assert.equal(pascal('install-ios'), 'InstallIos')
  const src = 'design/assets/illustrations'
  if (!existsSync(src)) return // the package without design/
  const out = mkdtempSync(join(tmpdir(), 'ill-'))
  const names = convertDir(src, out)
  assert.ok(names.length >= 16)
  assert.deepEqual(readdirSync(out).sort(), [...names.map((n) => `${n}.tsx`), 'index.ts'].sort())
  assert.match(readFileSync(join(out, 'index.ts'), 'utf8'), /'empty-inbox': EmptyInbox,/)
  for (const n of names)
    assert.match(readFileSync(join(out, `${n}.tsx`), 'utf8'), /aria-hidden="true" focusable="false">/)
})
