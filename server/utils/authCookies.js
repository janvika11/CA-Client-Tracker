/**
 * Auth cookie flags for httpOnly JWT.
 * - Local dev (http): SameSite=Lax, Secure=false unless AUTH_COOKIE_CROSS_SITE forces None+Secure.
 * - Cross-site HTTPS (e.g. Vercel → Render): SameSite=None + Secure (required by browsers).
 *
 * Set AUTH_COOKIE_CROSS_SITE=true on Render when the SPA is on another origin so cookies are always third-party safe.
 */

function isTruthyEnv(val) {
  const s = String(val ?? '').trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
}

const crossSiteFlag = isTruthyEnv(process.env.AUTH_COOKIE_CROSS_SITE);
const isProduction = process.env.NODE_ENV === 'production';

/** SameSite=None requires Secure; use for production or explicit cross-site hosting. */
const useNoneSecure = crossSiteFlag || isProduction;

/** @param {import('express').Request} [_req] unused; kept for call-site compatibility */
export function buildAuthCookieOptions(_req) {
  const opts = {
    httpOnly: true,
    secure: useNoneSecure,
    sameSite: /** @type {'lax' | 'none' | 'strict'} */ (useNoneSecure ? 'none' : 'lax'),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };

  console.log('[authCookies] buildAuthCookieOptions', {
    AUTH_COOKIE_CROSS_SITE: process.env.AUTH_COOKIE_CROSS_SITE,
    NODE_ENV: process.env.NODE_ENV,
    crossSiteFlag,
    useNoneSecure,
    cookie: { httpOnly: opts.httpOnly, secure: opts.secure, sameSite: opts.sameSite, path: opts.path, maxAge: opts.maxAge },
  });

  return opts;
}

export function clearAuthCookieHeader(res, req, name = 'authToken') {
  const o = buildAuthCookieOptions(req);
  res.clearCookie(name, {
    path: o.path,
    httpOnly: o.httpOnly,
    secure: o.secure,
    sameSite: o.sameSite,
  });
}
