// Game Logic and Mechanics

class GameEngine {
    constructor() {
        this.games = {
            clicker: new ClickerGame(),
            dice: new DiceGame(),
            battle: new BattleGame(),
            puzzle: new PuzzleGame()
        };
        this.playerStats = new Map();
    }

    // Start Game
    startGame(gameType, playerId) {
        const game = this.games[gameType];
        if (!game) throw new Error('Game not found');
        
        return game.start(playerId);
    }

    // Get Game Stats
    getPlayerStats(playerId) {
        return this.playerStats.get(playerId) || {
            gamesPlayed: 0,
            totalEarnings: 0,
            wins: 0,
            losses: 0,
            achievements: []
        };
    }

    // Update Player Stats
    updatePlayerStats(playerId, earnings, isWin) {
        const stats = this.getPlayerStats(playerId);
        stats.gamesPlayed++;
        stats.totalEarnings += earnings;
        if (isWin) stats.wins++;
        else stats.losses++;
        
        this.playerStats.set(playerId, stats);
        return stats;
    }
}

// Clicker Game
class ClickerGame {
    constructor() {
        this.name = 'Click Game';
        this.maxClicks = 100;
        this.rewardPerClick = 0.1; // QUANTUM
    }

    start(playerId) {
        return {
            gameType: 'clicker',
            playerId: playerId,
            maxClicks: this.maxClicks,
            reward: this.maxClicks * this.rewardPerClick,
            difficulty: 'Easy',
            timeLimit: 60 // seconds
        };
    }

    calculateReward(clicksCompleted) {
        return clicksCompleted * this.rewardPerClick;
    }
}

// Dice Game
class DiceGame {
    constructor() {
        this.name = 'Dice Roll';
        this.minReward = 10;
        this.maxReward = 100;
    }

    start(playerId) {
        return {
            gameType: 'dice',
            playerId: playerId,
            minReward: this.minReward,
            maxReward: this.maxReward,
            difficulty: 'Medium'
        };
    }

    roll() {
        return Math.floor(Math.random() * 6) + 1;
    }

    calculateReward(diceResult) {
        const rewards = [0, 10, 25, 50, 75, 100];
        return rewards[diceResult - 1];
    }
}

// Battle Game
class BattleGame {
    constructor() {
        this.name = 'Battle Arena';
        this.playerMaxHP = 100;
        this.enemyMaxHP = 80;
        this.baseReward = 250;
    }

    start(playerId) {
        return {
            gameType: 'battle',
            playerId: playerId,
            playerHP: this.playerMaxHP,
            enemyHP: this.enemyMaxHP,
            difficulty: 'Hard',
            reward: this.baseReward
        };
    }

    calculateDamage(isPlayer = true) {
        if (isPlayer) {
            return Math.floor(Math.random() * 20) + 10; // 10-30
        } else {
            return Math.floor(Math.random() * 15) + 5;  // 5-20
        }
    }

    checkWin(playerHP, enemyHP) {
        if (enemyHP <= 0) return 'win';
        if (playerHP <= 0) return 'lose';
        return 'ongoing';
    }
}

// Puzzle Game
class PuzzleGame {
    constructor() {
        this.name = 'Puzzle Quest';
        this.reward = 100;
        this.difficulty = 'Medium';
    }

    start(playerId) {
        const puzzle = this.generatePuzzle();
        return {
            gameType: 'puzzle',
            playerId: playerId,
            ...puzzle,
            reward: this.reward
        };
    }

    generatePuzzle() {
        const num1 = Math.floor(Math.random() * 100) + 1;
        const num2 = Math.floor(Math.random() * 100) + 1;
        const operation = ['+', '-', '*'][Math.floor(Math.random() * 3)];
        
        let answer;
        switch(operation) {
            case '+': answer = num1 + num2; break;
            case '-': answer = num1 - num2; break;
            case '*': answer = num1 * num2; break;
        }

        return {
            question: `What is ${num1} ${operation} ${num2}?`,
            answer: answer,
            difficulty: 'Medium'
        };
    }

    checkAnswer(userAnswer, correctAnswer) {
        return userAnswer === correctAnswer;
    }
}

// Leaderboard
class Leaderboard {
    constructor() {
        this.scores = [];
    }

    addScore(playerId, playerName, score, gameType) {
        this.scores.push({
            playerId: playerId,
            playerName: playerName,
            score: score,
            gameType: gameType,
            timestamp: new Date().toISOString()
        });
        
        this.scores.sort((a, b) => b.score - a.score);
    }

    getTopScores(limit = 10) {
        return this.scores.slice(0, limit);
    }

    getPlayerRank(playerId) {
        const rank = this.scores.findIndex(s => s.playerId === playerId) + 1;
        return rank > 0 ? rank : null;
    }

    getGameTopScores(gameType, limit = 10) {
        return this.scores
            .filter(s => s.gameType === gameType)
            .slice(0, limit);
    }
}

// Initialize Game Engine
const gameEngine = new GameEngine();
const leaderboard = new Leaderboard();

// Achievement System
class Achievements {
    constructor() {
        this.achievements = {
            'first_play': { name: 'First Play', description: 'Play your first game', reward: 10 },
            'ten_plays': { name: 'Gamer', description: 'Play 10 games', reward: 50 },
            'hundred_plays': { name: 'Hardcore Gamer', description: 'Play 100 games', reward: 500 },
            'first_win': { name: 'Winner', description: 'Win your first battle', reward: 25 },
            'streak_5': { name: 'On Fire', description: 'Win 5 battles in a row', reward: 100 },
            'lucky_roll': { name: 'Lucky', description: 'Roll a 6', reward: 20 },
            'perfect_puzzle': { name: 'Genius', description: 'Solve puzzle perfectly', reward: 75 }
        };
        this.playerAchievements = new Map();
    }

    unlockAchievement(playerId, achievementId) {
        if (!this.achievements[achievementId]) return null;

        const playerAchs = this.playerAchievements.get(playerId) || [];
        if (playerAchs.includes(achievementId)) return null; // Already unlocked

        playerAchs.push(achievementId);
        this.playerAchievements.set(playerId, playerAchs);

        return this.achievements[achievementId];
    }

    getPlayerAchievements(playerId) {
        const unlockedIds = this.playerAchievements.get(playerId) || [];
        return unlockedIds.map(id => ({
            id: id,
            ...this.achievements[id]
        }));
    }
}

const achievements = new Achievements();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameEngine, Leaderboard, Achievements };
}