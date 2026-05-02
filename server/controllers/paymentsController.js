import Payment from '../models/Payment.js';
import BillingEntry from '../models/BillingEntry.js';
import Client from '../models/Client.js';

function formatPeriodLabel(period) {
  if (!period || typeof period !== 'object') return '—';
  if (period.label) return String(period.label);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (period.year != null && period.month != null && period.month >= 1 && period.month <= 12) {
    return `${months[period.month - 1]} ${period.year}`;
  }
  if (period.quarter != null && period.year != null) return `Q${period.quarter} ${period.year}`;
  return '—';
}

export const recordPayment = async (req, res, next) => {
  try {
    const { clientId, invoiceIds, amount, mode, reference, receivedOn, notes } = req.body;

    // Validate inputs
    if (!clientId || !amount || !mode || !reference) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: clientId, amount, mode, reference'
      });
    }

    if (!['cash', 'upi', 'bank_transfer', 'cheque'].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment mode'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Verify client exists
    const client = await Client.findOne({
      _id: clientId,
      firmId: req.tenantFirmId
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // If specific invoices provided, use them; otherwise allocate to oldest unpaid
    let targetInvoices = [];

    if (invoiceIds && invoiceIds.length > 0) {
      targetInvoices = await BillingEntry.find({
        _id: { $in: invoiceIds },
        clientId,
        firmId: req.tenantFirmId
      })
        .populate('serviceId', 'name code')
        .sort({ dueDate: 1 });
    } else {
      // FIFO allocation - oldest first
      targetInvoices = await BillingEntry.find({
        clientId,
        firmId: req.tenantFirmId,
        status: { $in: ['pending', 'partially_paid', 'overdue'] }
      })
        .populate('serviceId', 'name code')
        .sort({ dueDate: 1 });
    }

    if (targetInvoices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No unpaid invoices found for this client'
      });
    }

    // Allocate payment across invoices (FIFO)
    let remainingAmount = amount;
    const updatedInvoiceIds = [];
    const allocationDetails = [];

    for (const invoice of targetInvoices) {
      if (remainingAmount <= 0) break;

      const outstanding = invoice.amount - invoice.amountPaid;
      if (outstanding <= 0) continue;

      const paymentForThisInvoice = Math.min(remainingAmount, outstanding);

      const newAmountPaid = invoice.amountPaid + paymentForThisInvoice;
      const newBalance = invoice.amount - newAmountPaid;

      let newStatus = 'pending';
      if (newBalance === 0) {
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partially_paid';
      }

      // Update billing entry
      await BillingEntry.findByIdAndUpdate(invoice._id, {
        amountPaid: newAmountPaid,
        balance: newBalance,
        status: newStatus,
        paidOn: newStatus === 'paid' ? new Date() : invoice.paidOn,
        paymentMode: mode,
        paymentReference: reference
      });

      updatedInvoiceIds.push(invoice._id);
      remainingAmount -= paymentForThisInvoice;

      allocationDetails.push({
        invoiceId: invoice._id,
        dueDate: invoice.dueDate,
        serviceName: invoice.serviceId?.name || 'Service',
        periodLabel: formatPeriodLabel(invoice.period),
        financialYear: invoice.financialYear,
        invoiceAmount: invoice.amount,
        allocatedAmount: paymentForThisInvoice,
        newStatus,
        period: invoice.period
      });
    }

    // Create payment record
    const payment = await Payment.create({
      clientId,
      invoiceIds: updatedInvoiceIds,
      amount,
      mode,
      reference,
      receivedOn: receivedOn ? new Date(receivedOn) : new Date(),
      notes,
      firmId: req.tenantFirmId
    });

    // Log any unallocated amount
    const unallocatedAmount = remainingAmount > 0 ? remainingAmount : 0;

    res.status(201).json({
      success: true,
      message: 'Payment recorded and allocated',
      data: {
        payment,
        allocations: allocationDetails,
        unallocatedAmount,
        summary: {
          totalAllocated: amount - unallocatedAmount,
          invoicesUpdated: updatedInvoiceIds.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const listPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, clientId, mode, sortBy = '-receivedOn' } = req.validatedQuery;
    const skip = (page - 1) * limit;

    const query = { firmId: req.tenantFirmId };

    if (clientId) {
      query.clientId = clientId;
    }

    if (mode) {
      query.mode = mode;
    }

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('clientId', 'name email pan')
        .populate('invoiceIds', 'amount status period')
        .sort(sortBy.startsWith('-') ? { [sortBy.slice(1)]: -1 } : { [sortBy]: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      firmId: req.tenantFirmId
    })
      .populate('clientId')
      .populate('invoiceIds');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = { firmId: req.tenantFirmId };

    if (startDate || endDate) {
      query.receivedOn = {};
      if (startDate) query.receivedOn.$gte = new Date(startDate);
      if (endDate) query.receivedOn.$lte = new Date(endDate);
    }

    const stats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$mode',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const overallStats = {
      totalPayments: 0,
      totalAmount: 0,
      byMode: {}
    };

    for (const stat of stats) {
      overallStats.byMode[stat._id] = {
        count: stat.count,
        amount: stat.totalAmount
      };

      overallStats.totalPayments += stat.count;
      overallStats.totalAmount += stat.totalAmount;
    }

    res.json({
      success: true,
      data: { stats: overallStats }
    });
  } catch (error) {
    next(error);
  }
};

export const getClientPaymentHistory = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Verify client exists
    const client = await Client.findOne({
      _id: clientId,
      firmId: req.tenantFirmId
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const [payments, total] = await Promise.all([
      Payment.find({ clientId, firmId: req.tenantFirmId })
        .populate('invoiceIds', 'amount status period')
        .sort('-receivedOn')
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments({ clientId, firmId: req.tenantFirmId })
    ]);

    res.json({
      success: true,
      data: {
        client: {
          id: client._id,
          name: client.name,
          email: client.email
        },
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
