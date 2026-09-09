// DEX Exchange with Liquidity Pools
export class LiquidityPool {
  constructor(token1, token2, reserve1 = 1000, reserve2 = 1000) {
    this.token1 = token1;
    this.token2 = token2;
    this.reserve1 = reserve1;
    this.reserve2 = reserve2;
    this.totalShares = Math.sqrt(reserve1 * reserve2);
    this.shares = {};
  }

  // Constant Product Formula: x * y = k
  getPrice(tokenIn, amountIn) {
    if (tokenIn === this.token1) {
      const amountOut = (this.reserve2 * amountIn) / (this.reserve1 + amountIn);
      return Math.floor(amountOut);
    } else {
      const amountOut = (this.reserve1 * amountIn) / (this.reserve2 + amountIn);
      return Math.floor(amountOut);
    }
  }

  // Swap tokens
  swap(tokenIn, amountIn, minAmountOut) {
    const amountOut = this.getPrice(tokenIn, amountIn);

    if (amountOut < minAmountOut) {
      throw new Error('Slippage exceeded');
    }

    if (tokenIn === this.token1) {
      this.reserve1 += amountIn;
      this.reserve2 -= amountOut;
    } else {
      this.reserve2 += amountIn;
      this.reserve1 -= amountOut;
    }

    return amountOut;
  }

  // Add liquidity
  addLiquidity(provider, amount1, amount2) {
    const shares = Math.sqrt(amount1 * amount2);
    this.shares[provider] = (this.shares[provider] || 0) + shares;
    this.totalShares += shares;
    this.reserve1 += amount1;
    this.reserve2 += amount2;
    return shares;
  }

  // Remove liquidity
  removeLiquidity(provider, shareAmount) {
    if ((this.shares[provider] || 0) < shareAmount) {
      throw new Error('Insufficient shares');
    }

    const share = shareAmount / this.totalShares;
    const amount1 = Math.floor(this.reserve1 * share);
    const amount2 = Math.floor(this.reserve2 * share);

    this.shares[provider] -= shareAmount;
    this.totalShares -= shareAmount;
    this.reserve1 -= amount1;
    this.reserve2 -= amount2;

    return { amount1, amount2 };
  }

  getPoolInfo() {
    return {
      token1: this.token1,
      token2: this.token2,
      reserve1: this.reserve1,
      reserve2: this.reserve2,
      totalShares: this.totalShares,
      price: this.reserve2 / this.reserve1
    };
  }
}

// DEX Class
export class DEX {
  constructor() {
    this.pools = {};
    this.orders = [];
    this.balances = {};
  }

  // Create trading pair
  createPool(token1, token2, reserve1, reserve2) {
    const pairName = this.getPairName(token1, token2);
    if (this.pools[pairName]) {
      throw new Error('Pool already exists');
    }

    this.pools[pairName] = new LiquidityPool(token1, token2, reserve1, reserve2);
    return this.pools[pairName];
  }

  getPairName(token1, token2) {
    return [token1, token2].sort().join('-');
  }

  // Get price quote
  getPrice(tokenIn, tokenOut, amountIn) {
    const pairName = this.getPairName(tokenIn, tokenOut);
    const pool = this.pools[pairName];

    if (!pool) {
      throw new Error('Pool does not exist');
    }

    if (pool.token1 === tokenIn) {
      return pool.getPrice(tokenIn, amountIn);
    } else {
      return pool.getPrice(tokenOut === pool.token1 ? pool.token2 : pool.token1, amountIn);
    }
  }

  // Execute swap
  swap(user, tokenIn, tokenOut, amountIn, minAmountOut) {
    const pairName = this.getPairName(tokenIn, tokenOut);
    const pool = this.pools[pairName];

    if (!pool) {
      throw new Error('Pool does not exist');
    }

    if ((this.balances[user] && this.balances[user][tokenIn]) < amountIn) {
      throw new Error('Insufficient balance');
    }

    const amountOut = pool.swap(tokenIn, amountIn, minAmountOut);

    // Update balances
    this.balances[user] = this.balances[user] || {};
    this.balances[user][tokenIn] = (this.balances[user][tokenIn] || 0) - amountIn;
    this.balances[user][tokenOut] = (this.balances[user][tokenOut] || 0) + amountOut;

    return amountOut;
  }

  // Add liquidity to pool
  addLiquidity(provider, token1, token2, amount1, amount2) {
    const pairName = this.getPairName(token1, token2);
    const pool = this.pools[pairName];

    if (!pool) {
      throw new Error('Pool does not exist');
    }

    const shares = pool.addLiquidity(provider, amount1, amount2);

    this.balances[provider] = this.balances[provider] || {};
    this.balances[provider][token1] = (this.balances[provider][token1] || 0) - amount1;
    this.balances[provider][token2] = (this.balances[provider][token2] || 0) - amount2;

    return shares;
  }

  // Remove liquidity from pool
  removeLiquidity(provider, token1, token2, shareAmount) {
    const pairName = this.getPairName(token1, token2);
    const pool = this.pools[pairName];

    if (!pool) {
      throw new Error('Pool does not exist');
    }

    const { amount1, amount2 } = pool.removeLiquidity(provider, shareAmount);

    this.balances[provider] = this.balances[provider] || {};
    this.balances[provider][token1] = (this.balances[provider][token1] || 0) + amount1;
    this.balances[provider][token2] = (this.balances[provider][token2] || 0) + amount2;

    return { amount1, amount2 };
  }

  getBalance(user, token) {
    return (this.balances[user] && this.balances[user][token]) || 0;
  }

  getAllPools() {
    const poolsInfo = {};
    for (let [pairName, pool] of Object.entries(this.pools)) {
      poolsInfo[pairName] = pool.getPoolInfo();
    }
    return poolsInfo;
  }
}
