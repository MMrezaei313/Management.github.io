class DataManager {
    constructor() {
        this.apiService = new AdvancedAPIService();
        this.cache = new Map();
    }

    // متد یکپارچه برای دریافت تمام داده‌های بازار
    async loadAllMarketData() {
        const dataTypes = [
            'STOCK_SYMBOLS',
            'STOCK_INDEX', 
            'FARABOURSE_INDEX',
            'CRYPTO',
            'GOLD',
            'CURRENCY',
            'COMMODITY_METALS'
        ];

        const requests = dataTypes.map(type => 
            this.apiService.fetchMarketData(type)
        );

        try {
            const results = await Promise.allSettled(requests);
            return this.processMarketDataResults(results, dataTypes);
        } catch (error) {
            console.error('خطا در دریافت داده‌های بازار:', error);
            return this.getFallbackMarketData();
        }
    }

    processMarketDataResults(results, dataTypes) {
        const marketData = {};
        
        results.forEach((result, index) => {
            const type = dataTypes[index];
            if (result.status === 'fulfilled' && result.value) {
                marketData[this.getDataKey(type)] = result.value;
            } else {
                console.warn(`داده‌های ${type} در دسترس نیست`);
                marketData[this.getDataKey(type)] = this.apiService.getFallbackData(type);
            }
        });

        return marketData;
    }

    getDataKey(type) {
        const keyMap = {
            'STOCK_SYMBOLS': 'stocks',
            'STOCK_INDEX': 'indices',
            'FARABOURSE_INDEX': 'farabourseIndices', 
            'CRYPTO': 'crypto',
            'GOLD': 'gold',
            'CURRENCY': 'currency',
            'COMMODITY_METALS': 'commodities'
        };
        
        return keyMap[type] || type.toLowerCase();
    }
}
