// Lambda token-exchange handler
// Node 18+ runtime assumed (global fetch available)
// Env vars required: CV_CLIENT_ID, CV_CLIENT_SECRET, ALLOWED_ORIGIN (optional)

exports.handler = async function (event) {
  // Determine request origin and allowed origins list. To avoid unintentionally
  // echoing arbitrary Origins (which effectively allows any origin), we only
  // return CORS headers when the incoming Origin is present in the allowlist.
  const headerOrigin = (event.headers && (event.headers.origin || event.headers.Origin)) || null
  const envAllowed = process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || ''
  const allowedList = envAllowed.split(',').map(s => s.trim()).filter(Boolean)

  let origin = null
  if (allowedList.length === 0) {
    // No allowlist configured — default to denying cross-origin requests.
    origin = null
  } else if (allowedList.includes('*')) {
    origin = headerOrigin || '*'
  } else if (headerOrigin && allowedList.includes(headerOrigin)) {
    origin = headerOrigin
  } else {
    origin = null
  }

  // Normalize method (Function URL uses event.requestContext.http.method)
  const method = event.httpMethod || (event.requestContext && event.requestContext.http && event.requestContext.http.method)

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    if (!origin) {
      return { statusCode: 403, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'CORS origin not allowed' }) }
    }
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    }
  }
  if (method !== 'POST') {
    const headers = { 'Allow': 'POST', 'Content-Type': 'text/plain' }
    if (origin) {
      headers['Access-Control-Allow-Origin'] = origin
      headers['Access-Control-Allow-Methods'] = 'POST,OPTIONS'
    }
    return { statusCode: 405, headers, body: 'Method Not Allowed' }
  }

  // If the request includes an Origin (i.e. from a browser) but that Origin
  // is not in the allowlist, refuse the POST before contacting upstream.
  if (headerOrigin && !origin) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'CORS origin not allowed' }),
    }
  }

  let body = {}
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {}
  } catch (e) {
    // fall back to raw
    body = {}
  }

  const grant = body.grant_type || 'client_credentials'

  // Prepare upstream token request
  const tokenUrl = 'https://api.commonvoice.mozilla.org/auth/token'

  try {
    let resp
    if (grant === 'client_credentials') {
      // Common Voice token endpoint expects JSON with clientId/clientSecret when called
      // by the original frontend; send the same shape from the server-side to avoid 400.
      const jsonBody = {
        clientId: process.env.CV_CLIENT_ID || '',
        clientSecret: process.env.CV_CLIENT_SECRET || '',
      }
      resp = await fetch(tokenUrl, {
        method: 'POST',
        body: JSON.stringify(jsonBody),
        headers: { 'Content-Type': 'application/json' },
      })
    } else if (grant === 'authorization_code') {
      const params = new URLSearchParams()
      params.set('grant_type', 'authorization_code')
      params.set('code', body.code || '')
      params.set('code_verifier', body.code_verifier || '')
      params.set('redirect_uri', body.redirect_uri || '')
      // include client id/secret from env
      params.set('client_id', process.env.CV_CLIENT_ID || '')
      params.set('client_secret', process.env.CV_CLIENT_SECRET || '')
      resp = await fetch(tokenUrl, {
        method: 'POST',
        body: params.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    } else {
      // Fallback: send form-encoded with grant_type only
      const params = new URLSearchParams()
      params.set('grant_type', grant)
      resp = await fetch(tokenUrl, {
        method: 'POST',
        body: params.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    }

    const data = await resp.json()
    const resHeaders = { 'Content-Type': 'application/json' }
    if (origin) {
      resHeaders['Access-Control-Allow-Origin'] = origin
      resHeaders['Access-Control-Allow-Methods'] = 'POST,OPTIONS'
    }
    return {
      statusCode: resp.status,
      headers: resHeaders,
      body: JSON.stringify(data),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
      body: JSON.stringify({ message: 'Token exchange failed', error: String(err) }),
    }
  }
}
