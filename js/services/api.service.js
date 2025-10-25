// سرویس پیشرفته مدیریت API
class AdvancedAPIService {
    constructor() {
        this.config = AppConfig.API;
        this.cacheService = new CacheService();
        this.securityService = new SecurityService();
        this.retryCount = 0;
        this.isOnline = true;
        
        this.init();
    }

    init() {
        this.setupOnlineMonitoring();
        this.setupRequestInterceptors();
    }

    setupOnlineMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('اتصال اینترنت برقرار شد');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.warn('اتصال اینترنت قطع شد');
        });
    }

    setupRequestInterceptors() {
        // Interceptor برای تمام درخواست‌ها
        axios.interceptors.request.use(
            config => {
                config.headers['X-Request-ID'] = this.generateRequestId();
                config.headers['X-Request-Timestamp'] = Date.now();
                return config;
            },
            error => Promise.reject(error)
        );

        axios.interceptors.response.use(
            response => response,
            error => this.handleResponseError(error)
        );
    }

    async fetchMarketData(type, options = {}) {
        const cacheKey = `market_${type}_${JSON.stringify(options)}`;
        
        // بررسی کش
        if (options.useCache !== false) {
            const cached = this.cacheService.get(cacheKey);
            if (cached) return cached;
        }

        try {
            const endpoint = this.config.ENDPOINTS[type];
            const params = this.buildParams(type, options);
            
            const response = await this.makeRequest(endpoint, params, options);
            const processedData = this.processResponse(response.data, type);
            
            // ذخیره در کش
            this.cacheService.set(cacheKey, processedData, this.config.CACHE_DURATION);
            
            return processedData;
            
        } catch (error) {
            console.error(`خطا در دریافت داده‌های ${type}:`, error);
            
            // استفاده از داده‌های fallback
            if (options.useFallback !== false) {
                return this.getFallbackData(type);
            }
            
            throw error;
        }
    }

    async makeRequest(endpoint, params = {}, options = {}) {
        const url = this.buildURL(endpoint, params);
        const requestConfig = {
            timeout: options.timeout || this.config.TIMEOUT,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Application': 'FinancialAnalysisSystem'
            }
        };

        return await axios.get(url, requestConfig);
    }

    buildURL(endpoint, params = {}) {
        const baseParams = {
            key: this.securityService.getApiKey(),
            ...params
        };
        
        const searchParams = new URLSearchParams(baseParams);
        return `${this.config.BASE_URL}${endpoint}?${searchParams.toString()}`;
    }

    buildParams(type, options) {
        const baseParams = this.config.PARAMS[type] || {};
        return { ...baseParams, ...options.params };
    }

    processResponse(data, type) {
        const processors = {
            'STOCK_SYMBOLS': this.processStockData.bind(this),
            'STOCK_INDEX': this.processIndexData.bind(this),
            'CRYPTO': this.processCryptoData.bind(this),
            'GOLD': this.processGoldData.bind(this),
            'CURRENCY': this.processCurrencyData.bind(this),
            'COMMODITY_METALS': this.processCommodityData.bind(this)
        };

        const processor = processors[type] || this.processGenericData.bind(this);
        return processor(data);
    }

    processStockData(data) {
        if (!Array.isArray(data)) return this.getFallbackData('STOCK_SYMBOLS');
        
        return data.map(item => ({
            symbol: item.l18 || 'N/A',
            name: item.l30 || 'N/A',
            price: item.pl || item.pc || 0,
            change: item.plc || item.pcc || 0,
            changePercent: item.plp || item.pcp || 0,
            volume: item.tvol || 0,
            value: item.tval || 0,
            high: item.pmax || 0,
            low: item.pmin || 0,
            eps: item.eps || 0,
            pe: item.pe || 0,
            marketCap: item.mv || 0,
            tradeCount: item.tno || 0,
            // اطلاعات خریداران و فروشندگان
            buyers: {
                individual: item.Buy_CountI || 0,
                institutional: item.Buy_CountN || 0
            },
            sellers: {
                individual: item.Sell_CountI || 0,
                institutional: item.Sell_CountN || 0
            }
        }));
    }

    processIndexData(data) {
        if (!Array.isArray(data)) return this.getFallbackData('STOCK_INDEX');
        
        return data.map(item => ({
            name: item.name || 'N/A',
            value: item.index || 0,
            change: item.index_change || 0,
            changePercent: item.index_change_percent || 0,
            high: item.max || 0,
            low: item.min || 0,
            marketValue: item.mv || 0,
            tradeVolume: item.tvol || 0,
            tradeValue: item.tval || 0
        }));
    }

    processCryptoData(data) {
        if (!Array.isArray(data)) return this.getFallbackData('CRYPTO');
        
        return data.map(item => ({
            name: item.name || 'N/A',
            price: item.price || 0,
            priceToman: item.price_toman || 0,
            changePercent: item.change_percent || 0,
            marketCap: item.market_cap || 0,
            icon: item.link_icon || '',
            timestamp: item.time_unix || Date.now()
        }));
    }

    getFallbackData(type) {
        const fallbackGenerators = {
            'STOCK_SYMBOLS': this.generateMockStocks.bind(this),
            'STOCK_INDEX': this.generateMockIndices.bind(this),
            'CRYPTO': this.generateMockCrypto.bind(this),
            'GOLD': this.generateMockGold.bind(this),
            'CURRENCY': this.generateMockCurrency.bind(this),
            'COMMODITY_METALS': this.generateMockCommodities.bind(this)
        };

        return fallbackGenerators[type] ? fallbackGenerators[type]() : [];
    }

    // متدهای generateMock... (مشابه قبل اما بهبود یافته)

    handleResponseError(error) {
        this.retryCount++;
        
        const errorInfo = {
            message: error.message,
            code: error.code,
            url: error.config?.url,
            timestamp: new Date().toISOString(),
            retryCount: this.retryCount
        };

        // لاگ خطا
        ErrorManager.logError('API_ERROR', errorInfo);

        if (this.retryCount <= this.config.RETRY_ATTEMPTS) {
            const delay = Math.pow(2, this.retryCount) * 1000;
            return new Promise(resolve => 
                setTimeout(() => resolve(this.retryRequest(error.config)), delay)
            );
        }

        this.retryCount = 0;
        return Promise.reject(error);
    }

    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
