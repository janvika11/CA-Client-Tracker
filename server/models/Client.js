import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    firmName: {
      type: String,
      trim: true
    },
    contactPerson: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: [/.+@.+\..+/, 'Please provide a valid email']
    },
    phone: {
      type: String,
      match: [/^\+?[0-9\s\-()]+$/, 'Please provide a valid phone number']
    },
    whatsapp: {
      type: String,
      match: [/^\+?[0-9]{10,}$/, 'Please provide a valid WhatsApp number']
    },
    gstin: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v) return true; // optional field
          return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
        },
        message: 'Please provide a valid GSTIN'
      }
    },
    pan: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v) return true; // optional field
          return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
        },
        message: 'Please provide a valid PAN'
      }
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      match: [/^[0-9]{6}$/, 'Please provide a valid 6-digit pincode']
    },
    clientSince: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'onboarding'],
      default: 'onboarding'
    },
    notes: {
      type: String,
      default: ''
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

clientSchema.index({ firmId: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ pan: 1 });

export default mongoose.model('Client', clientSchema);
