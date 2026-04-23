// General-purpose proxy Lambda for the Common Voice API.
// All requests are forwarded to https://api.commonvoice.mozilla.org with
// CORS headers added for whitelisted origins, solving the browser CORS block.
//
// Special case: POST /auth/token injects CV_CLIENT_ID / CV_CLIENT_SECRET from
// env so the frontend never holds those credentials.
//
// Env vars required: CV_CLIENT_ID, CV_CLIENT_SECRET
// Env vars optional: ALLOWED_ORIGINS (comma-separated, default deny-all)

const UPSTREAM = 'https://api.commonvoice.mozilla.org'

function resolveOrigin(event) {
  const headerOrigin = (event.headers && (event.headers.origin || event.headers.Origin)) || null
  const envAllowed = process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || ''
  const allowedList = envAllowed.split(',').map(s => s.trim()).filter(Boolean)

  if (allowedList.length === 0) return null
  if (allowedList.includes('*')) return headerOrigin || '*'
  if (headerOrigin && allowedList.includes(headerOrigin)) return headerOrigin
  return null
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  }
}

exports.handler = async function (event) {
  const origin = resolveOrigin(event)
  const method = event.httpMethod || (event.requestContext && event.requestContext.http && event.requestContext.http.method) || 'GET'
  const path = event.path || (event.requestContext && event.requestContext.http && event.requestContext.http.path) || '/'
  const qs = event.queryStringParameters
  const upstreamUrl = UPSTREAM + path + (qs ? '?' + new URLSearchParams(qs).toString() : '')

  // CORS preflight
  if (method === 'OPTIONS') {
    if (!origin) {
      return { statusCode: 403, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'CORS origin not allowed' }) }
    }
    return { statusCode: 204, headers: corsHeaders(origin), body: '' }
  }

  // Reject cross-origin requests from unknown origins
  const headerOrigin = (event.headers && (event.headers.origin || event.headers.Origin)) || null
  if (headerOrigin && !origin) {
    return { statusCode: 403, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'CORS origin not allowed' }) }
  }

  // Build upstream request headers — forward Content-Type and Authorization
  const upstreamHeaders = {}
  const inContentType = (event.headers && (event.headers['content-type'] || event.headers['Content-Type'])) || 'application/json'
  upstreamHeaders['Content-Type'] = inContentType
  const inAuth = event.headers && (event.headers['authorization'] || event.headers['Authorization'])
  if (inAuth) upstreamHeaders['Authorization'] = inAuth

  // Build upstream body — special-case token exchange to inject credentials
  let upstreamBody = event.body || null

  if (path === '/auth/token' && method === 'POST') {
    let body = {}
    try { body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body || {}) } catch (_) {}
    const grant = body.grant_type || 'client_credentials'

    if (grant === 'client_credentials') {
      upstreamBody = JSON.stringify({
        clientId: process.env.CV_CLIENT_ID || '',
        clientSecret: process.env.CV_CLIENT_SECRET || '',
      })
      upstreamHeaders['Content-Type'] = 'application/json'
    } else if (grant === 'authorization_code') {
      const params = new URLSearchParams()
      params.set('grant_type', 'authorization_code')
      params.set('code', body.code || '')
      params.set('code_verifier', body.code_verifier || '')
      params.set('redirect_uri', body.redirect_uri || '')
      params.set('client_id', process.env.CV_CLIENT_ID || '')
      params.set('client_secret', process.env.CV_CLIENT_SECRET || '')
      upstreamBody = params.toString()
      upstreamHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
    }
  }

  try {
    const resp = await fetch(upstreamUrl, {
      method,
      headers: upstreamHeaders,
      body: ['GET', 'HEAD'].includes(method) ? undefined : upstreamBody,
    })

    const respContentType = resp.headers.get('content-type') || 'application/json'
    let responseBody
    if (respContentType.includes('application/json')) {
      responseBody = JSON.stringify(await resp.json())
    } else {
      responseBody = await resp.text()
    }

    const resHeaders = { 'Content-Type': respContentType }
    if (origin) Object.assign(resHeaders, corsHeaders(origin))

    return { statusCode: resp.status, headers: resHeaders, body: responseBody }
  } catch (err) {
    const resHeaders = { 'Content-Type': 'application/json' }
    if (origin) Object.assign(resHeaders, corsHeaders(origin))
    return { statusCode: 502, headers: resHeaders, body: JSON.stringify({ message: 'Upstream request failed', error: String(err) }) }
  }
}
