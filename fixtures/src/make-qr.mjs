// Regenerates fixtures/qr/R0*.{txt,png} (synthetic FNS receipt QR codes).
// Run from a folder with zxing-wasm installed:  cd reference && node ../fixtures/src/make-qr.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const req = createRequire(`${process.cwd()}/`)
const { prepareZXingModule, writeBarcode } = await import(pathToFileURL(req.resolve('zxing-wasm/full')).href)
prepareZXingModule({ overrides: { wasmBinary: readFileSync(req.resolve('zxing-wasm/full/zxing_full.wasm')).buffer } })

const out = new URL('../qr/', import.meta.url)
const F = 'fn=7380440700076549&i=41250&fp=2829170618' // fake fiscal data
const CASES = {
  R01: `t=20261015T143005&s=12500.00&${F}&n=1`, // t with seconds
  R02: `t=20261015T1430&s=12500.00&${F}&n=1`, // t without seconds
  R03: `https://check.example.test/rec?n=1&fp=2829170618&i=41250&s=12500.00&fn=7380440700076549&t=20261015T1430`, // order + URL prefix
  R04: `t=20261015T1430&s=1500&${F}&n=1`, // sum without kopecks
  R05: `t=20261015T1430&s=12500.00&${F}&n=2`, // возврат прихода
}
for (const [id, text] of Object.entries(CASES)) {
  writeFileSync(new URL(`${id}.txt`, out), text)
  const qr = await writeBarcode(text, { format: 'QRCode', scale: 6 })
  writeFileSync(new URL(`${id}.png`, out), Buffer.from(await qr.image.arrayBuffer()))
}
console.log('qr fixtures:', Object.keys(CASES).join(' '))
