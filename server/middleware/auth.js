import jwt from 'jsonwebtoken';

function getBearerToken(req) {
  const raw = req.headers?.authorization;
  if (raw == null || typeof raw !== 'string') return null;
  const m = raw.match(/^\s*Bearer\s+(\S+)\s*$/i);
  return m ? m[1] : null;
}

/** Prefer httpOnly cookie; fall back to Authorization: Bearer (cross-site / mobile). */
export function getAuthTokenFromRequest(req) {
  const fromCookie = req.cookies?.authToken;
  if (fromCookie) return fromCookie;
  return getBearerToken(req);
}

export const authenticate = (req, res, next) => {
  try {
    const token = getAuthTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id =
      decoded.id == null ? null : typeof decoded.id === 'string' ? decoded.id : String(decoded.id);
    const firmFromJwt =
      decoded.firmId == null || decoded.firmId === ''
        ? null
        : typeof decoded.firmId === 'string'
          ? decoded.firmId
          : String(decoded.firmId);
    req.user = { ...decoded, id, firmId: firmFromJwt };
    // Owner: firmId on user doc may be unset — tenant scope is their user id. Staff: use firmId from JWT.
    req.tenantFirmId = firmFromJwt || id;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message === 'jwt expired' ? 'Token expired' : 'Invalid token'
    });
  }
};

export const requireOwner = (req, res, next) => {
  if (req.user?.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Only workspace owners can perform this action',
    });
  }
  next();
};

export const optionalAuth = (req, res, next) => {
  try {
    const token = getAuthTokenFromRequest(req);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const id =
        decoded.id == null ? null : typeof decoded.id === 'string' ? decoded.id : String(decoded.id);
      const firmFromJwt =
        decoded.firmId == null || decoded.firmId === ''
          ? null
          : typeof decoded.firmId === 'string'
            ? decoded.firmId
            : String(decoded.firmId);
      req.user = { ...decoded, id, firmId: firmFromJwt };
      req.tenantFirmId = firmFromJwt || id;
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  next();
};
