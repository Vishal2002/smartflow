import axios from 'axios';
import * as cheerio from 'cheerio';
import * as queries from '../database/queries.js';

const NSE_BASE_URL = 'https://www.nseindia.com';

/**
 * NSE requires specific headers to work
 * These headers make our request look like a real browser
 */
const NSE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'X-Requested-With': 'XMLHttpRequest'
};

// Create axios instance with persistent session
const nseClient = axios.create({
  baseURL: NSE_BASE_URL,
  headers: NSE_HEADERS,
  timeout: 30000,
  withCredentials: true
});

const bseClient = axios.create({
  baseURL: 'https://www.bseindia.com',
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

export async function initNSESession() {
  try {
    console.log('🔐 Initializing NSE session...');
    
    await nseClient.get('/', {
      headers: {
        ...NSE_HEADERS,
        'Referer': NSE_BASE_URL
      }
    });
    
    await delay(1000);
    
    console.log('✅ NSE session initialized successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize NSE session:', error.message);
    return false;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatDateForNSE(date) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function parseNSEDate(dateStr) {
  const [day, month, year] = dateStr.split('-');
  const monthMap = {
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
    'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
    'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
  };
  return `${year}-${monthMap[month]}-${day}`;
}

function parseBSEDate(dateStr) {
  // BSE format: "02/01/2026" (DD/MM/YYYY)
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function cleanDealData(deal, exchange, dealType) {
  try {
    return {
      date: exchange === 'NSE' ? parseNSEDate(deal.date || deal.tradedDate) : parseBSEDate(deal.date),
      exchange: exchange,
      dealType: dealType,
      symbol: (deal.symbol || '').trim().toUpperCase(),
      companyName: (deal.name || deal.companyName || '').trim(),
      clientName: (deal.clientName || '').trim(),
      action: deal.buyOrSell === 'B' || deal.buyOrSell === 'BUY' ? 'BUY' : 'SELL',
      quantity: parseInt(deal.quantityTraded || deal.quantity || 0),
      price: parseFloat(deal.tradePrice || deal.price || 0),
      value: 0
    };
  } catch (error) {
    console.error('Error cleaning deal data:', error.message);
    return null;
  }
}

// ========================================
// NSE DEALS - UNIFIED FETCH
// ========================================

/**
 * Fetch both Block and Bulk deals from NSE in one go
 * This is more efficient than separate calls
 */
export async function fetchNSELargeDeals() {
  const blockDeals = [];
  const bulkDeals = [];
  
  try {
    // Fetch Block Deals
    console.log('  📦 Fetching NSE block deals...');
    const blockResponse = await nseClient.get('/api/block-deal', {
      params: { index: 'equities' },
      headers: { 'Referer': `${NSE_BASE_URL}/report-detail/eq_security` }
    });
    
    if (blockResponse.data && Array.isArray(blockResponse.data)) {
      const cleaned = blockResponse.data
        .map(deal => cleanDealData(deal, 'NSE', 'BLOCK'))
        .filter(deal => deal !== null);
      
      cleaned.forEach(deal => {
        deal.value = deal.quantity * deal.price;
      });
      
      blockDeals.push(...cleaned);
      console.log(`  ✅ Found ${blockDeals.length} NSE block deals`);
    }
  } catch (error) {
    console.error('  ❌ NSE block deals error:', error.message);
  }
  
  await delay(2000);
  
  try {
    // Fetch Bulk Deals
    console.log('  📦 Fetching NSE bulk deals...');
    const bulkResponse = await nseClient.get('/api/bulk-deal', {
      params: { index: 'equities' },
      headers: { 'Referer': `${NSE_BASE_URL}/report-detail/eq_security` }
    });
    
    if (bulkResponse.data && Array.isArray(bulkResponse.data)) {
      const cleaned = bulkResponse.data
        .map(deal => cleanDealData(deal, 'NSE', 'BULK'))
        .filter(deal => deal !== null);
      
      cleaned.forEach(deal => {
        deal.value = deal.quantity * deal.price;
      });
      
      bulkDeals.push(...cleaned);
      console.log(`  ✅ Found ${bulkDeals.length} NSE bulk deals`);
    }
  } catch (error) {
    console.error('  ❌ NSE bulk deals error:', error.message);
  }
  
  return { blockDeals, bulkDeals };
}

// ========================================
// NSE DELIVERY DATA
// ========================================

export async function fetchNSEDeliveryData(symbol) {
  try {
    const response = await nseClient.get('/api/quote-equity', {
      params: { symbol: symbol.toUpperCase() },
      headers: { 'Referer': `${NSE_BASE_URL}/get-quotes/equity?symbol=${symbol}` }
    });
    
    if (!response.data || !response.data.securityWiseDP) {
      return null;
    }
    
    const deliveryData = response.data.securityWiseDP;
    
    return {
      symbol: symbol.toUpperCase(),
      date: new Date().toISOString().split('T')[0],
      exchange: 'NSE',
      tradedQuantity: parseInt(deliveryData.quantityTraded || 0),
      deliveredQuantity: parseInt(deliveryData.deliveryQuantity || 0),
      deliveryPercent: parseFloat(deliveryData.deliveryToTradedQuantity || 0)
    };
    
  } catch (error) {
    console.error(`  ⚠️  No delivery data for ${symbol}`);
    return null;
  }
}

// ========================================
// BSE DEALS - WEB SCRAPING
// ========================================

export async function fetchBSEBulkDeals() {
  try {
    console.log('  📦 Fetching BSE bulk deals (scraping)...');
    
    const response = await bseClient.get('/markets/equity/EQReports/bulk_deals.aspx');
    const $ = cheerio.load(response.data);

    const deals = [];
    const tableId = '#ContentPlaceHolder1_gvbulk_deals';

    $(`${tableId} tr`).each((i, row) => {
      if (i === 0) return; // Skip header

      const cols = $(row).find('td');
      if (cols.length < 7) return;

      const dealDate = $(cols[0]).text().trim();
      const symbol = $(cols[2]).text().trim();
      const clientName = $(cols[3]).text().trim();
      const dealType = $(cols[4]).text().trim();
      const quantity = parseInt($(cols[5]).text().trim().replace(/,/g, '')) || 0;
      const price = parseFloat($(cols[6]).text().trim().replace(/,/g, '')) || 0;

      if (!symbol || !clientName || quantity === 0 || price === 0) return;

      const cleaned = cleanDealData(
        {
          date: dealDate,
          symbol: symbol,
          clientName: clientName,
          buyOrSell: dealType,
          quantityTraded: quantity,
          tradePrice: price
        },
        'BSE',
        'BULK'
      );

      if (cleaned) {
        cleaned.value = cleaned.quantity * cleaned.price;
        deals.push(cleaned);
      }
    });

    console.log(`  ✅ Found ${deals.length} BSE bulk deals`);
    return deals;

  } catch (error) {
    console.error('  ❌ BSE bulk deals error:', error.message);
    return [];
  }
}

export async function fetchBSEBlockDeals() {
  try {
    console.log('  📦 Fetching BSE block deals (scraping)...');
    
    const response = await bseClient.get('/markets/equity/EQReports/block_deals.aspx');
    const $ = cheerio.load(response.data);

    const deals = [];
    const tableId = '#ContentPlaceHolder1_gvblock_deals';

    $(`${tableId} tr`).each((i, row) => {
      if (i === 0) return;
      
      const cols = $(row).find('td');
      if (cols.length < 7) return;

      const dealDate = $(cols[0]).text().trim();
      const symbol = $(cols[2]).text().trim();
      const clientName = $(cols[3]).text().trim();
      const dealType = $(cols[4]).text().trim();
      const quantity = parseInt($(cols[5]).text().trim().replace(/,/g, '')) || 0;
      const price = parseFloat($(cols[6]).text().trim().replace(/,/g, '')) || 0;

      if (!symbol || !clientName) return;

      const cleaned = cleanDealData(
        {
          date: dealDate,
          symbol: symbol,
          clientName: clientName,
          buyOrSell: dealType,
          quantityTraded: quantity,
          tradePrice: price
        },
        'BSE',
        'BLOCK'
      );

      if (cleaned) {
        cleaned.value = cleaned.quantity * cleaned.price;
        deals.push(cleaned);
      }
    });

    console.log(`  ✅ Found ${deals.length} BSE block deals`);
    return deals;

  } catch (error) {
    console.error('  ❌ BSE block deals error:', error.message);
    return [];
  }
}

// ========================================
// MAIN FETCH FUNCTION
// ========================================

export async function fetchAllData() {
  console.log('');
  console.log('='.repeat(60));
  console.log('🚀 STARTING DATA FETCH PROCESS (NSE + BSE)');
  console.log('='.repeat(60));
  console.log('⏰ Time:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  console.log('');
  
  const startTime = Date.now();
  let stats = {
    nseBlockDeals: 0,
    nseBulkDeals: 0,
    bseBlockDeals: 0,
    bseBulkDeals: 0,
    deliveryData: 0,
    uniqueSymbols: 0,
    errors: 0
  };
  
  try {
    // STEP 1: Initialize NSE session
    console.log('STEP 1: Initialize NSE Session');
    console.log('-'.repeat(60));
    const sessionReady = await initNSESession();
    if (!sessionReady) {
      console.log('⚠️  NSE session failed, continuing with BSE only...');
    }

    // STEP 2: Fetch NSE Deals (Block + Bulk)
    console.log('');
    console.log('STEP 2: Fetch NSE Deals (Block + Bulk)');
    console.log('-'.repeat(60));
    await delay(2000);

    const { blockDeals: nseBlockDeals, bulkDeals: nseBulkDeals } = sessionReady 
      ? await fetchNSELargeDeals() 
      : { blockDeals: [], bulkDeals: [] };

    await queries.logFetch('BLOCK_DEALS', 'NSE', nseBlockDeals.length > 0 ? 'SUCCESS' : 'PARTIAL', nseBlockDeals.length);
    await queries.logFetch('BULK_DEALS', 'NSE', nseBulkDeals.length > 0 ? 'SUCCESS' : 'PARTIAL', nseBulkDeals.length);

    stats.nseBlockDeals = nseBlockDeals.length;
    stats.nseBulkDeals = nseBulkDeals.length;

    // STEP 3: Fetch BSE Deals (Block + Bulk)
    console.log('');
    console.log('STEP 3: Fetch BSE Deals (Block + Bulk via Scraping)');
    console.log('-'.repeat(60));
    await delay(2000);

    const bseBulkDeals = await fetchBSEBulkDeals();
    await delay(2000);
    const bseBlockDeals = await fetchBSEBlockDeals();

    await queries.logFetch('BULK_DEALS', 'BSE', bseBulkDeals.length > 0 ? 'SUCCESS' : 'PARTIAL', bseBulkDeals.length);
    await queries.logFetch('BLOCK_DEALS', 'BSE', bseBlockDeals.length > 0 ? 'SUCCESS' : 'PARTIAL', bseBlockDeals.length);

    stats.bseBulkDeals = bseBulkDeals.length;
    stats.bseBlockDeals = bseBlockDeals.length;

    // STEP 4: Process All Deals
    console.log('');
    console.log('STEP 4: Process & Insert All Deals');
    console.log('-'.repeat(60));

    const allDeals = [
      ...nseBlockDeals,
      ...nseBulkDeals,
      ...bseBulkDeals,
      ...bseBlockDeals
    ];

    console.log(`📋 Total deals: ${allDeals.length} (NSE: ${nseBlockDeals.length + nseBulkDeals.length}, BSE: ${bseBulkDeals.length + bseBlockDeals.length})`);

    const uniqueSymbols = new Set();

    for (const deal of allDeals) {
      try {
        const dealId = await queries.insertDeal(deal);
        
        if (dealId) {
          uniqueSymbols.add(deal.symbol);
          
          if (deal.action === 'BUY') {
            await queries.updateClientPattern(deal);
          }
          
          console.log(`   ✅ [${deal.exchange}-${deal.dealType}] ${deal.symbol} | ${deal.clientName} ${deal.action} ${deal.quantity.toLocaleString()} @ ₹${deal.price}`);
        }
        
        await delay(100);
        
      } catch (error) {
        console.error(`   ❌ Failed: ${deal.symbol}:`, error.message);
        stats.errors++;
      }
    }

    stats.uniqueSymbols = uniqueSymbols.size;

    // STEP 5: Fetch Delivery Data (NSE only)
    console.log('');
    console.log('STEP 5: Fetch Delivery Data (NSE Symbols)');
    console.log('-'.repeat(60));
    console.log(`📊 Processing ${uniqueSymbols.size} unique symbols...`);

    for (const symbol of uniqueSymbols) {
      try {
        await delay(2000);
        
        const deliveryData = await fetchNSEDeliveryData(symbol);
        
        if (deliveryData && deliveryData.deliveryPercent > 0) {
          const id = await queries.insertDeliveryData(deliveryData);
          if (id) {
            stats.deliveryData++;
            console.log(`   ✅ ${symbol}: ${deliveryData.deliveryPercent}% (${deliveryData.deliveredQuantity.toLocaleString()} / ${deliveryData.tradedQuantity.toLocaleString()})`);
          }
        }
        
      } catch (error) {
        stats.errors++;
      }
    }

    await queries.logFetch('DELIVERY_DATA', 'NSE', stats.deliveryData > 0 ? 'SUCCESS' : 'PARTIAL', stats.deliveryData);

    // Summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ DATA FETCH COMPLETED');
    console.log('='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   NSE Block: ${stats.nseBlockDeals} | Bulk: ${stats.nseBulkDeals}`);
    console.log(`   BSE Block: ${stats.bseBlockDeals} | Bulk: ${stats.bseBulkDeals}`);
    console.log(`   Total Deals: ${allDeals.length}`);
    console.log(`   Unique Symbols: ${stats.uniqueSymbols}`);
    console.log(`   Delivery Data: ${stats.deliveryData}`);
    console.log(`   Errors: ${stats.errors}`);
    console.log(`   Duration: ${duration}s`);
    console.log('='.repeat(60));
    console.log('');

    return {
      success: true,
      stats,
      duration
    };

  } catch (error) {
    console.error('');
    console.error('❌ DATA FETCH FAILED');
    console.error('Error:', error.message);
    console.error('');

    await queries.logFetch('ALL', 'MIXED', 'FAILED', 0, error.message);

    return {
      success: false,
      error: error.message
    };
  }
}

// ========================================
// MANUAL EXECUTION
// ========================================

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Running in test mode...');
  
  fetchAllData()
    .then(result => {
      console.log('📊 Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}