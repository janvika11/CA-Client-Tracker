import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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

    // Non-production: allow any credentials unless explicitly disabled (DEV_ALLOW_ANY_LOGIN=false)
    const devBypass =
      process.env.NODE_ENV !== 'production' &&
      process.env.DEV_ALLOW_ANY_LOGIN !== 'false';

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
            'No users in database. Run: cd server && npm run seed (then restart the server).'
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

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
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

export const logout = (req, res) => {
  res.clearCookie('authToken');
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
