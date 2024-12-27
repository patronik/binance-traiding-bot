require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const Binance = require('node-binance-api');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Serve the frontend HTML file on the default page
app.use(express.static('public'));

// Initialize Binance API using credentials from .env file
const binance = new Binance().options({
  APIKEY: process.env.BINANCE_API_KEY,
  APISECRET: process.env.BINANCE_API_SECRET,
  'family': 4
});

app.get('/', (req, res) => {
  res.sendFile('index.html');
});

app.get('/change', (req, res) => {
  res.sendFile('change.html', { root: __dirname + '/../public' });
});

// Express endpoint to fetch and return non-zero spot wallet balances for USDT market symbols
app.get('/balances', async (req, res) => {

  try {
    // Fetch account information
    const balanceInfo = await binance.balance();    

    // Fetch latest prices for all USDT market symbols
    const prices = await binance.prices();

    const balances = {};
    // Prepare response data
    Object.entries(balanceInfo).forEach(([asset, balanceObject]) => {
      const symbol = `${asset}USDT`;

      // Skip if not in USDT market
      if (!prices[symbol] && asset !== 'USDT') return null; 

      const freeBalance = parseFloat(balanceObject.available);
      const onOrderBalance = parseFloat(balanceObject.onOrder);

      // Calculate value in USDT if a price is available
      const price = prices[symbol] ? parseFloat(prices[symbol]) : 1; // Use 1 for USDT itself
      const freeInUSDT = price * freeBalance;
      const onOrderInUSDT = price * onOrderBalance;

      balances[symbol] = {
        freeBalance: freeBalance.toFixed(8),
        onOrderBalance: onOrderBalance.toFixed(8),
        freeInUSDT: freeInUSDT.toFixed(8),
        onOrderInUSDT: onOrderInUSDT.toFixed(2)
      };      
    });

    // Send response
    res.json({ success: true, balances });
  } catch (error) {
    console.error('Error fetching spot wallet balances:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /precision/:symbol
 * Retrieves the maximum precision for a given trading pair on Binance.
 * @param {string} symbol - The trading pair symbol (e.g., BTCUSDT).
 */
app.get('/precision/:symbol', async (req, res) => {
  const { symbol } = req.params;

  try {
      // Fetch exchange information from Binance API
      const response = await axios.get('https://api.binance.com/api/v3/exchangeInfo');

      // Find the requested symbol in the response
      const pairInfo = response.data.symbols.find(pair => pair.symbol === symbol.toUpperCase());

      if (!pairInfo) {
          return res.status(404).json({
              error: `Symbol ${symbol} not found on Binance.`
          });
      }

      // Extract precision details from the filters
      const priceFilter = pairInfo.filters.find(filter => filter.filterType === 'PRICE_FILTER');
      const lotSizeFilter = pairInfo.filters.find(filter => filter.filterType === 'LOT_SIZE');

      if (!priceFilter || !lotSizeFilter) {
          return res.status(500).json({
              error: `Unable to retrieve precision details for ${symbol}.`
          });
      }

      // Prepare the precision information
      const precisionDetails = {
          symbol: pairInfo.symbol,
          baseAsset: pairInfo.baseAsset,
          quoteAsset: pairInfo.quoteAsset,
          pricePrecision: priceFilter.tickSize,
          quantityPrecision: lotSizeFilter.stepSize,
      };

      return res.status(200).json(precisionDetails);
  } catch (error) {
      console.error('Error fetching exchange info:', error.message);
      return res.status(500).json({
          error: 'Failed to fetch precision details from Binance.',
      });
  }
});

// Function to get the entire USDT balance
async function getUSDTBalance() {
  try {
    const balance = await binance.balance();
    return parseFloat(balance.USDT.available);
  } catch (error) {
    console.error('Error getting USDT balance:', error);
    return 0; // Handle error and return 0 balance
  }
}

// Function to get the entire BTC balance
async function getBTCBalance() {
  try {
    const balance = await binance.balance();
    return parseFloat(balance.BTC.available);
  } catch (error) {
    console.error('Error getting BTC balance:', error);
    return 0; // Handle error and return 0 balance
  }
}

// Function to buy BTC
async function buyAmount(symbol, amount) {
  if (amount > 0) {
    try {
      const result = await binance.marketBuy(symbol, amount);
      return result;
    } catch (error) {
      console.error('Error placing buy order:', error);
      return { error: error.message };
    }
  } else {
    return { error: 'Invalid amount to buy.' };
  }
}

// Function to sell BTC
async function sellAmount(symbol, amount) {
  if (amount > 0) {
    try {
      const result = await binance.marketSell(symbol, amount);
      return result;
    } catch (error) {
      console.error('Error placing sell order:', error);
      return { error: error.message };
    }
  } else {
    return { error: 'Invalid amount to sell.' };
  }
}

// Endpoint to buy BTC
app.post('/buy-symbol', async (req, res) => {
  console.log('Request Body:', req.body); // Log the request body
  const { amount, symbol } = req.body;
  const response = await buyAmount(symbol, parseFloat(amount));
  res.json(response);
});

// Endpoint to sell BTC
app.post('/sell-symbol', async (req, res) => {
  console.log('Request Body:', req.body); // Log the request body
  const { amount, symbol } = req.body;
  const response = await sellAmount(symbol, parseFloat(amount));
  res.json(response);
});

// Endpoint to check USDT balance
app.get('/balance/usdt', async (req, res) => {
  const usdtBalance = await getUSDTBalance();
  res.json({ usdtBalance: usdtBalance });
});

// Endpoint to check BTC balance
app.get('/balance/btc', async (req, res) => {
  const btcBalance = await getBTCBalance();
  res.json({ btcBalance: btcBalance });
});

// Endpoint to buy BTC
app.post('/buy-btc', async (req, res) => {
  console.log('Request Body:', req.body); // Log the request body
  const { amount } = req.body;
  const response = await buyAmount('BTCUSDT', parseFloat(amount));
  res.json(response);
});

// Endpoint to sell BTC
app.post('/sell-btc', async (req, res) => {
  console.log('Request Body:', req.body); // Log the request body
  const { amount } = req.body;
  const response = await sellAmount('BTCUSDT', parseFloat(amount));
  res.json(response);
});

// Endpoint to retrieve symbols for price change monitoring
app.get('/change-symbols', async (req, res) => {
  const symbols = [
    'BTCUSDT',
    'ETHUSDT',
    'XRPUSDT',
    'SOLUSDT',
    'BNBUSDT',
    'DOGEUSDT',
    'USDCUSDT',
    'ADAUSDT',
    'TRXUSDT',
    'AVAXUSDT',
    'SHIBUSDT',
    'TONUSDT',
    'LINKUSDT',
    'DOTUSDT',
    'XLMUSDT',
    'WBTCUSDT',
    'BCHUSDT',
    'SUIUSDT',
    'HBARUSDT',
    'PEPEUSDT',
    'UNIUSDT',
    'LTCUSDT',
    'NEARUSDT',
    'APTUSDT',
    'WBETHUSDT',
    'ICPUSDT',
    'POLUSDT',
    'ETCUSDT',
    'VETUSDT',
    'RENDERUSDT',
    'TAOUSDT',
    'FETUSDT',
    'ARBUSDT',
    'FILUSDT',
    'AAVEUSDT',
    'OMUSDT',
    'ALGOUSDT',
    'STXUSDT',
    'ATOMUSDT',
    'WIFUSDT',
    'FTMUSDT',
    'TIAUSDT',
    'BONKUSDT',
    'IMXUSDT',
    'OPUSDT',
    'INJUSDT',
    'ENAUSDT',
    'THETAUSDT',
    'GRTUSDT',
    'WLDUSDT',
    'FLOKIUSDT',
    'SEIUSDT',
    'RUNEUSDT',
    'JASMYUSDT',
    'SANDUSDT',
    'GALAUSDT',
    'EOSUSDT',
    'MKRUSDT',
    'QNTUSDT',
    'LDOUSDT',
    'FDUSDUSDT',
    'PYTHUSDT',
    'KAIAUSDT',
    'JUPUSDT',
    'BEAMXUSDT',
    'FLOWUSDT',
    'IOTAUSDT',
    'XTZUSDT',
    'ARUSDT',
    'STRKUSDT',
    'DYDXUSDT',
    'MOVEUSDT',
    'BTTCUSDT',
    'EGLDUSDT',
    'RAYUSDT',
    'NEOUSDT',
    'CRVUSDT',
    'AXSUSDT',
    'MANAUSDT',
    'ENSUSDT',
    'PNUTUSDT',
    'APEUSDT',
    'CAKEUSDT',
    'BNSOLUSDT',
    'CHZUSDT',
    'CFXUSDT',
    'SNXUSDT',
    'ZECUSDT',
    'FTTUSDT',
    'PENDLEUSDT',
    'MINAUSDT',
    'EIGENUSDT',
    'COMPUSDT',
    'SUPERUSDT',
    'WUSDT',
    'XECUSDT',
    'NEXOUSDT',
    'NOTUSDT',
    'ORDIUSDT',
    'NEIROUSDT'
];
  res.json(symbols.filter(s => /.*USDT$/.test(s)));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});