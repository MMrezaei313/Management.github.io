const AppConfig = {
    API: {
        BASE_URL: 'https://BrsApi.ir/Api/',
        ENDPOINTS: {
            // بورس
            STOCK_SYMBOLS: 'Tsetmc/AllSymbols.php',
            STOCK_INDEX: 'Tsetmc/Index.php',
            FARABOURSE_INDEX: 'Tsetmc/Index.php',
            
            // ارز دیجیتال
            CRYPTO: 'Market/Cryptocurrency.php',
            CRYPTO2: 'Market/Gold_Currency.php',
            
            // کامودیتی‌ها
            COMMODITY_METALS: 'Market/Commodity.php',
            COMMODITY_BASE_METALS: 'Market/Commodity.php', 
            COMMODITY_ENERGY: 'Market/Commodity.php',
            
            // طلا و ارز
            GOLD: 'Market/Gold_Currency.php',
            CURRENCY: 'Market/Gold_Currency.php'
        },
        
        // پارامترهای هر endpoint
        ENDPOINT_PARAMS: {
            'Tsetmc/Index.php': [
                { type: 1, name: 'STOCK_INDEX' },
                { type: 2, name: 'FARABOURSE_INDEX' }
            ],
            'Market/Commodity.php': [
                { type: 1, name: 'COMMODITY_METALS' },
                { type: 2, name: 'COMMODITY_BASE_METALS' },
                { type: 3, name: 'COMMODITY_ENERGY' }
            ],
            'Market/Gold_Currency.php': [
                { type: 1, name: 'GOLD' },
                { type: 2, name: 'CURRENCY' },
                { type: 3, name: 'CRYPTO2' }
            ]
        }
    }
};