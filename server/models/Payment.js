import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true
    },
    invoiceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BillingEntry'
      }
    ],
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    mode: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'cheque'],
      required: true
    },
    reference: {
      type: String,
      required: true,
      trim: true
    },
    receivedOn: {
      type: Date,
      required: true
    },
    notes: {
      type: String,
      default: ''
    },
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

paymentSchema.index({ clientId: 1 });
paymentSchema.index({ firmId: 1 });
paymentSchema.index({ receivedOn: 1 });

export default mongoose.model('Payment', paymentSchema);
