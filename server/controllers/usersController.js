import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * Users tied to this workspace: primary owner (`_id` === tenant) plus anyone with `firmId` === tenant.
 */
export const listTeamUsers = async (req, res, next) => {
  try {
    const firmKey = req.tenantFirmId;
    const or = [{ _id: firmKey }, { firmId: firmKey }];
    const users = await User.find({ $or: or }).select('-passwordHash').sort({ name: 1 }).lean();

    res.json({
      success: true,
      data: { users },
    });
  } catch (err) {
    next(err);
  }
};

export const createInvitedUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.validatedData;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const inviter = await User.findById(req.user.id).select('firmDetails').lean();
    let firmDetails = inviter?.firmDetails;
    if (firmDetails && typeof firmDetails === 'object') {
      firmDetails = { ...firmDetails };
      const hasAny = Object.values(firmDetails).some((v) => v != null && String(v).trim() !== '');
      if (!hasAny) firmDetails = undefined;
    } else {
      firmDetails = undefined;
    }

    const firmScope = req.tenantFirmId;

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: password,
      role,
      firmId: new mongoose.Types.ObjectId(String(firmScope)),
      ...(firmDetails ? { firmDetails } : {}),
    });

    res.status(201).json({
      success: true,
      message: 'Account created. They can sign in with this email and password.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }
    next(err);
  }
};
