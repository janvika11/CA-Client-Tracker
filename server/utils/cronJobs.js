import cron from 'node-cron';
import { generateBillingForMonth, markOverdueBillings } from '../services/billingService.js';
import User from '../models/User.js';

let billingCronJob = null;
let overdueCronJob = null;

/**
 * Start cron jobs for automatic billing
 */
export const startCronJobs = () => {
  console.log('Starting cron jobs...');

  // Run billing generation on 1st of every month at 2 AM
  billingCronJob = cron.schedule('0 2 1 * *', async () => {
    console.log('[CRON] Running monthly billing generation...');
    try {
      const now = new Date();
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const month = previousMonth.getMonth() + 1;
      const year = previousMonth.getFullYear();

      // Get all firms and generate billing
      const firms = await User.find({ role: 'owner' });

      for (const firm of firms) {
        try {
          const result = await generateBillingForMonth(month, year, firm._id);
          console.log(
            `[CRON] Billing generated for firm ${firm.email}: ${result.created} entries created`
          );
        } catch (error) {
          console.error(`[CRON] Error generating billing for firm ${firm.email}:`, error.message);
        }
      }
    } catch (error) {
      console.error('[CRON] Billing generation failed:', error.message);
    }
  });

  // Run overdue marking daily at 3 AM
  overdueCronJob = cron.schedule('0 3 * * *', async () => {
    console.log('[CRON] Running overdue billing check...');
    try {
      const firms = await User.find({ role: 'owner' });

      for (const firm of firms) {
        try {
          const result = await markOverdueBillings(firm._id);
          if (result.modifiedCount > 0) {
            console.log(`[CRON] Marked ${result.modifiedCount} billings as overdue for ${firm.email}`);
          }
        } catch (error) {
          console.error(`[CRON] Error marking overdue for firm ${firm.email}:`, error.message);
        }
      }
    } catch (error) {
      console.error('[CRON] Overdue check failed:', error.message);
    }
  });

  console.log('✓ Billing generation: 1st of month at 2:00 AM');
  console.log('✓ Overdue check: Daily at 3:00 AM');
};

/**
 * Stop all cron jobs
 */
export const stopCronJobs = () => {
  if (billingCronJob) {
    billingCronJob.stop();
    console.log('Billing generation cron stopped');
  }

  if (overdueCronJob) {
    overdueCronJob.stop();
    console.log('Overdue check cron stopped');
  }
};
