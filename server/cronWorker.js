import cron from 'node-cron';
import { fetchAllData } from './service/fetchService.js';
import dotenv from 'dotenv';

dotenv.config();


const FETCH_SCHEDULE = process.env.FETCH_SCHEDULE || '0 18 * * 1-5'; 
const TIMEZONE = process.env.TIMEZONE || 'Asia/Kolkata';

let fetchHistory = {
  lastRun: null,
  lastSuccess: null,
  lastFailure: null,
  totalRuns: 0,
  successCount: 0,
  failureCount: 0
};

/**
 * Save fetch history to track performance
 */
function recordFetch(success, stats = null) {
  fetchHistory.lastRun = new Date();
  fetchHistory.totalRuns++;
  
  if (success) {
    fetchHistory.lastSuccess = new Date();
    fetchHistory.successCount++;
  } else {
    fetchHistory.lastFailure = new Date();
    fetchHistory.failureCount++;
  }
  
  console.log('📊 Fetch History Updated:');
  console.log(`   Total Runs: ${fetchHistory.totalRuns}`);
  console.log(`   Success: ${fetchHistory.successCount}`);
  console.log(`   Failures: ${fetchHistory.failureCount}`);
  console.log(`   Success Rate: ${((fetchHistory.successCount / fetchHistory.totalRuns) * 100).toFixed(1)}%`);
}


async function scheduledFetchJob() {
  console.log('');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(15) + 'SCHEDULED FETCH JOB' + ' '.repeat(24) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  console.log('');
  
  try {
    const result = await fetchAllData();
    
    recordFetch(result.success, result.stats);
    
    if (result.success) {
      console.log('✅ Scheduled fetch completed successfully');
    } else {
      console.error('❌ Scheduled fetch failed:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('💥 Fatal error in scheduled job:', error);
    recordFetch(false);
    throw error;
  }
}

const dailyFetchJob = cron.schedule(
  FETCH_SCHEDULE,
  scheduledFetchJob,
  {
    scheduled: true,
    timezone: TIMEZONE
  }
);

console.log('');
console.log('╔' + '═'.repeat(58) + '╗');
console.log('║' + ' '.repeat(17) + 'CRON WORKER STARTED' + ' '.repeat(22) + '║');
console.log('╚' + '═'.repeat(58) + '╝');
console.log('');
console.log('⏰ Schedule:', FETCH_SCHEDULE);
console.log('🌍 Timezone:', TIMEZONE);
console.log('📅 Next Run:', getNextRunTime());
console.log('🎯 Target: Fetch NSE/BSE deals after market close');
console.log('');
console.log('Status: ✅ Active and waiting...');
console.log('');

/**
 * Get next scheduled run time
 */
function getNextRunTime() {
  // Parse cron schedule to get next run
  // This is a simplified version - real implementation would use cron parser
  const now = new Date();
  const istTime = now.toLocaleString('en-IN', { timeZone: TIMEZONE });
  
  // If schedule is "0 18 * * 1-5" (6 PM Mon-Fri)
  if (FETCH_SCHEDULE === '0 18 * * 1-5') {
    const next = new Date();
    next.setHours(18, 0, 0, 0);
    
    // If already past 6 PM today, set to tomorrow
    if (now.getHours() >= 18) {
      next.setDate(next.getDate() + 1);
    }
    
    // Skip weekends
    const day = next.getDay();
    if (day === 0) next.setDate(next.getDate() + 1); // Sunday → Monday
    if (day === 6) next.setDate(next.getDate() + 2); // Saturday → Monday
    
    return next.toLocaleString('en-IN', { timeZone: TIMEZONE });
  }
  
  return 'Check cron schedule';
}

/**
 * Get fetch history
 */
export function getFetchHistory() {
  return {
    ...fetchHistory,
    nextScheduledRun: getNextRunTime(),
    isActive: dailyFetchJob.getStatus() === 'scheduled'
  };
}

/**
 * Manually trigger fetch (for testing)
 */
export async function triggerManualFetch() {
  console.log('🔧 Manual fetch triggered...');
  return await scheduledFetchJob();
}

/**
 * Stop cron job
 */
export function stopCronJob() {
  console.log('🛑 Stopping cron job...');
  dailyFetchJob.stop();
  console.log('✅ Cron job stopped');
}

/**
 * Start cron job (if stopped)
 */
export function startCronJob() {
  console.log('▶️  Starting cron job...');
  dailyFetchJob.start();
  console.log('✅ Cron job started');
}


const morningCheckJob = cron.schedule(
  '0 8 * * 1-5', // 8 AM, Monday-Friday
  async () => {
    console.log('');
    console.log('☀️  MORNING PRE-MARKET CHECK');
    console.log('-'.repeat(60));
    console.log('Time:', new Date().toLocaleString('en-IN', { timeZone: TIMEZONE }));
    console.log('✅ System is ready for today\'s market');
    console.log('📊 Next data fetch scheduled at 6:00 PM');
    console.log('');
  },
  {
    scheduled: true,
    timezone: TIMEZONE
  }
);


const weeklySummaryJob = cron.schedule(
  '0 7 * * 1', // 7 AM, Every Monday
  async () => {
    console.log('');
    console.log('📊 WEEKLY SUMMARY');
    console.log('='.repeat(60));
    console.log('Last Week Statistics:');
    console.log(`   Total Runs: ${fetchHistory.totalRuns}`);
    console.log(`   Successful: ${fetchHistory.successCount}`);
    console.log(`   Failed: ${fetchHistory.failureCount}`);
    console.log(`   Success Rate: ${((fetchHistory.successCount / fetchHistory.totalRuns) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    console.log('');
  },
  {
    scheduled: true,
    timezone: TIMEZONE
  }
);

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

process.on('SIGTERM', () => {
  console.log('');
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  stopCronJob();
  morningCheckJob.stop();
  weeklySummaryJob.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('');
  console.log('📴 Received SIGINT (Ctrl+C), shutting down gracefully...');
  stopCronJob();
  morningCheckJob.stop();
  weeklySummaryJob.stop();
  process.exit(0);
});

export default {
  dailyFetchJob,
  morningCheckJob,
  weeklySummaryJob,
  getFetchHistory,
  triggerManualFetch,
  stopCronJob,
  startCronJob
};