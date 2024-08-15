require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const Binance = require('node-binance-api');
const cors = require('cors');

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
async function buyBTCAmount(amount) {
  if (amount > 0) {
    try {
      const result = await binance.marketBuy('BTCUSDT', amount);
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
async function sellBTCAmount(amount) {
  if (amount > 0) {
    try {
      const result = await binance.marketSell('BTCUSDT', amount);
      return result;
    } catch (error) {
      console.error('Error placing sell order:', error);
      return { error: error.message };
    }
  } else {
    return { error: 'Invalid amount to sell.' };
  }
}

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
  const response = await buyBTCAmount(parseFloat(amount));
  res.json(response);
});

// Endpoint to sell BTC
app.post('/sell-btc', async (req, res) => {
  console.log('Request Body:', req.body); // Log the request body
  const { amount } = req.body;
  const response = await sellBTCAmount(parseFloat(amount));
  res.json(response);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});