// NFT Smart Contract Logic

class NFTContract {
    constructor() {
        this.nfts = [];
        this.nftCounter = 1;
        this.royalties = {};
    }

    // Mint NFT
    mintNFT(creator, name, description, image, price, royaltyPercentage = 10) {
        const nft = {
            id: this.nftCounter++,
            creator: creator,
            owner: creator,
            name: name,
            description: description,
            image: image,
            price: price,
            royaltyPercentage: royaltyPercentage,
            metadata: {
                createdAt: new Date().toISOString(),
                lastSoldAt: null,
                totalSales: 0
            },
            tokenURI: `ipfs://QmNFT${this.nftCounter}`,
            properties: {
                rarity: this.calculateRarity(),
                attributes: this.generateAttributes()
            }
        };

        this.nfts.push(nft);
        this.royalties[nft.id] = royaltyPercentage;
        
        console.log(`NFT Minted: ${name} (ID: ${nft.id})`);
        return nft;
    }

    // Transfer NFT
    transferNFT(nftId, from, to) {
        const nft = this.nfts.find(n => n.id === nftId);
        
        if (!nft) {
            throw new Error('NFT not found');
        }
        
        if (nft.owner !== from) {
            throw new Error('You do not own this NFT');
        }

        const oldOwner = nft.owner;
        nft.owner = to;
        nft.metadata.lastSoldAt = new Date().toISOString();
        nft.metadata.totalSales++;

        console.log(`NFT Transferred: ${nft.name} from ${oldOwner} to ${to}`);
        return nft;
    }

    // Burn NFT
    burnNFT(nftId, owner) {
        const index = this.nfts.findIndex(n => n.id === nftId && n.owner === owner);
        
        if (index === -1) {
            throw new Error('NFT not found or you do not own it');
        }

        const burned = this.nfts.splice(index, 1)[0];
        delete this.royalties[nftId];
        
        console.log(`NFT Burned: ${burned.name}`);
        return burned;
    }

    // Get NFT Details
    getNFT(nftId) {
        return this.nfts.find(n => n.id === nftId);
    }

    // Get all NFTs
    getAllNFTs() {
        return this.nfts;
    }

    // Get NFTs by owner
    getNFTsByOwner(owner) {
        return this.nfts.filter(n => n.owner === owner);
    }

    // Get NFTs by creator (for royalties)
    getNFTsByCreator(creator) {
        return this.nfts.filter(n => n.creator === creator);
    }

    // Calculate Royalties
    calculateRoyalties(nftId, salePrice) {
        const nft = this.getNFT(nftId);
        if (!nft) return 0;

        const royaltyAmount = (salePrice * nft.royaltyPercentage) / 100;
        return {
            creator: nft.creator,
            amount: royaltyAmount,
            percentage: nft.royaltyPercentage
        };
    }

    // NFT Rarity
    calculateRarity() {
        const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
        const weights = [0.5, 0.25, 0.15, 0.07, 0.03];
        
        const random = Math.random();
        let sum = 0;
        
        for (let i = 0; i < weights.length; i++) {
            sum += weights[i];
            if (random <= sum) return rarities[i];
        }
        
        return rarities[0];
    }

    // Generate NFT Attributes
    generateAttributes() {
        return {
            color: ['Red', 'Blue', 'Green', 'Purple', 'Gold'][Math.floor(Math.random() * 5)],
            shape: ['Circle', 'Square', 'Triangle', 'Star', 'Diamond'][Math.floor(Math.random() * 5)],
            pattern: ['Solid', 'Striped', 'Checkered', 'Gradient'][Math.floor(Math.random() * 4)],
            energy: Math.floor(Math.random() * 100) + 1,
            power: Math.floor(Math.random() * 100) + 1
        };
    }

    // Get Collection Stats
    getCollectionStats(creator) {
        const nfts = this.getNFTsByCreator(creator);
        const totalVolume = nfts.reduce((sum, nft) => sum + nft.price, 0);
        
        return {
            totalNFTs: nfts.length,
            totalVolume: totalVolume,
            floorPrice: nfts.length > 0 ? Math.min(...nfts.map(n => n.price)) : 0,
            averagePrice: nfts.length > 0 ? totalVolume / nfts.length : 0,
            rarityDistribution: this.getRarityDistribution(nfts)
        };
    }

    // Rarity Distribution
    getRarityDistribution(nfts) {
        const distribution = {};
        nfts.forEach(nft => {
            distribution[nft.properties.rarity] = (distribution[nft.properties.rarity] || 0) + 1;
        });
        return distribution;
    }
}

// Initialize NFT Contract
const nftContract = new NFTContract();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NFTContract;
}