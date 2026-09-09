import crypto from 'crypto';
import EC from 'elliptic';

const ec = new EC.ec('secp256k1');

// SHA256 Hash Function
export function sha256(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Transaction Class
export class Transaction {
  constructor(sender, receiver, amount, timestamp = Date.now()) {
    this.sender = sender;
    this.receiver = receiver;
    this.amount = amount;
    this.timestamp = timestamp;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return sha256({
      sender: this.sender,
      receiver: this.receiver,
      amount: this.amount,
      timestamp: this.timestamp
    });
  }

  signTransaction(privateKey) {
    const key = ec.keyFromPrivate(privateKey);
    const signature = key.sign(this.hash);
    this.signature = signature.toDER('hex');
  }

  isValid() {
    if (this.sender === 'GENESIS') return true;
    if (!this.signature) return false;

    const key = ec.keyFromPublic(this.sender, 'hex');
    return key.verify(this.hash, this.signature);
  }
}

// Block Class
export class Block {
  constructor(index, transactions, previousHash, timestamp = Date.now()) {
    this.index = index;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return sha256({
      index: this.index,
      transactions: this.transactions,
      previousHash: this.previousHash,
      timestamp: this.timestamp,
      nonce: this.nonce
    });
  }

  mineBlock(difficulty) {
    const target = '0'.repeat(difficulty);
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`Block mined: ${this.hash}`);
  }
}

// Blockchain Class
export class Blockchain {
  constructor(difficulty = 4) {
    this.chain = [];
    this.pendingTransactions = [];
    this.difficulty = difficulty;
    this.miningReward = 10;
    this.balances = {};

    // Genesis Block
    const genesisBlock = new Block(0, [], '0');
    genesisBlock.mineBlock(this.difficulty);
    this.chain.push(genesisBlock);

    // Initial balances
    this.balances['GENESIS'] = 1000000;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(transaction) {
    if (!transaction.isValid()) {
      return false;
    }

    const balance = this.balances[transaction.sender] || 0;
    if (balance < transaction.amount) {
      return false;
    }

    this.pendingTransactions.push(transaction);
    return true;
  }

  minePendingTransactions(minerAddress) {
    const transactions = [...this.pendingTransactions];
    
    // Add mining reward transaction
    const rewardTx = new Transaction('GENESIS', minerAddress, this.miningReward);
    transactions.push(rewardTx);

    const newBlock = new Block(
      this.chain.length,
      transactions,
      this.getLatestBlock().hash
    );

    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);

    // Update balances
    for (let tx of this.pendingTransactions) {
      this.balances[tx.sender] = (this.balances[tx.sender] || 0) - tx.amount;
      this.balances[tx.receiver] = (this.balances[tx.receiver] || 0) + tx.amount;
    }

    // Miner reward
    this.balances[minerAddress] = (this.balances[minerAddress] || 0) + this.miningReward;

    this.pendingTransactions = [];
    return newBlock;
  }

  getBalance(address) {
    return this.balances[address] || 0;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  getAllBlocks() {
    return this.chain;
  }

  getPendingTransactions() {
    return this.pendingTransactions;
  }
}

// Wallet Class
export class Wallet {
  constructor() {
    const key = ec.genKeyPair();
    this.privateKey = key.getPrivate('hex');
    this.publicKey = key.getPublic('hex');
  }

  getPublicKey() {
    return this.publicKey;
  }

  getPrivateKey() {
    return this.privateKey;
  }

  sendTransaction(blockchain, receiver, amount) {
    const transaction = new Transaction(this.publicKey, receiver, amount);
    transaction.signTransaction(this.privateKey);
    return blockchain.addTransaction(transaction);
  }
}
