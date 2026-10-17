// Run: node --test gateway/test   (Node 24, no dependencies). The gateway is started on a random local port and
// called over real HTTP; its outbound calls to GitHub and ProxyAPI go to fakes (global fetch), nothing leaves the machine.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createServer as listenOnce } from 'node:http'
import { dirname, join } from 'node:path'
import { after, afterEach, before, beforeEach, describe, mock, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { _test, createServer } from '../server.mjs'

const ORIGIN = 'https://checkbook.example.ru'
const AI_KEY = 'sk-TEST-proxyapi-key-not-real'
Object.assign(process.env, {
  ALLOWED_ORIGIN: ORIGIN,
  GITHUB_REPO: 'anna/checkbook-data',
  MODEL: 'google/gemini-2.5-flash-lite',
  PROXYAPI_KEY: AI_KEY,
})
delete process.env.MAX_COMPLETION_TOKENS

let seq = 0
const newKey = () => `github_pat_TEST_ONLY_not_a_real_token_${String(++seq).padStart(4, '0')}`
const RESULT = {
  docType: 'fiscal',
  kind: 'expense',
  status: null,
  amount: { v: 1250000, cur: 'RUB', ev: 'ИТОГ =12 500,00' },
}
const UPSTREAM_SECRET_TEXT = 'upstream-said-something-private'

const jsonRes = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })
const aiOk = (content = JSON.stringify(RESULT)) =>
  jsonRes(200, { model: 'x', choices: [{ message: { content } }], usage: { total_tokens: 321 } })
const repoOk = () => jsonRes(200, { full_name: 'anna/checkbook-data', private: true })

/** Fake GitHub and ProxyAPI: global fetch (used by the gateway) answers from queues and records every call. */
let calls, github, ai
const realFetch = globalThis.fetch // the test client talks to the gateway with the real one
function installFetch() {
  calls = []
  github = []
  ai = []
  globalThis.fetch = async (url, init = {}) => {
    if (String(url).startsWith(BASE)) return realFetch(url, init)
    calls.push({ url: String(url), init })
    if (String(url).startsWith('https://api.github.com/')) return (github.shift() ?? repoOk)()
    if (String(url) === 'https://api.proxyapi.ru/v1/chat/completions') {
      const next = ai.shift() ?? (() => aiOk())
      return next(init)
    }
    throw new Error(`unexpected fetch ${url}`)
  }
}
const ghCalls = () => calls.filter((c) => c.url.startsWith('https://api.github.com/'))
const aiCalls = () => calls.filter((c) => c.url.startsWith('https://api.proxyapi.ru/'))

let server, BASE
before(async () => {
  server = createServer()
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok))
  BASE = `http://127.0.0.1:${server.address().port}`
})
after(() => {
  server.closeAllConnections()
  server.close()
})

function ev({ method = 'POST', origin = ORIGIN, key, body, headers = {} } = {}) {
  const h = { 'Content-Type': 'application/json', ...headers }
  if (origin) h.Origin = origin
  if (key) h['X-Checkbook-Key'] = key
  const raw = body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body)
  return { method, headers: h, body: method === 'GET' || method === 'HEAD' ? undefined : raw }
}
/** One real HTTP request to the gateway: { statusCode, headers (lower-case names), body }. */
async function handler({ path = '/', ...init }) {
  const r = await realFetch(BASE + path, init)
  return { statusCode: r.status, headers: Object.fromEntries(r.headers), body: await r.text() }
}
const TEXT_BODY = { task: 'extract_receipt', text: 'ООО «Стройдвор» ИТОГ =12 500,00' }
const parse = (res) => JSON.parse(res.body)
/** data URL of a fake image: real magic bytes, zero padding. */
const MAGIC_HEX = { jpeg: 'ffd8ff', png: '89504e47' }
const img = (kind = 'jpeg', size = 2048) => {
  const b = Buffer.alloc(size)
  Buffer.from(MAGIC_HEX[kind], 'hex').copy(b)
  return `data:image/${kind};base64,${b.toString('base64')}`
}

let logs
beforeEach(() => {
  installFetch()
  logs = []
  mock.method(console, 'log', (...a) => logs.push(a.join(' ')))
  _test.opts.retryMs = 1 // 1/2 ms instead of 1/2 s
  _test.opts.now = () => Date.now()
  _test.reset()
  _test.opts.cacheMax = 1000
  _test.opts.perKeyPerMin = 10
  _test.opts.newKeysPerMin = 20
})
afterEach(() => {
  globalThis.fetch = realFetch
  mock.restoreAll()
})

describe('CORS and origin', () => {
  test('OPTIONS preflight from the app origin: 204 with exact CORS headers, no outbound calls', async () => {
    const res = await handler(ev({ method: 'OPTIONS' }))
    assert.equal(res.statusCode, 204)
    assert.equal(res.headers['access-control-allow-origin'], ORIGIN)
    assert.equal(res.headers['access-control-allow-methods'], 'POST, OPTIONS')
    assert.equal(res.headers['access-control-allow-headers'], 'content-type, x-checkbook-key')
    assert.equal(res.headers['access-control-max-age'], '600')
    assert.equal(calls.length, 0)
  })

  test('foreign or missing Origin: 403 for OPTIONS and POST, nothing called', async () => {
    for (const e of [
      ev({ method: 'OPTIONS', origin: 'https://evil.example' }),
      ev({ origin: 'https://evil.example', key: newKey(), body: TEXT_BODY }),
      ev({ origin: `${ORIGIN}/`, key: newKey(), body: TEXT_BODY }),
      ev({ origin: null, key: newKey(), body: TEXT_BODY }),
    ]) {
      const res = await handler(e)
      assert.equal(res.statusCode, 403)
      assert.equal(parse(res).error, 'origin')
      assert.equal(res.headers['access-control-allow-origin'], undefined)
    }
    assert.equal(calls.length, 0)
  })

  test('GET is 405', async () => {
    assert.equal((await handler(ev({ method: 'GET', key: newKey() }))).statusCode, 405)
  })

  test('missing configuration is 500, nothing called', async () => {
    const saved = process.env.PROXYAPI_KEY
    delete process.env.PROXYAPI_KEY
    try {
      const res = await handler(ev({ key: newKey(), body: TEXT_BODY }))
      assert.equal(res.statusCode, 500)
      assert.equal(parse(res).error, 'gateway_misconfigured')
    } finally {
      process.env.PROXYAPI_KEY = saved
    }
    assert.equal(calls.length, 0)
  })
})

describe('/healthz and startup', () => {
  test('GET /healthz: 200 ok without Origin or key, nothing called, no log line', async () => {
    const res = await handler({ path: '/healthz' })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body, 'ok')
    assert.equal(res.headers['access-control-allow-origin'], ORIGIN) // the app reads the state from the browser
    assert.equal((await handler({ path: '/healthz', method: 'HEAD' })).statusCode, 200)
    assert.equal(calls.length, 0)
    assert.equal(logs.length, 0)
  })

  test('/healthz answers even when the gateway is misconfigured; POST /healthz is an ordinary request', async () => {
    const saved = process.env.PROXYAPI_KEY
    delete process.env.PROXYAPI_KEY
    try {
      assert.equal((await handler({ path: '/healthz' })).statusCode, 200)
    } finally {
      process.env.PROXYAPI_KEY = saved
    }
    assert.equal((await handler({ path: '/healthz', method: 'POST', body: '{}' })).statusCode, 403)
  })

  const SERVER = join(dirname(fileURLToPath(import.meta.url)), '..', 'server.mjs')
  const run = (env) =>
    spawn(process.execPath, [SERVER], { env: { PATH: process.env.PATH, ...env }, stdio: ['ignore', 'ignore', 'pipe'] })
  const exited = (p) => new Promise((ok) => p.on('exit', (code, signal) => ok({ code, signal })))

  test('node server.mjs without PROXYAPI_KEY, GITHUB_REPO or ALLOWED_ORIGIN exits 1 and names the variable', async () => {
    for (const [env, name] of [
      [{ GITHUB_REPO: 'anna/checkbook-data', ALLOWED_ORIGIN: ORIGIN }, 'PROXYAPI_KEY'],
      [{ PROXYAPI_KEY: 'sk-x', ALLOWED_ORIGIN: ORIGIN }, 'GITHUB_REPO'],
      [{ PROXYAPI_KEY: 'sk-x', GITHUB_REPO: 'anna/checkbook-data' }, 'ALLOWED_ORIGIN'],
    ]) {
      const p = run(env)
      let err = ''
      p.stderr.on('data', (d) => (err += d))
      assert.deepEqual(await exited(p), { code: 1, signal: null })
      assert.ok(err.includes(name), err)
    }
  })

  test('node server.mjs listens on PORT, answers /healthz and stops cleanly on SIGTERM', async () => {
    const probe = listenOnce()
    await new Promise((ok) => probe.listen(0, '127.0.0.1', ok))
    const port = probe.address().port
    await new Promise((ok) => probe.close(ok))
    const p = run({ PROXYAPI_KEY: 'sk-x', GITHUB_REPO: 'anna/checkbook-data', ALLOWED_ORIGIN: ORIGIN, PORT: String(port) })
    let res
    for (let n = 0; n < 50 && !res; n++) {
      res = await realFetch(`http://127.0.0.1:${port}/healthz`).catch(() => null)
      if (!res) await new Promise((ok) => setTimeout(ok, 100))
    }
    assert.equal(await res?.text(), 'ok')
    p.kill('SIGTERM')
    assert.deepEqual(await exited(p), { code: 0, signal: null })
  })
})

describe('member key (X-Checkbook-Key)', () => {
  test('missing key: 401 no_key', async () => {
    const res = await handler(ev({ body: TEXT_BODY }))
    assert.equal(res.statusCode, 401)
    assert.equal(parse(res).error, 'no_key')
    assert.equal(calls.length, 0)
  })

  test('wrong format (classic token, junk): 401 bad_key_format without asking GitHub', async () => {
    for (const key of [
      'ghp_TEST_ONLY_classic_token',
      'hello',
      'github_pat_short',
      'github_pat_has spaces in it 0000000',
    ]) {
      const res = await handler(ev({ key, body: TEXT_BODY }))
      assert.equal(res.statusCode, 401)
      assert.equal(parse(res).error, 'bad_key_format')
    }
    assert.equal(calls.length, 0)
  })

  test('header name in any case', async () => {
    const key = newKey()
    const res = await handler(ev({ body: TEXT_BODY, headers: { 'x-checkbook-key': key } }))
    assert.equal(res.statusCode, 200)
    assert.equal(ghCalls()[0].init.headers.Authorization, `Bearer ${key}`)
  })

  test('GitHub checks GET /repos/<GITHUB_REPO> with the member key and a User-Agent', async () => {
    const key = newKey()
    await handler(ev({ key, body: TEXT_BODY }))
    const [c] = ghCalls()
    assert.equal(c.url, 'https://api.github.com/repos/anna/checkbook-data')
    assert.equal(c.init.headers.Authorization, `Bearer ${key}`)
    assert.ok(c.init.headers['User-Agent'])
  })

  const refusals = [
    ['GitHub 401 (revoked/expired)', () => jsonRes(401, { message: 'Bad credentials' }), 401, 'bad_key'],
    ['GitHub 404 (no access to the repo)', () => jsonRes(404, { message: 'Not Found' }), 403, 'no_access'],
    ['GitHub 403 (no permission)', () => jsonRes(403, { message: 'Forbidden' }), 403, 'no_access'],
    ['public repo', () => jsonRes(200, { full_name: 'anna/checkbook-data', private: false }), 403, 'repo_not_private'],
    ['another repo name', () => jsonRes(200, { full_name: 'anna/other', private: true }), 403, 'repo_not_private'],
  ]
  for (const [name, gh, status, error] of refusals) {
    test(`${name}: ${status} ${error}, ProxyAPI never called`, async () => {
      github.push(gh)
      const res = await handler(ev({ key: newKey(), body: TEXT_BODY }))
      assert.equal(res.statusCode, status)
      assert.equal(parse(res).error, error)
      assert.equal(aiCalls().length, 0)
    })
  }

  test('GitHub rate limit or outage: 503, not cached as a refusal', async () => {
    const key = newKey()
    github.push(() => jsonRes(403, { message: 'API rate limit exceeded' }, { 'x-ratelimit-remaining': '0' }))
    assert.equal((await handler(ev({ key, body: TEXT_BODY }))).statusCode, 503)
    github.push(() => jsonRes(502, {}))
    assert.equal((await handler(ev({ key, body: TEXT_BODY }))).statusCode, 503)
    assert.equal((await handler(ev({ key, body: TEXT_BODY }))).statusCode, 200) // next call asks GitHub again
    assert.equal(ghCalls().length, 3)
  })

  test('cache: success for 2 min, refusal for 1 min, keyed by the key hash', async () => {
    let t = 1_000_000_000_000
    _test.opts.now = () => t
    const good = newKey()
    await handler(ev({ key: good, body: TEXT_BODY }))
    await handler(ev({ key: good, body: TEXT_BODY }))
    assert.equal(ghCalls().length, 1, 'second call is a cache hit')
    assert.equal(aiCalls().length, 2)
    t += 90_000
    await handler(ev({ key: good, body: TEXT_BODY }))
    assert.equal(ghCalls().length, 1)
    t += 40_000 // 2 min 10 s after the check: a revoked PAT is noticed
    await handler(ev({ key: good, body: TEXT_BODY }))
    assert.equal(ghCalls().length, 2)

    const bad = newKey()
    github.push(() => jsonRes(401, {}))
    assert.equal((await handler(ev({ key: bad, body: TEXT_BODY }))).statusCode, 401)
    assert.equal((await handler(ev({ key: bad, body: TEXT_BODY }))).statusCode, 401)
    assert.equal(ghCalls().length, 3, 'refusal cached')
    t += 61_000
    assert.equal((await handler(ev({ key: bad, body: TEXT_BODY }))).statusCode, 200) // GitHub (default mock) says OK now
    assert.equal(ghCalls().length, 4)
    for (const k of _test.keyCache.keys()) assert.match(k, /^[0-9a-f]{64}$/)
  })
})

describe('request body', () => {
  const cases = [
    ['not JSON', '{oops', 400, 'bad_json'],
    ['other task', { task: 'chat', text: 'hi' }, 400, 'bad_task'],
    ['neither text nor image', { task: 'extract_receipt' }, 400, 'empty'],
    ['text not a string', { task: 'extract_receipt', text: 42 }, 400, 'bad_text'],
    ['text over 20 000 chars', { task: 'extract_receipt', text: 'а'.repeat(20_001) }, 413, 'too_large'],
    ['image over 2 MB decoded', { task: 'extract_receipt', image: img('jpeg', 2 * 1024 * 1024 + 1) }, 413, 'too_large'],
    ['body far over the limits', { task: 'extract_receipt', text: 'a'.repeat(3_200_000) }, 413, 'too_large'],
    ['image is SVG', { task: 'extract_receipt', image: 'data:image/svg+xml;base64,PHN2Zz4=' }, 400, 'bad_image'],
    ['image is a URL', { task: 'extract_receipt', image: 'https://example.com/a.jpg' }, 400, 'bad_image'],
  ]
  for (const [name, body, status, error] of cases) {
    test(`${name}: ${status} ${error}, ProxyAPI not called`, async () => {
      const res = await handler(ev({ key: newKey(), body }))
      assert.equal(res.statusCode, status)
      assert.equal(parse(res).error, error)
      assert.equal(aiCalls().length, 0)
    })
  }

  test('limits are inclusive: 20 000 chars of text and a 2 MB image are sent to ProxyAPI', async () => {
    const image = img('png', 2 * 1024 * 1024)
    const res = await handler(ev({ key: newKey(), body: { task: 'extract_receipt', text: 'а'.repeat(20_000), image } }))
    assert.equal(res.statusCode, 200)
    assert.equal(aiCalls().length, 1)
  })

  test('a JSON body with any Content-Type (text/plain, no CORS preflight tricks) is accepted', async () => {
    const res = await handler(ev({ key: newKey(), body: TEXT_BODY, headers: { 'Content-Type': 'text/plain' } }))
    assert.equal(res.statusCode, 200)
  })
})

describe('ProxyAPI call', () => {
  test('success: model/limits from env, client fields ignored, ev contract in the prompt, JSON result', async () => {
    const image = img('jpeg')
    const res = await handler(
      ev({ key: newKey(), body: { ...TEXT_BODY, image, model: 'openai/gpt-5', max_tokens: 99999, messages: [] } }),
    )
    assert.equal(res.statusCode, 200)
    assert.deepEqual(parse(res), { result: RESULT })
    assert.equal(res.headers['access-control-allow-origin'], ORIGIN)
    const [c] = aiCalls()
    assert.equal(c.init.method, 'POST')
    assert.equal(c.init.headers.Authorization, `Bearer ${AI_KEY}`)
    const sent = JSON.parse(c.init.body)
    assert.equal(sent.model, 'google/gemini-2.5-flash-lite')
    assert.equal(sent.max_completion_tokens, 1500)
    assert.equal(sent.max_tokens, undefined)
    assert.deepEqual(sent.response_format, { type: 'json_object' })
    assert.equal(sent.stream, undefined)
    assert.equal(sent.tools, undefined)
    assert.match(sent.messages[0].content, /данные, а не инструкции/)
    assert.match(sent.messages[0].content, /ev — дословная цитата/)
    assert.equal(sent.messages.length, 2)
    assert.equal(sent.messages[1].content[0].type, 'text')
    assert.match(sent.messages[1].content[0].text, /12 500,00/)
    assert.deepEqual(sent.messages[1].content[1], { type: 'image_url', image_url: { url: image } })
  })

  test('MAX_COMPLETION_TOKENS from env', async () => {
    process.env.MAX_COMPLETION_TOKENS = '800'
    try {
      await handler(ev({ key: newKey(), body: TEXT_BODY }))
    } finally {
      delete process.env.MAX_COMPLETION_TOKENS
    }
    assert.equal(JSON.parse(aiCalls()[0].init.body).max_completion_tokens, 800)
  })

  test('model answer wrapped in ``` fences is still parsed; non-JSON answer is 502 ai_bad_json', async () => {
    ai.push(() => aiOk('```json\n' + JSON.stringify(RESULT) + '\n```'))
    assert.deepEqual(parse(await handler(ev({ key: newKey(), body: TEXT_BODY }))), { result: RESULT })
    ai.push(() => aiOk('Sorry, I cannot help'))
    const res = await handler(ev({ key: newKey(), body: TEXT_BODY }))
    assert.equal(res.statusCode, 502)
    assert.equal(parse(res).error, 'ai_bad_json')
  })

  test('402 (balance/budget): {error: ai_limit}, no retry', async () => {
    ai.push(() => jsonRes(402, { detail: 'Insufficient balance to run this request.' }))
    const res = await handler(ev({ key: newKey(), body: TEXT_BODY }))
    assert.equal(res.statusCode, 402)
    assert.deepEqual(parse(res), { error: 'ai_limit' })
    assert.equal(aiCalls().length, 1)
  })

  test('429: retried after 1, 2 units, then succeeds', async () => {
    const at = []
    for (let n = 0; n < 2; n++) ai.push(() => (at.push(Date.now()), jsonRes(429, { detail: 'Too many requests' })))
    ai.push(() => (at.push(Date.now()), aiOk()))
    _test.opts.retryMs = 20
    const res = await handler(ev({ key: newKey(), body: TEXT_BODY }))
    assert.equal(res.statusCode, 200)
    assert.equal(aiCalls().length, 3)
    const gaps = at.slice(1).map((v, n) => v - at[n])
    assert.ok(gaps[0] >= 18 && gaps[1] >= 38, `exponential gaps, got ${gaps}`)
  })

  test('429 three times: gives up after 2 retries with 429 ai_busy', async () => {
    for (let n = 0; n < 5; n++) ai.push(() => jsonRes(429, {}))
    const res = await handler(ev({ key: newKey(), body: TEXT_BODY }))
    assert.equal(res.statusCode, 429)
    assert.equal(parse(res).error, 'ai_busy')
    assert.equal(aiCalls().length, 3)
  })

  for (const status of [400, 401, 403, 404, 422]) {
    test(`${status} from ProxyAPI is never retried: 502 ai_rejected`, async () => {
      ai.push(() => jsonRes(status, { detail: UPSTREAM_SECRET_TEXT }))
      const res = await handler(ev({ key: newKey(), body: TEXT_BODY }))
      assert.equal(res.statusCode, 502)
      assert.deepEqual(parse(res), { error: 'ai_rejected', upstream: status })
      assert.equal(aiCalls().length, 1)
      assert.ok(!res.body.includes(UPSTREAM_SECRET_TEXT))
    })
  }

  test('5xx: exactly one retry', async () => {
    ai.push(
      () => jsonRes(503, {}),
      () => aiOk(),
    )
    assert.equal((await handler(ev({ key: newKey(), body: TEXT_BODY }))).statusCode, 200)
    assert.equal(aiCalls().length, 2)
    ai.push(
      () => jsonRes(500, {}),
      () => jsonRes(502, {}),
      () => aiOk(),
    )
    const res = await handler(ev({ key: newKey(), body: TEXT_BODY }))
    assert.equal(res.statusCode, 502)
    assert.deepEqual(parse(res), { error: 'ai_unavailable', upstream: 502 })
    assert.equal(aiCalls().length, 4)
  })

  test('network error: one retry, then 502 ai_unavailable', async () => {
    const boom = () => {
      throw new TypeError('fetch failed')
    }
    ai.push(boom, boom)
    const res = await handler(ev({ key: newKey(), body: TEXT_BODY }))
    assert.equal(res.statusCode, 502)
    assert.equal(parse(res).error, 'ai_unavailable')
    assert.equal(aiCalls().length, 2)
  })

  test('timeout: 504 ai_timeout, not retried', async () => {
    _test.opts.aiTimeoutMs = 30
    // AbortSignal.timeout() timers are unref'd: keep the event loop alive while the fake upstream "hangs".
    ai.push(
      (init) =>
        new Promise((_ok, fail) => {
          const keepAlive = setTimeout(() => {}, 5_000)
          init.signal.addEventListener('abort', () => (clearTimeout(keepAlive), fail(init.signal.reason)), {
            once: true,
          })
        }),
    )
    try {
      const res = await handler(ev({ key: newKey(), body: TEXT_BODY }))
      assert.equal(res.statusCode, 504)
      assert.equal(parse(res).error, 'ai_timeout')
      assert.equal(aiCalls().length, 1)
    } finally {
      _test.opts.aiTimeoutMs = 30_000
    }
  })
})

describe('logging', () => {
  test('one line per request with only keyId, status, ms; no key, body or upstream text', async () => {
    const key = newKey()
    await handler(ev({ key, body: TEXT_BODY })) // success
    ai.push(() => jsonRes(400, { detail: UPSTREAM_SECRET_TEXT }))
    await handler(ev({ key, body: TEXT_BODY })) // upstream error
    await handler(ev({ key, body: '{bad json ' + key })) // parse error mentioning the key
    await handler(ev({ body: TEXT_BODY })) // no key
    assert.equal(logs.length, 4)
    const keyId = createHash('sha256').update(key).digest('hex').slice(0, 8)
    for (const line of logs) {
      const rec = JSON.parse(line)
      assert.deepEqual(Object.keys(rec).sort(), ['keyId', 'ms', 'status'])
      for (const secret of [key, AI_KEY, 'Стройдвор', UPSTREAM_SECRET_TEXT, 'github_pat_'])
        assert.ok(!line.includes(secret), `log line leaks ${secret}: ${line}`)
    }
    assert.deepEqual(JSON.parse(logs[0]), { ...JSON.parse(logs[0]), keyId, status: 200 })
    assert.equal(JSON.parse(logs[1]).status, 502)
    assert.equal(JSON.parse(logs[3]).keyId, null)
  })
})

describe('image content (magic bytes, minimum size)', () => {
  for (const kind of ['jpeg', 'png']) {
    test(`a real ${kind} header is accepted`, async () => {
      const res = await handler(ev({ key: newKey(), body: { task: 'extract_receipt', image: img(kind) } }))
      assert.equal(res.statusCode, 200)
    })
  }

  const bad = [
    [
      'valid base64 but not an image (text)',
      `data:image/png;base64,${Buffer.from('hello'.repeat(500)).toString('base64')}`,
    ],
    ['AAAA padding with an image label', `data:image/png;base64,${Buffer.alloc(2048).toString('base64')}`],
    [
      'GIF bytes under a jpeg label',
      `data:image/jpeg;base64,${Buffer.from('GIF89a'.padEnd(2048, 'x')).toString('base64')}`,
    ],
    ['jpeg header but under the minimum size', img('jpeg', 100)],
    ['png header but under the minimum size', img('png', 1023)],
  ]
  for (const [name, image] of bad) {
    test(`${name}: 400 bad_image, ProxyAPI not called`, async () => {
      const res = await handler(ev({ key: newKey(), body: { task: 'extract_receipt', image } }))
      assert.equal(res.statusCode, 400)
      assert.equal(parse(res).error, 'bad_image')
      assert.equal(aiCalls().length, 0)
    })
  }

  test('the minimum size is inclusive: 1024 bytes pass', async () => {
    const res = await handler(ev({ key: newKey(), body: { task: 'extract_receipt', image: img('jpeg', 1024) } }))
    assert.equal(res.statusCode, 200)
  })
})

describe('abuse limits', () => {
  test('per key: 10 requests per sliding minute, the 11th is 429 rate_limited without ProxyAPI', async () => {
    let t = 1_000_000_000_000
    _test.opts.now = () => t
    const key = newKey()
    for (let n = 0; n < 10; n++) {
      assert.equal((await handler(ev({ key, body: TEXT_BODY }))).statusCode, 200)
      t += 1000
    }
    const res = await handler(ev({ key, body: TEXT_BODY }))
    assert.equal(res.statusCode, 429)
    assert.equal(parse(res).error, 'rate_limited')
    assert.equal(aiCalls().length, 10)
    // another key is not affected
    assert.equal((await handler(ev({ key: newKey(), body: TEXT_BODY }))).statusCode, 200)
    // the window slides: once the first request is older than 60 s, one slot is free
    t += 50_500 // only the first request is older than 60 s now
    assert.equal((await handler(ev({ key, body: TEXT_BODY }))).statusCode, 200)
    assert.equal((await handler(ev({ key, body: TEXT_BODY }))).statusCode, 429)
  })

  test('garbage bodies from a valid key count too: 50 bad images cost ProxyAPI nothing', async () => {
    const key = newKey()
    const codes = []
    for (let n = 0; n < 50; n++)
      codes.push(
        (await handler(ev({ key, body: { task: 'extract_receipt', image: 'data:image/png;base64,AAAA' } }))).statusCode,
      )
    assert.equal(codes.filter((c) => c === 429).length, 40)
    assert.equal(aiCalls().length, 0)
  })

  test('new keys: at most 20 GitHub checks per minute, then 429 rate_limited without calling GitHub', async () => {
    let t = 1_000_000_000_000
    _test.opts.now = () => t
    for (let n = 0; n < 20; n++) assert.equal((await handler(ev({ key: newKey(), body: TEXT_BODY }))).statusCode, 200)
    assert.equal(ghCalls().length, 20)
    const res = await handler(ev({ key: newKey(), body: TEXT_BODY }))
    assert.equal(res.statusCode, 429)
    assert.equal(parse(res).error, 'rate_limited')
    assert.equal(ghCalls().length, 20)
    t += 61_000
    assert.equal((await handler(ev({ key: newKey(), body: TEXT_BODY }))).statusCode, 200)
  })

  test('a cached key does not use the new-key budget', async () => {
    _test.opts.newKeysPerMin = 1
    const key = newKey()
    assert.equal((await handler(ev({ key, body: TEXT_BODY }))).statusCode, 200)
    assert.equal((await handler(ev({ key, body: TEXT_BODY }))).statusCode, 200)
    assert.equal(ghCalls().length, 1)
  })

  test('breaker: 5 x 4xx from ProxyAPI in 60 s => 60 s of local 429 ai_paused, upstream untouched', async () => {
    let t = 1_000_000_000_000
    _test.opts.now = () => t
    for (let n = 0; n < 5; n++) {
      ai.push(() => jsonRes(400, {}))
      assert.equal((await handler(ev({ key: newKey(), body: TEXT_BODY }))).statusCode, 502)
      t += 1000
    }
    assert.equal(aiCalls().length, 5)
    const res = await handler(ev({ key: newKey(), body: TEXT_BODY }))
    assert.equal(res.statusCode, 429)
    assert.equal(parse(res).error, 'ai_paused')
    assert.equal(aiCalls().length, 5, 'no call while paused')
    t += 54_000 // 60 s after the fifth error
    assert.equal(parse(await handler(ev({ key: newKey(), body: TEXT_BODY }))).error, 'ai_paused')
    t += 6_000
    assert.equal((await handler(ev({ key: newKey(), body: TEXT_BODY }))).statusCode, 200)
  })

  test('breaker: 4xx spread over more than 60 s do not trip it; 5xx do not count', async () => {
    let t = 1_000_000_000_000
    _test.opts.now = () => t
    for (let n = 0; n < 8; n++) {
      ai.push(() => jsonRes(422, {}))
      await handler(ev({ key: newKey(), body: TEXT_BODY }))
      t += 20_000 // at most 3 per minute
    }
    ai.push(
      () => jsonRes(500, {}),
      () => jsonRes(500, {}),
      () => jsonRes(500, {}),
      () => jsonRes(500, {}),
    )
    for (let n = 0; n < 2; n++) await handler(ev({ key: newKey(), body: TEXT_BODY }))
    assert.equal((await handler(ev({ key: newKey(), body: TEXT_BODY }))).statusCode, 200)
  })

  test('breaker: 429 retries count as 4xx and stop the retry loop once it trips', async () => {
    for (let n = 0; n < 10; n++) ai.push(() => jsonRes(429, {}))
    await handler(ev({ key: newKey(), body: TEXT_BODY })) // 3 calls (1 + 2 retries)
    const res = await handler(ev({ key: newKey(), body: TEXT_BODY })) // 2 more 4xx => trips, no further retries
    assert.equal(res.statusCode, 429)
    assert.equal(aiCalls().length, 5)
    assert.equal(parse(await handler(ev({ key: newKey(), body: TEXT_BODY }))).error, 'ai_paused')
    assert.equal(aiCalls().length, 5)
  })

  test('cache eviction drops the oldest entries, not everything', async () => {
    _test.opts.cacheMax = 3
    const keys = [newKey(), newKey(), newKey(), newKey()]
    for (const key of keys) await handler(ev({ key, body: TEXT_BODY }))
    assert.equal(_test.keyCache.size, 3)
    const calls0 = ghCalls().length
    await handler(ev({ key: keys[3], body: TEXT_BODY })) // newest is still cached
    await handler(ev({ key: keys[1], body: TEXT_BODY }))
    assert.equal(ghCalls().length, calls0, 'recent keys survive the overflow')
    await handler(ev({ key: keys[0], body: TEXT_BODY })) // the oldest was evicted
    assert.equal(ghCalls().length, calls0 + 1)
  })
})
