import mongoose from 'mongoose';

const billingEntrySchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true
    },
    clientServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientService',
      required: true
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    financialYear: {
      type: String,
      required: true,
      validate: {
        validator(v) {
          // Indian FY: 2025-26 — or full span: 2025-2026
          return typeof v === 'string' && /^\d{4}-(\d{4}|\d{2})$/.test(v);
        },
        message: 'Format should be YYYY-YY (Indian FY) or YYYY-YYYY'
      }
    },
    period: {
      month: Number,
      quarter: Number,
      year: Number,
      label: String
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'partially_paid', 'overdue', 'waived'],
      default: 'pending'
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    balance: {
      type: Number,
      default: function () {
        return this.amount - this.amountPaid;
      }
    },
    dueDate: {
      type: Date
    },
    paidOn: {
      type: Date
    },
    paymentMode: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'cheque', null],
      default: null
    },
    paymentReference: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      default: ''
    },
    carriedForwardFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillingEntry'
    },
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

billingEntrySchema.index({ clientId: 1 });
billingEntrySchema.index({ financialYear: 1 });
billingEntrySchema.index({ 'period.year': 1, 'period.month': 1 });
billingEntrySchema.index({ status: 1 });
billingEntrySchema.index({ firmId: 1 });

export default mongoose.model('BillingEntry', billingEntrySchema);
