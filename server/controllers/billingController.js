import BillingEntry from '../models/BillingEntry.js';
import { generateBillingForMonth, getBillingMatrix as getBillingMatrixService, markOverdueBillings } from '../services/billingService.js';
import { paginationSchema } from '../utils/validators.js';

export const generateBilling = async (req, res, next) => {
  try {
    const { month, year } = req.body;

    // Validate month and year
    if (!month || !year || month < 1 || month > 12 || year < 2020 || year > 2099) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month or year'
      });
    }

    const result = await generateBillingForMonth(month, year, req.tenantFirmId);

    res.json({
      success: true,
      message: `Billing generated for month ${month}/${year}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getBillingMatrix = async (req, res, next) => {
  try {
    const { fy } = req.query;

    if (!fy) {
      return res.status(400).json({
        success: false,
        message: 'Financial year required (e.g., 2025-26)'
      });
    }

    // Validate FY format
    if (!/^\d{4}-\d{2}$/.test(fy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid FY format. Use YYYY-YY (e.g., 2025-26)'
      });
    }

    const result = await getBillingMatrixService(req.tenantFirmId, fy);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const listBillings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, clientId, status, fy, month, sortBy = '-createdAt' } = req.validatedQuery;
    const skip = (page - 1) * limit;

    const query = { firmId: req.tenantFirmId };

    if (clientId) {
      query.clientId = clientId;
    }

    if (status) {
      query.status = status;
    }

    if (fy) {
      query.financialYear = fy;
    }

    if (month) {
      query['period.month'] = parseInt(month);
    }

    const [billings, total] = await Promise.all([
      BillingEntry.find(query)
        .populate('clientId', 'name email pan gstin')
        .populate('serviceId', 'name code category')
        .sort(sortBy.startsWith('-') ? { [sortBy.slice(1)]: -1 } : { [sortBy]: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BillingEntry.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        billings,
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

export const getBilling = async (req, res, next) => {
  try {
    const billing = await BillingEntry.findOne({
      _id: req.params.id,
      firmId: req.tenantFirmId
    })
      .populate('clientId')
      .populate('serviceId')
      .populate('carriedForwardFrom');

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Billing entry not found'
      });
    }

    res.json({
      success: true,
      data: { billing }
    });
  } catch (error) {
    next(error);
  }
};

export const updateBillingStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['pending', 'paid', 'partially_paid', 'overdue', 'waived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const billing = await BillingEntry.findOne({
      _id: req.params.id,
      firmId: req.tenantFirmId
    });

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Billing entry not found'
      });
    }

    billing.status = status;
    if (notes) billing.notes = notes;

    await billing.save();

    res.json({
      success: true,
      message: 'Billing status updated',
      data: { billing }
    });
  } catch (error) {
    next(error);
  }
};

export const markOverdue = async (req, res, next) => {
  try {
    const result = await markOverdueBillings(req.tenantFirmId);

    res.json({
      success: true,
      message: 'Overdue billings marked',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getBillingStats = async (req, res, next) => {
  try {
    const { fy } = req.query;

    const query = { firmId: req.tenantFirmId };

    if (fy) {
      query.financialYear = fy;
    }

    const stats = await BillingEntry.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalPaid: { $sum: '$amountPaid' },
          totalBalance: { $sum: '$balance' }
        }
      }
    ]);

    const overallStats = {
      totalBillings: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalBalance: 0,
      byStatus: {}
    };

    for (const stat of stats) {
      overallStats.byStatus[stat._id] = {
        count: stat.count,
        amount: stat.totalAmount,
        paid: stat.totalPaid,
        balance: stat.totalBalance
      };

      overallStats.totalBillings += stat.count;
      overallStats.totalAmount += stat.totalAmount;
      overallStats.totalPaid += stat.totalPaid;
      overallStats.totalBalance += stat.totalBalance;
    }

    res.json({
      success: true,
      data: {
        stats: overallStats,
        collectionRate: overallStats.totalAmount > 0
          ? ((overallStats.totalPaid / overallStats.totalAmount) * 100).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    next(error);
  }
};
