/**
 * Auth cookie flags for httpOnly JWT.
 * - Development: SameSite=Lax, no Secure (works on http://localhost).
 * - Production: SameSite=None + Secure so credentialed cross-site requests (e.g. Vercel → Render) include the cookie.
 */

const isProduction = process.env.NODE_ENV === 'production';

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

/** @param {import('express').Request} [_req] unused; kept for call-site compatibility */
export function buildAuthCookieOptions(_req) {
  return { ...baseCookieOptions };
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
