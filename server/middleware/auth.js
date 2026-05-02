import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  try {
    const token = req.cookies?.authToken;

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

export const optionalAuth = (req, res, next) => {
  try {
    const token = req.cookies?.authToken;
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
