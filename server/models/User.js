import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/.+@.+\..+/, 'Please provide a valid email']
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'staff'],
      default: 'owner'
    },
    firmDetails: {
      firmName: {
        type: String,
        trim: true
      },
      address: {
        type: String,
        trim: true
      },
      logo: {
        type: String
      }
    },
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ firmId: 1 });

// Hash plaintext password before saving (skip if value is already a bcrypt hash — avoids double-hash from seed mistakes).
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  const raw = this.passwordHash;
  if (typeof raw === 'string' && /^\$2[aby]\$\d{2}\$/.test(raw)) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(raw, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.model('User', userSchema);
