import { NextRequest, NextResponse } from 'next/server'
import { signPayload } from '@/lib/oauth'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function authPage(params: { redirectUri: string; state: string; codeChallenge: string; error?: string }) {
  const { redirectUri, state, codeChallenge, error } = params
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize — SEO / GEO Lab</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#09090b;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .card{background:#18181b;border-radius:20px;padding:44px 40px;max-width:420px;width:92%;box-shadow:0 8px 40px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.08)}
    .logo{display:flex;align-items:center;gap:10px;margin-bottom:32px}
    .logo-icon{width:38px;height:38px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}
    h1{font-size:20px;font-weight:700;color:#f4f4f5;margin-bottom:8px}
    .sub{color:#71717a;font-size:14px;line-height:1.6;margin-bottom:28px}
    label{display:block;font-size:11px;font-weight:700;color:#52525b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px}
    input[type=password]{width:100%;padding:11px 14px;background:#09090b;border:1.5px solid rgba(255,255,255,0.08);border-radius:10px;font-size:14px;color:#f4f4f5;outline:none;transition:border .15s,box-shadow .15s}
    input[type=password]:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.15)}
    .error{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);color:#f87171;font-size:13px;padding:10px 14px;border-radius:8px;margin-bottom:18px}
    .btn{width:100%;padding:12px;background:#6366f1;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-top:18px;transition:background .15s}
    .btn:hover{background:#4f46e5}
    .footer{text-align:center;margin-top:22px;font-size:12px;color:#3f3f46}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div class="logo-icon">🧪</div>
      <span style="font-weight:700;font-size:17px;color:#f4f4f5">SEO / GEO Lab</span>
    </div>
    <h1>Authorize access</h1>
    <p class="sub">ChatGPT is requesting access to your SEO / GEO Lab to add and update experiments. Enter your MCP API key to allow it.</p>
    ${error ? `<div class="error">❌ Invalid API key — please try again.</div>` : ''}
    <form method="POST">
      <label>MCP API Key</label>
      <input type="password" name="api_key" placeholder="mcp-••••••••••••••••" autofocus required />
      <input type="hidden" name="redirect_uri" value="${esc(redirectUri)}" />
      <input type="hidden" name="state" value="${esc(state)}" />
      <input type="hidden" name="code_challenge" value="${esc(codeChallenge)}" />
      <button class="btn" type="submit">Authorize →</button>
    </form>
    <div class="footer">Your key is never stored — only used to issue an access token.</div>
  </div>
</body>
</html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  const redirectUri = sp.get('redirect_uri') ?? ''
  const state = sp.get('state') ?? ''
  const codeChallenge = sp.get('code_challenge') ?? ''
  const error = sp.get('error') ?? undefined

  if (!redirectUri) {
    return NextResponse.json({ error: 'missing redirect_uri' }, { status: 400, headers: CORS })
  }

  return authPage({ redirectUri, state, codeChallenge, error })
}

export async function POST(req: NextRequest) {
  let body: Record<string, string> = {}
  const ct = req.headers.get('content-type') ?? ''
  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    body = Object.fromEntries(await req.formData() as FormData) as Record<string, string>
  } else {
    body = await req.json().catch(() => ({}))
  }

  const { api_key, redirect_uri: redirectUri = '', state = '', code_challenge: codeChallenge = '' } = body

  const expectedKey = process.env.MCP_API_KEY
  if (!expectedKey || api_key !== expectedKey) {
    const params = new URLSearchParams({ redirect_uri: redirectUri, state, code_challenge: codeChallenge, error: '1' })
    return NextResponse.redirect(`${new URL(req.url).origin}/api/oauth/authorize?${params}`, { status: 303 })
  }

  const code = signPayload({ codeChallenge, redirectUri, ts: Date.now() })
  const url = new URL(redirectUri)
  url.searchParams.set('code', code)
  if (state) url.searchParams.set('state', state)

  return NextResponse.redirect(url.toString(), { status: 303 })
}
