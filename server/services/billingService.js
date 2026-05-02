import ClientService from '../models/ClientService.js';
import Service from '../models/Service.js';
import BillingEntry from '../models/BillingEntry.js';
import { getFY, getPeriodLabel } from '../utils/fyUtils.js';

/**
 * Generate billing entries for all active client services for a given month
 */
export const generateBillingForMonth = async (month, year, firmId) => {
  try {
    const fy = getFY(new Date(year, month - 1, 1));
    const createdCount = [];
    const errors = [];

    // Get all active ClientServices for this firm
    const clientServices = await ClientService.find({
      firmId,
      isActive: true,
      startDate: { $lte: new Date(year, month - 1, 1) },
      $or: [
        { endDate: null },
        { endDate: { $gte: new Date(year, month - 1, 1) } }
      ]
    })
      .populate('serviceId')
      .populate('clientId');

    for (const cs of clientServices) {
      try {
        const service = cs.serviceId;
        const client = cs.clientId;

        // Determine if billing should be generated based on billing cycle
        const shouldGenerate = shouldGenerateBillingForCycle(
          service.billingCycle,
          month,
          year
        );

        if (!shouldGenerate) continue;

        // Check if billing entry already exists
        const period = getPeriodInfo(month, year, service.billingCycle);
        const existingBilling = await BillingEntry.findOne({
          clientId: client._id,
          clientServiceId: cs._id,
          serviceId: service._id,
          financialYear: fy,
          'period.month': period.month,
          'period.quarter': period.quarter,
          'period.year': period.year
        });

        if (existingBilling) {
          continue; // Skip if already created
        }

        // Find last unpaid/partially paid entry to link as carriedForwardFrom
        const lastUnpaidBilling = await BillingEntry.findOne({
          clientId: client._id,
          clientServiceId: cs._id,
          serviceId: service._id,
          status: { $in: ['pending', 'partially_paid', 'overdue'] }
        })
          .sort({ createdAt: -1 });

        // Amount = custom price or service default price
        const amount = cs.customPrice || service.defaultPrice;

        // Create due date - 10th of billing month
        const dueDate = new Date(year, month - 1, 10);

        // Create billing entry
        const billing = await BillingEntry.create({
          clientId: client._id,
          clientServiceId: cs._id,
          serviceId: service._id,
          financialYear: fy,
          period,
          amount,
          status: 'pending',
          amountPaid: 0,
          balance: amount,
          dueDate,
          paymentMode: null,
          notes: `Auto-generated for ${getPeriodLabel(month, year, service.billingCycle)}`,
          carriedForwardFrom: lastUnpaidBilling?._id || null,
          firmId
        });

        createdCount.push({
          clientName: client.name,
          serviceName: service.name,
          amount,
          billingId: billing._id
        });
      } catch (error) {
        errors.push({
          clientServiceId: cs._id,
          error: error.message
        });
      }
    }

    return {
      success: true,
      month,
      year,
      fy,
      created: createdCount.length,
      details: createdCount,
      errors: errors.length > 0 ? errors : null
    };
  } catch (error) {
    throw new Error(`Billing generation failed: ${error.message}`);
  }
};

/**
 * Check if billing should be generated based on cycle
 */
function shouldGenerateBillingForCycle(billingCycle, month, year) {
  switch (billingCycle) {
    case 'monthly':
      return true;

    case 'quarterly':
      const q = Math.ceil(month / 3);
      return month === (q * 3 - 2) || month === 1; // Generate on 1st month of quarter (April, July, Oct, Jan)

    case 'half_yearly':
      return month === 4 || month === 10; // April (start of FY) and October

    case 'annual':
      return month === 4; // Only in April (start of financial year)

    case 'one_time':
      return false; // Never auto-generate

    default:
      return false;
  }
}

/**
 * Get period info for billing entry
 */
function getPeriodInfo(month, year, billingCycle) {
  const period = { month, year };

  if (billingCycle === 'quarterly') {
    period.quarter = Math.ceil(month / 3);
  }

  if (billingCycle === 'half_yearly' || billingCycle === 'annual') {
    period.quarter = null;
  }

  period.label = getPeriodLabel(month, year, billingCycle);

  return period;
}

/**
 * Mark overdue billings based on dueDate
 */
export const markOverdueBillings = async (firmId) => {
  try {
    const now = new Date();

    const result = await BillingEntry.updateMany(
      {
        firmId,
        status: { $in: ['pending', 'partially_paid'] },
        dueDate: { $lt: now }
      },
      {
        $set: { status: 'overdue' }
      }
    );

    return {
      success: true,
      modifiedCount: result.modifiedCount
    };
  } catch (error) {
    throw new Error(`Failed to mark overdue: ${error.message}`);
  }
};

/**
 * Get all billings for a financial year with matrix view
 */
export const getBillingMatrix = async (firmId, fy) => {
  try {
    const billings = await BillingEntry.find({
      firmId,
      financialYear: fy
    })
      .populate('clientId', 'name status')
      .populate('serviceId', 'name category')
      .lean();

    // Group by client
    const matrix = {};

    for (const billing of billings) {
      const clientId = billing.clientId._id.toString();
      const clientName = billing.clientId.name;

      if (!matrix[clientId]) {
        matrix[clientId] = {
          clientId,
          clientName,
          status: billing.clientId.status,
          months: {},
          totals: {
            totalAmount: 0,
            totalPaid: 0,
            totalBalance: 0,
            outstanding: []
          }
        };
      }

      const monthKey = billing.period.month || `Q${billing.period.quarter}`;
      if (!matrix[clientId].months[monthKey]) {
        matrix[clientId].months[monthKey] = [];
      }

      matrix[clientId].months[monthKey].push({
        service: billing.serviceId.name,
        category: billing.serviceId.category,
        amount: billing.amount,
        paid: billing.amountPaid,
        balance: billing.balance,
        status: billing.status,
        dueDate: billing.dueDate
      });

      matrix[clientId].totals.totalAmount += billing.amount;
      matrix[clientId].totals.totalPaid += billing.amountPaid;
      matrix[clientId].totals.totalBalance += billing.balance;

      if (billing.status !== 'paid' && billing.status !== 'waived') {
        matrix[clientId].totals.outstanding.push({
          month: monthKey,
          service: billing.serviceId.name,
          amount: billing.balance,
          status: billing.status
        });
      }
    }

    return {
      success: true,
      fy,
      matrix: Object.values(matrix),
      summary: {
        totalClients: Object.keys(matrix).length,
        totalBillings: billings.length,
        totalAmount: billings.reduce((sum, b) => sum + b.amount, 0),
        totalPaid: billings.reduce((sum, b) => sum + b.amountPaid, 0),
        totalOutstanding: billings.reduce((sum, b) => sum + b.balance, 0)
      }
    };
  } catch (error) {
    throw new Error(`Failed to get billing matrix: ${error.message}`);
  }
};
