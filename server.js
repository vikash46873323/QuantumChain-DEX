import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Blockchain, Wallet, Transaction } from './blockchain.js';
import { DEX } from './dex.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Blockchain and DEX
const blockchain = new Blockchain(3);
const dex = new DEX();

// Store active wallets
const wallets = {};

// Create initial liquidity pools
try {
  dex.createPool('QUANTUM', 'USDT', 10000, 50000);
  dex.createPool('QUANTUM', 'ETH', 5000, 25000);
} catch (e) {
  console.log('Pools already exist');
}

// ============ BLOCKCHAIN ENDPOINTS ============

// Create new wallet
app.post('/api/wallet/create', (req, res) => {
  try {
    const wallet = new Wallet();
    const address = wallet.getPublicKey();
    
    wallets[address] = {
      privateKey: wallet.getPrivateKey(),
      publicKey: wallet.getPublicKey()
    };

    blockchain.balances[address] = 1000; // Initial balance

    res.json({
      success: true,
      address: address,
      privateKey: wallet.getPrivateKey(),
      balance: blockchain.balances[address]
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get wallet balance
app.get('/api/wallet/:address/balance', (req, res) => {
  const { address } = req.params;
  const balance = blockchain.getBalance(address);
  res.json({ address, balance });
});

// Send transaction
app.post('/api/transaction/send', (req, res) => {
  try {
    const { senderAddress, senderPrivateKey, receiver, amount } = req.body;

    if (!wallets[senderAddress]) {
      return res.status(400).json({ success: false, error: 'Wallet not found' });
    }

    const transaction = new Transaction(senderAddress, receiver, amount);
    transaction.signTransaction(senderPrivateKey);

    const added = blockchain.addTransaction(transaction);
    
    if (!added) {
      return res.status(400).json({ success: false, error: 'Transaction rejected' });
    }

    res.json({
      success: true,
      transactionHash: transaction.hash,
      message: 'Transaction added to pending pool'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Mine block
app.post('/api/mine', (req, res) => {
  try {
    const { minerAddress } = req.body;

    if (!minerAddress) {
      return res.status(400).json({ success: false, error: 'Miner address required' });
    }

    const block = blockchain.minePendingTransactions(minerAddress);

    res.json({
      success: true,
      block: {
        index: block.index,
        hash: block.hash,
        timestamp: block.timestamp,
        nonce: block.nonce,
        transactionCount: block.transactions.length
      },
      minerReward: blockchain.miningReward,
      minerBalance: blockchain.getBalance(minerAddress)
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get blockchain info
app.get('/api/blockchain/info', (req, res) => {
  res.json({
    chainLength: blockchain.chain.length,
    difficulty: blockchain.difficulty,
    miningReward: blockchain.miningReward,
    pendingTransactions: blockchain.pendingTransactions.length,
    isValid: blockchain.isChainValid(),
    totalBalances: Object.keys(blockchain.balances).length
  });
});

// Get all blocks
app.get('/api/blockchain/blocks', (req, res) => {
  const blocks = blockchain.chain.map(block => ({
    index: block.index,
    hash: block.hash,
    previousHash: block.previousHash,
    timestamp: block.timestamp,
    nonce: block.nonce,
    transactionCount: block.transactions.length
  }));

  res.json({ blocks });
});

// Get block details
app.get('/api/blockchain/block/:index', (req, res) => {
  const { index } = req.params;
  const block = blockchain.chain[index];

  if (!block) {
    return res.status(404).json({ success: false, error: 'Block not found' });
  }

  res.json({
    index: block.index,
    hash: block.hash,
    previousHash: block.previousHash,
    timestamp: block.timestamp,
    nonce: block.nonce,
    transactions: block.transactions
  });
});

// ============ DEX ENDPOINTS ============

// Get all pools
app.get('/api/dex/pools', (req, res) => {
  res.json({ pools: dex.getAllPools() });
});

// Get price quote
app.get('/api/dex/price', (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn } = req.query;
    const amountOut = dex.getPrice(tokenIn, tokenOut, parseInt(amountIn));
    res.json({ tokenIn, tokenOut, amountIn, amountOut });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Execute swap
app.post('/api/dex/swap', (req, res) => {
  try {
    const { user, tokenIn, tokenOut, amountIn, minAmountOut } = req.body;
    const amountOut = dex.swap(user, tokenIn, tokenOut, parseInt(amountIn), parseInt(minAmountOut));

    res.json({
      success: true,
      user,
      tokenIn,
      tokenOut,
      amountIn,
      amountOut,
      userBalance: dex.getBalance(user, tokenOut)
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Add liquidity
app.post('/api/dex/liquidity/add', (req, res) => {
  try {
    const { provider, token1, token2, amount1, amount2 } = req.body;
    const shares = dex.addLiquidity(provider, token1, token2, parseInt(amount1), parseInt(amount2));

    res.json({
      success: true,
      provider,
      token1,
      token2,
      amount1,
      amount2,
      sharesReceived: shares
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Remove liquidity
app.post('/api/dex/liquidity/remove', (req, res) => {
  try {
    const { provider, token1, token2, shareAmount } = req.body;
    const { amount1, amount2 } = dex.removeLiquidity(provider, token1, token2, parseInt(shareAmount));

    res.json({
      success: true,
      provider,
      token1,
      token2,
      amountReceived1: amount1,
      amountReceived2: amount2
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'QuantumChain DEX is running 🚀' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 QuantumChain DEX Server running on port ${PORT}`);
  console.log(`📊 Blockchain initialized with ${blockchain.chain.length} blocks`);
  console.log(`💱 DEX initialized with ${Object.keys(dex.pools).length} trading pairs`);
});
