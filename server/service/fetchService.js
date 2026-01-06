import axios from 'axios';
import * as cheerio from 'cheerio';
import * as queries from '../database/queries.js';

const NSE_BASE_URL = 'https://www.nseindia.com';

const NSE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'X-Requested-With': 'XMLHttpRequest'
};

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
    console.log('Initializing NSE session...');
    await nseClient.get('/', {
      headers: { ...NSE_HEADERS, 'Referer': NSE_BASE_URL }
    });
    await delay(1000);
    console.log('NSE session initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize NSE session:', error.message);
    return false;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseNSEDate(dateStr) {
    if (!dateStr) return null;
    
    // Clean and uppercase the month part
    const parts = dateStr.trim().split('-');
    if (parts.length !== 3) return null;
    
    const [day, monthAbbr, year] = parts;
    const monthMap = {
      'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
      'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
      'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
    };
    
    const month = monthMap[monthAbbr.toUpperCase()];
    if (!month) {
      console.error('Invalid month in NSE date:', dateStr);
      return null;
    }
    
    return `${year}-${month}-${day.padStart(2, '0')}`;
  }

function parseBSEDate(dateStr) {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function cleanDealData(rawDeal, exchange, dealType) {
  try {
    const dateStr = rawDeal.date || rawDeal.tradedDate || '';
    const date = exchange === 'NSE' ? parseNSEDate(dateStr) : parseBSEDate(dateStr);
    if (!date) return null;

    const quantity = parseInt(
      (rawDeal.quantityTraded || rawDeal.qty || rawDeal.quantity || '0')
        .toString()
        .replace(/,/g, '')
    ) || 0;

    const price = parseFloat(
      (rawDeal.tradePrice || rawDeal.watp || rawDeal.price || '0')
        .toString()
        .replace(/,/g, '')
    ) || 0;

    const symbol = (rawDeal.symbol || rawDeal.name || '').trim().toUpperCase();
    if (!symbol || quantity === 0 || price === 0) return null;

    return {
      date,
      exchange,
      dealType,
      symbol,
      companyName: (rawDeal.name || rawDeal.companyName || '').trim(),
      clientName: (rawDeal.clientName || '').trim(),
      action: (rawDeal.buyOrSell || rawDeal.buySell || '').toString().trim().toUpperCase() === 'B' ? 'BUY' : 'SELL',
      quantity,
      price,
      value: quantity * price
    };
  } catch (error) {
    console.error('Error cleaning deal data:', error.message, rawDeal);
    return null;
  }
}

// ========================================
// NSE LARGE DEALS
// ========================================

export async function fetchNSELargeDeals() {
  try {
    console.log('  Fetching NSE bulk & block deals (unified endpoint)...');

    const response = await nseClient.get('/api/snapshot-capital-market-largedeal', {
      headers: {
        'Referer': 'https://www.nseindia.com/market-data/block-deal-watch',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      }
    });

    if (!response.data || typeof response.data !== 'object') {
      console.log('  No NSE large deals data available');
      return { blockDeals: [], bulkDeals: [] };
    }

    const rawBulk = Array.isArray(response.data.BULK_DEALS_DATA) ? response.data.BULK_DEALS_DATA : [];
    const rawBlock = Array.isArray(response.data.BLOCK_DEALS_DATA) ? response.data.BLOCK_DEALS_DATA : [];

    const bulkDeals = rawBulk
      .map(deal => cleanDealData(deal, 'NSE', 'BULK'))
      .filter(Boolean);

    const blockDeals = rawBlock
      .map(deal => cleanDealData(deal, 'NSE', 'BLOCK'))
      .filter(Boolean);

    console.log(`  Fetched ${blockDeals.length} NSE block + ${bulkDeals.length} NSE bulk deals`);
    return { blockDeals, bulkDeals };

  } catch (error) {
    console.error('  Error fetching NSE large deals:', error.message);
    if (error.response) console.error('     Status:', error.response.status);
    return { blockDeals: [], bulkDeals: [] };
  }
}

// ========================================
// BSE DEALS (SCRAPING - RELIABLE BACKUP)
// ========================================

export async function fetchBSEBulkDeals() {
  try {
    console.log('  Fetching BSE bulk deals...');
    const response = await bseClient.get('/markets/equity/EQReports/bulk_deals.aspx');
    const $ = cheerio.load(response.data);

    const deals = [];
    $('#ContentPlaceHolder1_gvbulk_deals tr').each((i, row) => {
      if (i === 0) return;
      const cols = $(row).find('td');
      if (cols.length < 7) return;

      const raw = {
        date: $(cols[0]).text().trim(),
        symbol: $(cols[2]).text().trim(),
        clientName: $(cols[3]).text().trim(),
        buyOrSell: $(cols[4]).text().trim(),
        quantityTraded: $(cols[5]).text().trim(),
        tradePrice: $(cols[6]).text().trim()
      };

      const deal = cleanDealData(raw, 'BSE', 'BULK');
      if (deal) deals.push(deal);
    });

    console.log(`  Found ${deals.length} BSE bulk deals`);
    return deals;
  } catch (error) {
    console.error('  BSE bulk deals error:', error.message);
    return [];
  }
}

export async function fetchBSEBlockDeals() {
  try {
    console.log('  Fetching BSE block deals...');
    const response = await bseClient.get('/markets/equity/EQReports/block_deals.aspx');
    const $ = cheerio.load(response.data);

    const deals = [];
    $('#ContentPlaceHolder1_gvblock_deals tr').each((i, row) => {
      if (i === 0) return;
      const cols = $(row).find('td');
      if (cols.length < 7) return;

      const raw = {
        date: $(cols[0]).text().trim(),
        symbol: $(cols[2]).text().trim(),
        clientName: $(cols[3]).text().trim(),
        buyOrSell: $(cols[4]).text().trim(),
        quantityTraded: $(cols[5]).text().trim(),
        tradePrice: $(cols[6]).text().trim()
      };

      const deal = cleanDealData(raw, 'BSE', 'BLOCK');
      if (deal) deals.push(deal);
    });

    console.log(`  Found ${deals.length} BSE block deals`);
    return deals;
  } catch (error) {
    console.error('  BSE block deals error:', error.message);
    return [];
  }
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

    if (!response.data?.securityWiseDP) return null;

    const dp = response.data.securityWiseDP;
    return {
      symbol: symbol.toUpperCase(),
      date: new Date().toISOString().split('T')[0],
      exchange: 'NSE',
      tradedQuantity: parseInt(dp.quantityTraded) || 0,
      deliveredQuantity: parseInt(dp.deliveryQuantity) || 0,
      deliveryPercent: parseFloat(dp.deliveryToTradedQuantity) || 0
    };
  } catch (error) {
    return null;
  }
}

// ========================================
// MAIN FETCH FUNCTION (your excellent version - kept intact)
// ========================================

export async function fetchAllData() {
  console.log('');
  console.log('='.repeat(60));
  console.log('STARTING DATA FETCH PROCESS (NSE + BSE)');
  console.log('='.repeat(60));
  console.log('Time:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  console.log('');
  
  const startTime = Date.now();
  const stats = {
    nseBlockDeals: 0, nseBulkDeals: 0,
    bseBlockDeals: 0, bseBulkDeals: 0,
    deliveryData: 0, uniqueSymbols: 0, errors: 0
  };
  
  try {
    console.log('STEP 1: Initialize NSE Session');
    console.log('-'.repeat(60));
    const sessionReady = await initNSESession();
    if (!sessionReady) console.log('NSE session failed - proceeding with BSE only');

    console.log('');
    console.log('STEP 2: Fetch NSE Deals');
    console.log('-'.repeat(60));
    
    let nseBlockDeals = [], nseBulkDeals = [];
    if (sessionReady) {
      await delay(2000);
      const nseData = await fetchNSELargeDeals();
      nseBlockDeals = nseData.blockDeals;
      nseBulkDeals = nseData.bulkDeals;
    }

    stats.nseBlockDeals = nseBlockDeals.length;
    stats.nseBulkDeals = nseBulkDeals.length;

    console.log('');
    console.log('STEP 3: Fetch BSE Deals');
    console.log('-'.repeat(60));
    await delay(2000);

    const bseBulkDeals = await fetchBSEBulkDeals();
    await delay(2000);
    const bseBlockDeals = await fetchBSEBlockDeals();

    stats.bseBulkDeals = bseBulkDeals.length;
    stats.bseBlockDeals = bseBlockDeals.length;

    console.log('');
    console.log('STEP 4: Process All Deals');
    console.log('-'.repeat(60));

    const allDeals = [...nseBlockDeals, ...nseBulkDeals, ...bseBulkDeals, ...bseBlockDeals];
    console.log(`Total deals: ${allDeals.length} (NSE: ${nseBlockDeals.length + nseBulkDeals.length}, BSE: ${bseBulkDeals.length + bseBlockDeals.length})`);

    const uniqueSymbols = new Set();

    for (const deal of allDeals) {
      try {
        const dealId = await queries.insertDeal(deal);
        if (dealId) {
          uniqueSymbols.add(deal.symbol);
          if (deal.action === 'BUY') await queries.updateClientPattern(deal);
          console.log(`   [${deal.exchange}-${deal.dealType}] ${deal.symbol} | ${deal.clientName.substring(0, 30)} ${deal.action}`);
        }
        await delay(100);
      } catch (error) {
        stats.errors++;
      }
    }

    stats.uniqueSymbols = uniqueSymbols.size;

    console.log('');
    console.log('STEP 5: Fetch Delivery Data');
    console.log('-'.repeat(60));

    if (uniqueSymbols.size <= 50) {
      for (const symbol of uniqueSymbols) {
        await delay(2000);
        const delivery = await fetchNSEDeliveryData(symbol);
        if (delivery && delivery.deliveryPercent > 0) {
          await queries.insertDeliveryData(delivery);
          stats.deliveryData++;
          console.log(`   ${symbol}: ${delivery.deliveryPercent}% delivery`);
        }
      }
    } else {
      console.log(`Skipping delivery fetch (${uniqueSymbols.size} symbols > 50)`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('='.repeat(60));
    console.log('FETCH COMPLETED');
    console.log('='.repeat(60));
    console.log(`NSE: ${stats.nseBlockDeals} block + ${stats.nseBulkDeals} bulk`);
    console.log(`BSE: ${stats.bseBlockDeals} block + ${stats.bseBulkDeals} bulk`);
    console.log(`Total: ${allDeals.length} deals | ${stats.uniqueSymbols} symbols | ${stats.deliveryData} delivery records`);
    console.log(`Duration: ${duration}s`);
    console.log('='.repeat(60));

    return { success: true, stats, duration };
  } catch (error) {
    console.error('FETCH FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

// Manual test
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAllData().then(r => process.exit(r.success ? 0 : 1));
}