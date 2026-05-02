import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      enum: ['GST', 'TDS', 'Income Tax', 'ROC', 'Audit', 'Advisory', 'Other'],
      required: true
    },
    defaultPrice: {
      type: Number,
      required: true,
      min: 0
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'half_yearly', 'annual', 'one_time'],
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Service', serviceSchema);
