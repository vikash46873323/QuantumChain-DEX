// DEX (Decentralized Exchange) Logic

class DEXEngine {
    constructor() {
        this.liquidityPools = new Map();
        this.tokens = new Map();
        this.trades = [];
        this.initializeDefaultPools();
    }

    // Initialize Default Liquidity Pools
    initializeDefaultPools() {
        this.createPool('QUANTUM', 'USDT', 10000, 52000);
        this.createPool('QUANTUM', 'ETH', 5000, 10.5);
        this.createPool('USDT', 'ETH', 50000, 10.5);
    }

    // Create Liquidity Pool
    createPool(token1, token2, reserve1, reserve2) {
        const pairId = this.getPairId(token1, token2);
        
        const pool = {
            pairId: pairId,
            token1: token1,
            token2: token2,
            reserve1: reserve1,
            reserve2: reserve2,
            totalLiquidity: Math.sqrt(reserve1 * reserve2),
            fee: 0.3,
            createdAt: new Date().toISOString(),
            volume24h: 0,
            apy: this.calculateAPY(reserve1, reserve2)
        };

        this.liquidityPools.set(pairId, pool);
        console.log(`Pool created: ${token1}-${token2}`);
        return pool;
    }

    // Get Pair ID
    getPairId(token1, token2) {
        const tokens = [token1, token2].sort();
        return `${tokens[0]}-${tokens[1]}`;
    }

    // Get Pool
    getPool(token1, token2) {
        const pairId = this.getPairId(token1, token2);
        return this.liquidityPools.get(pairId);
    }

    // Get All Pools
    getAllPools() {
        return Array.from(this.liquidityPools.values());
    }

    // Swap Tokens (AMM - Automated Market Maker)
    swap(inputToken, outputToken, inputAmount, userAddress) {
        const pool = this.getPool(inputToken, outputToken);
        if (!pool) throw new Error('Pool does not exist');

        const isToken1Input = inputToken === pool.token1;
        const reserve1 = pool.reserve1;
        const reserve2 = pool.reserve2;

        const inputWithFee = inputAmount * (1 - pool.fee / 100);
        const numerator = inputWithFee * (isToken1Input ? reserve2 : reserve1);
        const denominator = (isToken1Input ? reserve1 : reserve2) + inputWithFee;
        const outputAmount = numerator / denominator;

        if (isToken1Input) {
            pool.reserve1 += inputAmount;
            pool.reserve2 -= outputAmount;
        } else {
            pool.reserve1 -= outputAmount;
            pool.reserve2 += inputAmount;
        }

        pool.volume24h += inputAmount * this.getTokenPrice(inputToken);

        this.recordTrade(inputToken, outputToken, inputAmount, outputAmount, userAddress);

        return {
            inputToken: inputToken,
            outputToken: outputToken,
            inputAmount: inputAmount,
            outputAmount: outputAmount,
            priceImpact: this.calculatePriceImpact(inputAmount, outputAmount),
            fee: inputAmount * (pool.fee / 100),
            timestamp: new Date().toISOString()
        };
    }

    // Get Token Price
    getTokenPrice(token, baseToken = 'USDT') {
        const pool = this.getPool(token, baseToken);
        if (!pool) return 1;

        const isToken1 = token === pool.token1;
        return isToken1 ? pool.reserve2 / pool.reserve1 : pool.reserve1 / pool.reserve2;
    }

    // Calculate Price Impact
    calculatePriceImpact(inputAmount, outputAmount) {
        const impact = Math.abs(inputAmount / outputAmount - 0.2) * 100;
        return Math.max(0.1, impact);
    }

    // Calculate APY
    calculateAPY(reserve1, reserve2) {
        const totalVolume = reserve1 + reserve2;
        const apy = (totalVolume * 0.003) / (reserve1 + reserve2) * 365 * 100;
        return Math.min(apy, 100);
    }

    // Record Trade
    recordTrade(inputToken, outputToken, inputAmount, outputAmount, userAddress) {
        this.trades.push({
            from: inputToken,
            to: outputToken,
            inputAmount: inputAmount,
            outputAmount: outputAmount,
            user: userAddress,
            timestamp: new Date().toISOString()
        });
    }

    // Get Trade History
    getTradeHistory(limit = 50) {
        return this.trades.slice(-limit).reverse();
    }
}

// Initialize DEX Engine
const dexEngine = new DEXEngine();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DEXEngine;
}