// Blockchain Logic for QuantumChain DEX

class BlockchainEngine {
    constructor() {
        this.blocks = [];
        this.transactions = [];
        this.accounts = new Map();
        this.smartContracts = new Map();
        this.createGenesisBlock();
    }

    // Create Genesis Block
    createGenesisBlock() {
        const genesisBlock = {
            index: 0,
            timestamp: new Date().toISOString(),
            transactions: [],
            nonce: 0,
            previousHash: '0',
            hash: this.calculateHash(0, [], '0', 0)
        };
        this.blocks.push(genesisBlock);
    }

    // Calculate Hash
    calculateHash(index, transactions, previousHash, nonce) {
        const data = `${index}${JSON.stringify(transactions)}${previousHash}${nonce}`;
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    // Add Transaction
    addTransaction(from, to, amount, type = 'transfer') {
        const transaction = {
            id: this.generateTransactionId(),
            from: from,
            to: to,
            amount: amount,
            type: type,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        this.transactions.push(transaction);
        return transaction;
    }

    // Generate Transaction ID
    generateTransactionId() {
        return 'tx_' + Math.random().toString(36).substr(2, 9);
    }

    // Mine Block
    mineBlock(minerAddress) {
        const previousBlock = this.blocks[this.blocks.length - 1];
        let nonce = 0;
        let hash = '';

        // Proof of Work
        do {
            nonce++;
            hash = this.calculateHash(
                previousBlock.index + 1,
                this.transactions,
                previousBlock.hash,
                nonce
            );
        } while (!hash.startsWith('00')); // Simple PoW: hash starts with 00

        // Create new block
        const newBlock = {
            index: previousBlock.index + 1,
            timestamp: new Date().toISOString(),
            transactions: this.transactions,
            nonce: nonce,
            previousHash: previousBlock.hash,
            hash: hash,
            minerAddress: minerAddress,
            reward: 10 // Miner reward in QUANTUM
        };

        this.blocks.push(newBlock);
        this.transactions = []; // Reset transactions

        return newBlock;
    }

    // Get Account Balance
    getBalance(address) {
        let balance = 1000; // Starting balance

        this.blocks.forEach(block => {
            block.transactions.forEach(tx => {
                if (tx.to === address) balance += tx.amount;
                if (tx.from === address) balance -= tx.amount;
            });
        });

        return balance;
    }

    // Verify Blockchain
    isChainValid() {
        for (let i = 1; i < this.blocks.length; i++) {
            const currentBlock = this.blocks[i];
            const previousBlock = this.blocks[i - 1];

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }

            const calculatedHash = this.calculateHash(
                currentBlock.index,
                currentBlock.transactions,
                currentBlock.previousHash,
                currentBlock.nonce
            );

            if (currentBlock.hash !== calculatedHash) {
                return false;
            }
        }

        return true;
    }

    // Get Blockchain Info
    getBlockchainInfo() {
        return {
            totalBlocks: this.blocks.length,
            totalTransactions: this.blocks.reduce((sum, block) => sum + block.transactions.length, 0),
            pendingTransactions: this.transactions.length,
            isValid: this.isChainValid(),
            difficulty: 2 // Current PoW difficulty
        };
    }

    // Get Block by Index
    getBlock(index) {
        return this.blocks[index] || null;
    }

    // Get All Blocks
    getBlocks() {
        return this.blocks;
    }
}

// Mining Pool
class MiningPool {
    constructor(blockchain) {
        this.blockchain = blockchain;
        this.miners = new Map();
        this.poolReward = 10; // QUANTUM per block
    }

    // Join Pool
    joinPool(minerAddress) {
        if (!this.miners.has(minerAddress)) {
            this.miners.set(minerAddress, {
                address: minerAddress,
                shares: 0,
                rewards: 0,
                joinedAt: new Date().toISOString()
            });
        }
    }

    // Mine Block in Pool
    mineBlockInPool(minerAddress) {
        const block = this.blockchain.mineBlock(minerAddress);
        const miner = this.miners.get(minerAddress);
        
        if (miner) {
            miner.shares += 1;
            miner.rewards += this.poolReward;
        }

        return block;
    }

    // Get Miner Stats
    getMinerStats(minerAddress) {
        return this.miners.get(minerAddress) || null;
    }
}

// Smart Contract Executor
class SmartContractExecutor {
    constructor() {
        this.contracts = new Map();
    }

    // Deploy Smart Contract
    deployContract(contractId, code, owner) {
        const contract = {
            id: contractId,
            code: code,
            owner: owner,
            deployedAt: new Date().toISOString(),
            state: {},
            executions: 0
        };

        this.contracts.set(contractId, contract);
        return contract;
    }

    // Execute Smart Contract
    executeContract(contractId, functionName, params) {
        const contract = this.contracts.get(contractId);
        if (!contract) throw new Error('Contract not found');

        try {
            // Simple contract execution
            contract.executions++;
            return {
                success: true,
                result: `Executed ${functionName} on contract ${contractId}`,
                blockNumber: 0
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Initialize Blockchain
const blockchain = new BlockchainEngine();
const miningPool = new MiningPool(blockchain);
const contractExecutor = new SmartContractExecutor();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BlockchainEngine, MiningPool, SmartContractExecutor };
}