import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { buildAuthCookieOptions, clearAuthCookieHeader } from '../utils/authCookies.js';

const generateToken = (user) => {
  const id = user._id?.toString?.() ?? String(user._id);
  const firmId =
    user.firmId != null ? (user.firmId?.toString?.() ?? String(user.firmId)) : undefined;
  return jwt.sign(
    {
      id,
      email: user.email,
      role: user.role,
      ...(firmId ? { firmId } : {}),
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedData;

    // Treat hosted deploys as production-like even if NODE_ENV is unset (Render sets RENDER=true).
    const isProductionLike =
      process.env.NODE_ENV === 'production' ||
      process.env.RENDER === 'true' ||
      process.env.RAILWAY_ENVIRONMENT === 'production' ||
      process.env.FLY_APP_NAME; // Fly.io

    // Local dev only: any-password login unless explicitly disabled.
    const devBypass =
      !isProductionLike && process.env.DEV_ALLOW_ANY_LOGIN !== 'false';

    let user = null;

    if (devBypass) {
      // Local dev only: accept any non-empty credentials; sign in as first seeded user
      user = await User.findOne({ email }).sort({ createdAt: 1 });
      if (!user) {
        user = await User.findOne().sort({ createdAt: 1 });
      }
      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            'No users in this database. Local: run `cd server && npm run seed` then restart. Cloud (Render etc.): open a shell with the same MONGODB_URI and run `node seed.js` once, then sign in with the seeded account (e.g. demo@ca.com).'
        });
      }
    } else {
      user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const passwordMatch = await user.comparePassword(password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
    }

    const token = generateToken(user);

    const cookieOpts = buildAuthCookieOptions(req);
    res.cookie('authToken', token, cookieOpts);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          firmDetails: user.firmDetails
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  clearAuthCookieHeader(res, req, 'authToken');
  res.json({
    success: true,
    message: 'Logout successful'
  });
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          firmDetails: user.firmDetails
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
