// تنظیمات جامع سیستم
const AppConfig = {
    // تنظیمات API
    API: {
        BASE_URL: 'https://BrsApi.ir/Api/',
        ENDPOINTS: {
            STOCK_SYMBOLS: 'Tsetmc/AllSymbols.php',
            STOCK_INDEX: 'Tsetmc/Index.php',
            FARABOURSE_INDEX: 'Tsetmc/Index.php',
            CRYPTO: 'Market/Cryptocurrency.php',
            COMMODITY_METALS: 'Market/Commodity.php',
            COMMODITY_BASE_METALS: 'Market/Commodity.php',
            COMMODITY_ENERGY: 'Market/Commodity.php',
            GOLD: 'Market/Gold_Currency.php',
            CURRENCY: 'Market/Gold_Currency.php',
            CRYPTO2: 'Market/Gold_Currency.php'
        },
        PARAMS: {
            STOCK_INDEX: { type: 1 },
            FARABOURSE_INDEX: { type: 2 },
            COMMODITY_METALS: { type: 1 },
            COMMODITY_BASE_METALS: { type: 2 },
            COMMODITY_ENERGY: { type: 3 },
            GOLD: { type: 1 },
            CURRENCY: { type: 2 },
            CRYPTO2: { type: 3 }
        },
        TIMEOUT: 15000,
        RETRY_ATTEMPTS: 3,
        CACHE_DURATION: 300000 // 5 دقیقه
    },

    // تنظیمات امنیت
    SECURITY: {
        ENCRYPTION_KEY: 'secure_financial_system_2024',
        SESSION_TIMEOUT: 3600000, // 1 ساعت
        MAX_LOGIN_ATTEMPTS: 5,
        PASSWORD_STRENGTH: 'high'
    },

    // تنظیمات تریدینگ
    TRADING: {
        STRATEGIES: {
            MEAN_REVERSION: 'mean_reversion',
            TREND_FOLLOWING: 'trend_following',
            BREAKOUT: 'breakout',
            MOMENTUM: 'momentum',
            ARBITRAGE: 'arbitrage'
        },
        RISK_LIMITS: {
            MAX_POSITION_SIZE: 0.1, // 10% از سرمایه
            DAILY_LOSS_LIMIT: 0.05, // 5% ضرر روزانه
            MAX_DRAWDOWN: 0.15, // 15% حداکثر افت
            STOP_LOSS: 0.03, // 3% حد ضرر
            TAKE_PROFIT: 0.08 // 8% حد سود
        },
        COMMISSION: 0.0015 // 0.15% کارمزد
    },

    // تنظیمات رابط کاربری
    UI: {
        THEME: {
            DARK: 'dark',
            LIGHT: 'light',
            AUTO: 'auto'
        },
        LANGUAGE: 'fa',
        CHARTS: {
            DEFAULT_PERIOD: '1m',
            UPDATE_INTERVAL: 10000,
            ANIMATION_DURATION: 1000
        },
        NOTIFICATIONS: {
            ENABLED: true,
            DURATION: 5000,
            POSITION: 'top-right'
        }
    },

    // تنظیمات AI
    AI: {
        MODELS: {
            PREDICTION_CONFIDENCE_THRESHOLD: 0.7,
            SENTIMENT_ANALYSIS_ENABLED: true,
            RISK_ASSESSMENT_ENABLED: true,
            PATTERN_RECOGNITION_ENABLED: true
        },
        TRAINING: {
            BATCH_SIZE: 32,
            EPOCHS: 100,
            LEARNING_RATE: 0.001
        }
    },

    // تنظیمات گزارش‌گیری
    REPORTING: {
        AUTO_GENERATE: true,
        SCHEDULE: 'daily',
        FORMATS: ['pdf', 'excel', 'json'],
        RETENTION_DAYS: 365
    }
};

// فریز کردن کانفیگ برای جلوگیری از تغییرات
Object.freeze(AppConfig);