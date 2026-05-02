import mongoose from 'mongoose';

const clientServiceSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    customPrice: {
      type: Number,
      min: 0
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'half_yearly', 'annual', 'one_time']
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
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

clientServiceSchema.index({ clientId: 1 });
clientServiceSchema.index({ serviceId: 1 });
clientServiceSchema.index({ firmId: 1 });

export default mongoose.model('ClientService', clientServiceSchema);
