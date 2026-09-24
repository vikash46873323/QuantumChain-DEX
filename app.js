//class BlockchainEngine {
 constructor(){this.blocks=[];this.transactions=[];this.blocks.push({index:0,hash:'0',previousHash:'0',transactions:[],nonce:0})}
 calculateHash(i,t,p,n){let d=`${i}${JSON.stringify(t)}${p}${n}`,h=0;for(let j=0;j<d.length;j++)h=((h<<5)-h)+d.charCodeAt(j);return Math.abs(h).toString(16);}
 addTransaction(f,t,a){this.transactions.push({from:f,to:t,amount:a})}
 mineBlock(m){let prev=this.blocks[this.blocks.length-1],nonce=0,hash='';do{nonce++;hash=this.calculateHash(prev.index+1,this.transactions,prev.hash,nonce);}while(!hash.startsWith('00'));this.blocks.push({index:prev.index+1,hash,previousHash:prev.hash,transactions:this.transactions,nonce});this.transactions=[];}
 getBalance(a){let b=1000;this.blocks.forEach(bl=>bl.transactions.forEach(tx=>{if(tx.to===a)b+=tx.amount;if(tx.from===a)b-=tx.amount;}));return b;}
}
const blockchain = new BlockchainEngine(); Global State
let userWallet = null;
let userBalance = 0;
let userNFTs = [];
let userTokens = {};
let gameStats = {
    gamesPlayed: 0,
    totalEarnings: 0,
    achievements: []
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadUserData();
    updateUI();
    checkMetaMaskConnection();
});

// Setup Event Listeners
function setupEventListeners() {
    // Tab Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchTab(tab);
        });
    });

    // Connect Wallet
    document.getElementById('connectWallet').addEventListener('click', connectMetaMask);

    // Marketplace Controls
    document.getElementById('nftSearch').addEventListener('input', filterNFTs);
    document.getElementById('nftFilter').addEventListener('change', filterNFTs);

    // DEX Controls
    document.getElementById('amountFrom').addEventListener('input', updateSwapPrice);
    document.getElementById('tokenFrom').addEventListener('change', updateSwapPrice);
    document.getElementById('tokenTo').addEventListener('change', updateSwapPrice);
}

// MetaMask Connection
async function connectMetaMask() {
    try {
        if (!window.ethereum) {
            alert('Please install MetaMask extension!');
            window.open('https://metamask.io/download.html', '_blank');
            return;
        }

        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        userWallet = accounts[0];
        console.log('Connected wallet:', userWallet);

        // Update UI
        document.getElementById('walletAddress').textContent = userWallet;
        document.getElementById('connectWallet').textContent = `Connected: ${userWallet.substring(0, 6)}...${userWallet.substring(38)}`;
        document.getElementById('connectWallet').disabled = true;

        // Simulate balance (In real scenario, fetch from blockchain)
        userBalance = Math.floor(Math.random() * 10000) + 1000;
        updateBalance();

        // Initialize user tokens
        userTokens = {
            'QUANTUM': userBalance,
            'USDT': 50000,
            'ETH': 5
        };

        // Load user data
        loadUserData();
        updateUI();

        // Store wallet in localStorage
        localStorage.setItem('userWallet', userWallet);

    } catch (error) {
        console.error('Error connecting to MetaMask:', error);
        alert('Failed to connect wallet. Make sure MetaMask is installed.');
    }
}

// Check if already connected
async function checkMetaMaskConnection() {
    try {
        if (window.ethereum) {
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });
            if (accounts.length > 0) {
                userWallet = accounts[0];
                document.getElementById('walletAddress').textContent = userWallet;
                document.getElementById('connectWallet').textContent = `Connected: ${userWallet.substring(0, 6)}...${userWallet.substring(38)}`;
                document.getElementById('connectWallet').disabled = true;
                
                userBalance = parseInt(localStorage.getItem('userBalance')) || 1000;
                userTokens = JSON.parse(localStorage.getItem('userTokens')) || {
                    'QUANTUM': userBalance,
                    'USDT': 50000,
                    'ETH': 5
                };
                
                updateUI();
            }
        }
    } catch (error) {
        console.log('No wallet connected yet');
    }
}

// Tab Navigation
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to clicked button
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Load tab-specific data
    if (tabName === 'marketplace') {
        loadMarketplace();
    } else if (tabName === 'wallet') {
        loadWalletData();
    } else if (tabName === 'dex') {
        loadDEXData();
    }
}

// Update Balance Display
function updateBalance() {
    document.getElementById('balance').textContent = `${userBalance.toFixed(2)} QUANTUM`;
}

// Load User Data
function loadUserData() {
    const savedWallet = localStorage.getItem('userWallet');
    const savedBalance = localStorage.getItem('userBalance');
    const savedNFTs = localStorage.getItem('userNFTs');
    const savedGameStats = localStorage.getItem('gameStats');

    if (savedBalance) {
        userBalance = parseInt(savedBalance);
    }

    if (savedNFTs) {
        userNFTs = JSON.parse(savedNFTs);
    }

    if (savedGameStats) {
        gameStats = JSON.parse(savedGameStats);
    }

    updateBalance();
}

// Save User Data
function saveUserData() {
    localStorage.setItem('userBalance', userBalance.toString());
    localStorage.setItem('userNFTs', JSON.stringify(userNFTs));
    localStorage.setItem('gameStats', JSON.stringify(gameStats));
    localStorage.setItem('userTokens', JSON.stringify(userTokens));
}

// Update UI
function updateUI() {
    updateBalance();
    updateDashboard();
    loadActivityFeed();
}

// Update Dashboard
function updateDashboard() {
    const portfolioValue = (userBalance * 5.2 + userTokens['USDT'] + userTokens['ETH'] * 2400).toFixed(2);
    
    document.getElementById('portfolioValue').textContent = `$${portfolioValue}`;
    document.getElementById('totalEarnings').textContent = `${gameStats.totalEarnings} QUANTUM`;
    document.getElementById('nftsOwned').textContent = userNFTs.length;
    document.getElementById('gamesPlayed').textContent = gameStats.gamesPlayed;
}

// Load Activity Feed
function loadActivityFeed() {
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';

    const activities = [
        { type: 'swap', text: 'Swapped 100 QUANTUM for 520 USDT', time: '2 hours ago' },
        { type: 'nft', text: 'Bought NFT "Digital Art #42"', time: '5 hours ago' },
        { type: 'game', text: 'Earned 250 QUANTUM from Click Game', time: '1 day ago' },
        { type: 'mint', text: 'Minted new NFT "Cosmic Wave"', time: '2 days ago' }
    ];

    activities.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <strong>${activity.type.toUpperCase()}</strong>
            <p>${activity.text}</p>
            <small>${activity.time}</small>
        `;
        activityList.appendChild(item);
    });
}

// ============ MARKETPLACE ============

function loadMarketplace() {
    const nftGrid = document.getElementById('nftGrid');
    nftGrid.innerHTML = '';

    const mockNFTs = [
        { id: 1, name: 'Digital Art #1', price: 100, emoji: '🎨' },
        { id: 2, name: 'Cosmic Wave', price: 250, emoji: '🌊' },
        { id: 3, name: 'Phoenix Rise', price: 500, emoji: '🔥' },
        { id: 4, name: 'Moon Glow', price: 150, emoji: '🌙' },
        { id: 5, name: 'Star Burst', price: 300, emoji: '⭐' },
        { id: 6, name: 'Galaxy Dream', price: 750, emoji: '🌌' }
    ];

    mockNFTs.forEach(nft => {
        const card = document.createElement('div');
        card.className = 'nft-card';
        card.innerHTML = `
            <div class="nft-image">${nft.emoji}</div>
            <div class="nft-info">
                <div class="nft-name">${nft.name}</div>
                <div class="nft-price">${nft.price} QUANTUM</div>
                <button class="btn-primary" onclick="buyNFT('${nft.name}', ${nft.price})">Buy NFT</button>
            </div>
        `;
        nftGrid.appendChild(card);
    });
}

function filterNFTs() {
    const searchTerm = document.getElementById('nftSearch').value.toLowerCase();
    const filterValue = document.getElementById('nftFilter').value;

    document.querySelectorAll('.nft-card').forEach(card => {
        const name = card.querySelector('.nft-name').textContent.toLowerCase();
        
        const matchesSearch = name.includes(searchTerm);
        const matchesFilter = !filterValue || true;

        card.style.display = matchesSearch && matchesFilter ? 'block' : 'none';
    });
}

function showMintNFTModal() {
    if (!userWallet) {
        alert('Please connect your wallet first!');
        return;
    }
    document.getElementById('mintNFTModal').classList.add('show');
}

function closeMintNFTModal() {
    document.getElementById('mintNFTModal').classList.remove('show');
}

function mintNFT() {
    const name = document.getElementById('nftName').value;
    const description = document.getElementById('nftDescription').value;
    const price = parseFloat(document.getElementById('nftPrice').value);
    const image = document.getElementById('nftImage').value;

    if (!name || !price) {
        alert('Please fill all required fields!');
        return;
    }

    const newNFT = {
        id: userNFTs.length + 1,
        name: name,
        description: description,
        price: price,
        image: image,
        owner: userWallet,
        createdAt: new Date().toISOString()
    };

    userNFTs.push(newNFT);
    saveUserData();
    closeMintNFTModal();
    alert(`NFT "${name}" minted successfully! 🎉`);

    document.getElementById('mintNFTModal').querySelectorAll('input, textarea').forEach(field => {
        field.value = '';
    });
}

function buyNFT(nftName, price) {
    if (!userWallet) {
        alert('Please connect your wallet first!');
        return;
    }

    if (userBalance < price) {
        alert('Insufficient balance!');
        return;
    }

    userBalance -= price;
    userNFTs.push({
        id: userNFTs.length + 1,
        name: nftName,
        price: price,
        owner: userWallet,
        purchasedAt: new Date().toISOString()
    });

    saveUserData();
    updateUI();
    alert(`Successfully purchased "${nftName}"! 🎉`);
}

// ============ GAMES ============

function startGame(gameType) {
    if (!userWallet) {
        alert('Please connect your wallet first!');
        return;
    }

    const modal = document.getElementById('gameModal');
    const content = document.getElementById('gameContent');
    
    modal.classList.add('show');

    switch(gameType) {
        case 'clicker':
            startClickerGame(content);
            break;
        case 'dice':
            startDiceGame(content);
            break;
        case 'battle':
            startBattleGame(content);
            break;
        case 'puzzle':
            startPuzzleGame(content);
            break;
    }
}

function startClickerGame(container) {
    let clicks = 0;
    const maxClicks = 100;
    const reward = Math.floor(maxClicks * 0.1);

    container.innerHTML = `
        <h2>🖱️ Click Game</h2>
        <p>Click the button as many times as you can!</p>
        <div style="font-size: 2rem; margin: 2rem 0;">Clicks: <strong>${clicks}</strong>/${maxClicks}</div>
        <button id="clickBtn" class="btn-primary" style="padding: 2rem; font-size: 1.5rem;">CLICK ME!</button>
        <div id="progress" style="width: 100%; height: 20px; background: rgba(99, 102, 241, 0.2); border-radius: 10px; margin-top: 1rem;">
            <div style="width: 0%; height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 10px; transition: width 0.3s;"></div>
        </div>
    `;

    const clickBtn = document.getElementById('clickBtn');
    clickBtn.addEventListener('click', () => {
        clicks++;
        document.querySelector('strong').textContent = clicks;
        
        const progress = (clicks / maxClicks) * 100;
        document.querySelector('[style*="width: 0%"]').style.width = progress + '%';

        if (clicks >= maxClicks) {
            clickBtn.disabled = true;
            completeGame('clicker', reward);
        }
    });
}

function startDiceGame(container) {
    container.innerHTML = `
        <h2>🎲 Dice Roll Game</h2>
        <p>Roll the dice and win up to 100 QUANTUM!</p>
        <div style="font-size: 4rem; margin: 2rem 0;" id="diceResult">🎲</div>
        <button class="btn-primary" onclick="rollDice()">Roll Dice</button>
        <p id="diceMessage" style="margin-top: 1rem;"></p>
    `;
}

window.rollDice = function() {
    const result = Math.floor(Math.random() * 6) + 1;
    const emojis = ['❌', '😅', '😊', '🙂', '😃', '🎉'];
    const multiplier = [0, 10, 25, 50, 75, 100];
    
    document.getElementById('diceResult').textContent = emojis[result - 1];
    const winnings = multiplier[result];
    
    if (winnings > 0) {
        document.getElementById('diceMessage').innerHTML = 
            `<strong style="color: #10b981;">You won ${winnings} QUANTUM! 🎉</strong>`;
        userBalance += winnings;
    } else {
        document.getElementById('diceMessage').innerHTML = 
            `<strong style="color: #ef4444;">Better luck next time!</strong>`;
    }
    
    gameStats.totalEarnings += winnings;
    saveUserData();
    updateUI();
};

function startBattleGame(container) {
    container.innerHTML = `
        <h2>⚔️ Battle Arena</h2>
        <p>Fight NPCs and earn QUANTUM!</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 2rem 0;">
            <div style="text-align: center;">
                <h3>You</h3>
                <div style="font-size: 3rem;">⚔️</div>
                <p id="playerHP">HP: 100</p>
            </div>
            <div style="text-align: center;">
                <h3>Enemy</h3>
                <div style="font-size: 3rem;">👹</div>
                <p id="enemyHP">HP: 80</p>
            </div>
        </div>
        <button class="btn-primary" onclick="attack()">Attack</button>
        <p id="battleMessage" style="margin-top: 1rem;"></p>
    `;
}

window.attack = function() {
    const playerDamage = Math.floor(Math.random() * 20) + 10;
    const enemyDamage = Math.floor(Math.random() * 15) + 5;
    
    let playerHP = parseInt(document.getElementById('playerHP').textContent.split(': ')[1]);
    let enemyHP = parseInt(document.getElementById('enemyHP').textContent.split(': ')[1]);
    
    playerHP -= enemyDamage;
    enemyHP -= playerDamage;
    
    document.getElementById('playerHP').textContent = `HP: ${Math.max(0, playerHP)}`;
    document.getElementById('enemyHP').textContent = `HP: ${Math.max(0, enemyHP)}`;
    
    if (enemyHP <= 0) {
        const reward = 250;
        userBalance += reward;
        gameStats.totalEarnings += reward;
        saveUserData();
        updateUI();
        document.getElementById('battleMessage').innerHTML = 
            `<strong style="color: #10b981;">You won the battle and earned ${reward} QUANTUM! 🎉</strong>`;
        document.querySelector('button').disabled = true;
    } else if (playerHP <= 0) {
        document.getElementById('battleMessage').innerHTML = 
            `<strong style="color: #ef4444;">You were defeated! Try again.</strong>`;
        document.querySelector('button').disabled = true;
    }
};

function startPuzzleGame(container) {
    container.innerHTML = `
        <h2>🧩 Puzzle Quest</h2>
        <p>Solve the puzzle: What is 25 + 37?</p>
        <input type="number" id="puzzleAnswer" placeholder="Your answer" class="input-field" style="margin: 1rem 0; width: 100%;">
        <button class="btn-primary" onclick="solvePuzzle()">Submit Answer</button>
        <p id="puzzleMessage" style="margin-top: 1rem;"></p>
    `;
}

window.solvePuzzle = function() {
    const answer = parseInt(document.getElementById('puzzleAnswer').value);
    const correctAnswer = 62;
    
    if (answer === correctAnswer) {
        const reward = 100;
        userBalance += reward;
        gameStats.totalEarnings += reward;
        saveUserData();
        updateUI();
        document.getElementById('puzzleMessage').innerHTML = 
            `<strong style="color: #10b981;">Correct! You earned ${reward} QUANTUM! 🎉</strong>`;
    } else {
        document.getElementById('puzzleMessage').innerHTML = 
            `<strong style="color: #ef4444;">Wrong answer! Try again.</strong>`;
    }
    document.querySelector('button').disabled = true;
};

function completeGame(gameType, reward) {
    gameStats.gamesPlayed++;
    gameStats.totalEarnings += reward;
    userBalance += reward;
    
    saveUserData();
    updateUI();
    
    setTimeout(() => {
        alert(`Game completed! You earned ${reward} QUANTUM! 🎉`);
    }, 500);
}

function closeGameModal() {
    document.getElementById('gameModal').classList.remove('show');
}

// ============ DEX ============

function loadDEXData() {
    const poolsList = document.getElementById('poolsList');
    poolsList.innerHTML = '';

    const pools = [
        { pair: 'QUANTUM-USDT', reserve1: 10000, reserve2: 50000, apy: '12.5%' },
        { pair: 'QUANTUM-ETH', reserve1: 5000, reserve2: 25000, apy: '18.2%' },
        { pair: 'USDT-ETH', reserve1: 50000, reserve2: 25000, apy: '15.8%' }
    ];

    pools.forEach(pool => {
        const item = document.createElement('div');
        item.className = 'pool-item';
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${pool.pair}</strong>
                    <p style="margin-top: 0.5rem; opacity: 0.8;">APY: <span style="color: #10b981;">${pool.apy}</span></p>
                </div>
                <button class="btn-secondary" onclick="addLiquidityToPool('${pool.pair}')">Add Liquidity</button>
            </div>
        `;
        poolsList.appendChild(item);
    });
}

function updateSwapPrice() {
    const amountFrom = parseFloat(document.getElementById('amountFrom').value) || 0;
    const tokenFrom = document.getElementById('tokenFrom').value;
    const tokenTo = document.getElementById('tokenTo').value;

    const prices = {
        'QUANTUM-USDT': 5.2,
        'QUANTUM-ETH': 0.0021,
        'USDT-ETH': 0.0004
    };

    const pairKey = `${tokenFrom}-${tokenTo}`;
    const price = prices[pairKey] || prices[`${tokenTo}-${tokenFrom}`] || 1;
    const amountTo = (amountFrom * price).toFixed(6);

    document.getElementById('amountTo').value = amountTo || '0';
}

function executeSwap() {
    if (!userWallet) {
        alert('Please connect your wallet first!');
        return;
    }

    const amountFrom = parseFloat(document.getElementById('amountFrom').value);
    const tokenFrom = document.getElementById('tokenFrom').value;
    const tokenTo = document.getElementById('tokenTo').value;
    const amountTo = parseFloat(document.getElementById('amountTo').value);

    if (!amountFrom || amountFrom <= 0) {
        alert('Please enter a valid amount!');
        return;
    }

    if ((userTokens[tokenFrom] || 0) < amountFrom) {
        alert(`Insufficient ${tokenFrom} balance!`);
        return;
    }

    userTokens[tokenFrom] -= amountFrom;
    userTokens[tokenTo] = (userTokens[tokenTo] || 0) + amountTo;

    saveUserData();
    updateUI();
    alert(`Swapped ${amountFrom} ${tokenFrom} for ${amountTo} ${tokenTo}! ✅`);

    document.getElementById('amountFrom').value = '';
    document.getElementById('amountTo').value = '';
}

function showAddLiquidityModal() {
    alert('Add Liquidity feature coming soon! 🚀');
}

function addLiquidityToPool(pair) {
    alert(`Adding liquidity to ${pair} pool... (Coming soon)`);
}

// ============ WALLET ============

function loadWalletData() {
    loadTokensList();
    loadMyNFTs();
    loadTransactionsList();
}

function loadTokensList() {
    const tokensList = document.getElementById('tokensList');
    tokensList.innerHTML = '';

    Object.entries(userTokens).forEach(([token, amount]) => {
        const item = document.createElement('div');
        item.className = 'token-item';
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <strong>${token}</strong>
                <span>${amount.toFixed(6)}</span>
            </div>
        `;
        tokensList.appendChild(item);
    });
}

function loadMyNFTs() {
    const nftsList = document.getElementById('myNFTsList');
    nftsList.innerHTML = '';

    if (userNFTs.length === 0) {
        nftsList.innerHTML = '<p style="opacity: 0.7;">No NFTs yet. Buy or mint your first NFT! 🎨</p>';
        return;
    }

    userNFTs.forEach(nft => {
        const item = document.createElement('div');
        item.className = 'nft-item';
        item.innerHTML = `
            <strong>${nft.name}</strong>
            <p style="margin-top: 0.5rem; opacity: 0.8;">Price: ${nft.price} QUANTUM</p>
        `;
        nftsList.appendChild(item);
    });
}

function loadTransactionsList() {
    const txList = document.getElementById('transactionsList');
    txList.innerHTML = '';

    const transactions = [
        { type: 'Swap', detail: '100 QUANTUM → 520 USDT', date: '2 hours ago', status: 'Success' },
        { type: 'NFT Purchase', detail: 'Digital Art #1', date: '5 hours ago', status: 'Success' },
        { type: 'Game Reward', detail: '+250 QUANTUM', date: '1 day ago', status: 'Success' },
        { type: 'Swap', detail: '50 USDT → 0.021 ETH', date: '2 days ago', status: 'Success' }
    ];

    transactions.forEach(tx => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <div>
                    <strong>${tx.type}</strong>
                    <p style="margin-top: 0.3rem; opacity: 0.8; font-size: 0.9rem;">${tx.detail}</p>
                </div>
                <div style="text-align: right;">
                    <span style="color: #10b981; font-weight: bold;">${tx.status}</span>
                    <p style="margin-top: 0.3rem; opacity: 0.8; font-size: 0.9rem;">${tx.date}</p>
                </div>
            </div>
        `;
        txList.appendChild(item);
    });
}

function copyToClipboard() {
    if (!userWallet) {
        alert('No wallet connected!');
        return;
    }

    navigator.clipboard.writeText(userWallet).then(() => {
        alert('Wallet address copied to clipboard! ✅');
    });
}

window.addEventListener('beforeunload', () => {
    saveUserData();
});
