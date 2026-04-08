const __json = (body: Record<string, unknown>[], init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init?.headers ?? {}),
    },
  })

const notFound = (message = 'Not Found') =>
  __json({ ok: false, error: message }, { status: 404 })

const badRequest = (message: string) =>
  __json({ ok: false, error: message }, { status: 400 })

const methodNotAllowed = () =>
  __json({ ok: false, error: 'Method Not Allowed' }, { status: 405 })

const items = async (keys: string[], env: Env) => {
  const body = await Promise.all(
    keys.map(async (i) => env.ESO_MARKET_TRACKER.get(i, 'json'))
  )
  return (
    (body &&
      body.filter(Boolean).length &&
      __json({
        ok: true,
        kind: 'item',
        query: keys,
        results: body,
      })) ||
    notFound(`No item found for keys "${keys}"`)
  )
}

const search = async (term: string, env: Env) => {}

const item = async (key: string, env: Env) => {
  const normalized = key.trim()
  return (
    (normalized && (await items([key], env))) || badRequest('Missing item key')
  )
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    if (request.method !== 'GET') {
      return methodNotAllowed()
    }

    const url = new URL(request.url)
    const [route, ...rest] = url.pathname
      .replace(/^\/+|\/+$/g, '')
      .split('/')
      .filter(Boolean)

    const routeFn = { search, item }[route]
    return (
      (routeFn && (await routeFn(rest.join('/'), env))) ||
      notFound(`Unknown route "${route}"`)
    )
  },
} satisfies ExportedHandler<Env>
