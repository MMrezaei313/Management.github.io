// موتور پیشرفته تریدینگ الگوریتمی
class AdvancedTradingEngine {
    constructor() {
        this.strategies = new Map();
        this.positions = new Map();
        this.performance = new Map();
        this.isRunning = false;
        
        this.initStrategies();
    }

    initStrategies() {
        // استراتژی بازگشت به میانگین
        this.strategies.set('mean_reversion', {
            name: 'بازگشت به میانگین',
            description: 'معامله بر اساس انحراف از میانگین متحرک',
            parameters: {
                period: 20,
                deviation: 2,
                position_size: 0.05
            },
            execute: this.executeMeanReversion.bind(this)
        });

        // استراتژی پیروی از روند
        this.strategies.set('trend_following', {
            name: 'پیروی از روند',
            description: 'معامله در جهت روند اصلی بازار',
            parameters: {
                fast_ma: 10,
                slow_ma: 30,
                trend_strength: 0.7
            },
            execute: this.executeTrendFollowing.bind(this)
        });

        // استراتژی شکست مقاومت
        this.strategies.set('breakout', {
            name: 'شکست مقاومت',
            description: 'معامله در نقطه شکست سطوح کلیدی',
            parameters: {
                resistance_level: 0.02,
                volume_spike: 1.5,
                confirmation_bars: 3
            },
            execute: this.executeBreakout.bind(this)
        });

        // استراتژی مومنتوم
        this.strategies.set('momentum', {
            name: 'مومنتوم',
            description: 'معامله بر اساس شتاب حرکتی قیمت',
            parameters: {
                momentum_period: 14,
                overbought: 70,
                oversold: 30
            },
            execute: this.executeMomentum.bind(this)
        });
    }

    async analyzeMarket(marketData) {
        const signals = [];
        
        for (const [strategyId, strategy] of this.strategies) {
            try {
                const signal = await strategy.execute(marketData, strategy.parameters);
                if (signal && signal.confidence >= AppConfig.AI.MODELS.PREDICTION_CONFIDENCE_THRESHOLD) {
                    signals.push({
                        ...signal,
                        strategy: strategyId,
                        strategyName: strategy.name,
                        timestamp: new Date()
                    });
                }
            } catch (error) {
                console.error(`خطا در اجرای استراتژی ${strategyId}:`, error);
            }
        }

        return this.rankSignals(signals);
    }

    executeMeanReversion(marketData, params) {
        const analysis = this.calculateTechnicalIndicators(marketData);
        
        // محاسبه انحراف از میانگین
        const deviation = (marketData.currentPrice - analysis.movingAverages.sma20) / analysis.movingAverages.sma20;
        const zScore = Math.abs(deviation) / analysis.volatility;

        if (zScore > params.deviation) {
            const action = deviation > 0 ? 'SELL' : 'BUY';
            const confidence = Math.min(zScore / 3, 0.95); // نرمال‌سازی اطمینان

            return {
                action: action,
                symbol: marketData.symbol,
                price: marketData.currentPrice,
                target: analysis.movingAverages.sma20,
                stoploss: this.calculateStoploss(marketData, action, params),
                confidence: confidence,
                reasoning: `انحراف قیمت از میانگین: ${(deviation * 100).toFixed(2)}%`
            };
        }

        return null;
    }

    executeTrendFollowing(marketData, params) {
        const analysis = this.calculateTechnicalIndicators(marketData);
        
        // تشخیص روند
        const trend = analysis.movingAverages.sma10 > analysis.movingAverages.sma30 ? 'UP' : 'DOWN';
        const trendStrength = Math.abs(analysis.movingAverages.sma10 - analysis.movingAverages.sma30) / analysis.movingAverages.sma30;

        if (trendStrength > params.trend_strength) {
            return {
                action: trend === 'UP' ? 'BUY' : 'SELL',
                symbol: marketData.symbol,
                price: marketData.currentPrice,
                target: this.calculateTrendTarget(marketData, trend, analysis),
                stoploss: this.calculateStoploss(marketData, trend === 'UP' ? 'BUY' : 'SELL', params),
                confidence: trendStrength,
                reasoning: `روند ${trend === 'UP' ? 'صعودی' : 'نزولی'} با قدرت ${(trendStrength * 100).toFixed(2)}%`
            };
        }

        return null;
    }

    calculateTechnicalIndicators(marketData) {
        // محاسبه اندیکاتورهای تکنیکال
        return {
            movingAverages: {
                sma10: this.calculateSMA(marketData.historicalPrices, 10),
                sma20: this.calculateSMA(marketData.historicalPrices, 20),
                sma30: this.calculateSMA(marketData.historicalPrices, 30)
            },
            rsi: this.calculateRSI(marketData.historicalPrices),
            macd: this.calculateMACD(marketData.historicalPrices),
            volatility: this.calculateVolatility(marketData.historicalPrices),
            support: this.calculateSupportLevel(marketData.historicalPrices),
            resistance: this.calculateResistanceLevel(marketData.historicalPrices)
        };
    }

    calculateSMA(prices, period) {
        if (prices.length < period) return prices[prices.length - 1];
        const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
        return sum / period;
    }

    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return 50;
        
        let gains = 0;
        let losses = 0;
        
        for (let i = 1; i <= period; i++) {
            const change = prices[prices.length - i] - prices[prices.length - i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / avgLoss;
        
        return 100 - (100 / (1 + rs));
    }

    rankSignals(signals) {
        return signals
            .map(signal => ({
                ...signal,
                score: this.calculateSignalScore(signal)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5); // فقط 5 سیگنال برتر
    }

    calculateSignalScore(signal) {
        const weights = {
            confidence: 0.4,
            riskReward: 0.3,
            volume: 0.2,
            trend: 0.1
        };

        const riskReward = this.calculateRiskRewardRatio(signal);
        const volumeScore = this.calculateVolumeScore(signal);
        const trendScore = this.calculateTrendScore(signal);

        return (
            signal.confidence * weights.confidence +
            riskReward * weights.riskReward +
            volumeScore * weights.volume +
            trendScore * weights.trend
        );
    }

    calculateRiskRewardRatio(signal) {
        const risk = Math.abs(signal.price - signal.stoploss);
        const reward = Math.abs(signal.target - signal.price);
        return reward / risk;
    }

    startTrading() {
        this.isRunning = true;
        this.tradingInterval = setInterval(() => {
            this.executeTradingCycle();
        }, 60000); // هر 1 دقیقه
    }

    stopTrading() {
        this.isRunning = false;
        if (this.tradingInterval) {
            clearInterval(this.tradingInterval);
        }
    }

    async executeTradingCycle() {
        if (!this.isRunning) return;

        try {
            const marketData = await DataManager.getCurrentMarketData();
            const signals = await this.analyzeMarket(marketData);
            
            for (const signal of signals) {
                await this.executeTrade(signal);
            }
            
            await this.updatePerformance();
            
        } catch (error) {
            console.error('خطا در چرخه معاملاتی:', error);
            ErrorManager.logError('TRADING_CYCLE_ERROR', error);
        }
    }

    async executeTrade(signal) {
        // بررسی محدودیت‌های ریسک
        if (!this.checkRiskLimits(signal)) {
            console.log(`معامله ${signal.symbol} به دلیل محدودیت ریسک لغو شد`);
            return;
        }

        // اجرای معامله
        const trade = {
            id: this.generateTradeId(),
            symbol: signal.symbol,
            action: signal.action,
            price: signal.price,
            quantity: this.calculatePositionSize(signal),
            timestamp: new Date(),
            strategy: signal.strategy,
            stoploss: signal.stoploss,
            target: signal.target
        };

        this.positions.set(trade.id, trade);
        
        // ثبت در تاریخچه
        await this.recordTrade(trade);
        
        // ارسال نوتیفیکیشن
        UIManager.showNotification(
            `معامله ${signal.action === 'BUY' ? 'خرید' : 'فروش'} ${signal.symbol} اجرا شد`,
            'success'
        );
    }

    checkRiskLimits(signal) {
        const currentPositions = Array.from(this.positions.values());
        const totalExposure = currentPositions.reduce((sum, pos) => sum + pos.quantity * pos.price, 0);
        
        // بررسی حداقل فاصله از معاملات قبلی
        const recentTrades = currentPositions.filter(pos => 
            pos.symbol === signal.symbol && 
            Date.now() - pos.timestamp.getTime() < 3600000 // 1 ساعت
        );

        if (recentTrades.length > 0) {
            console.log(`معامله تکراری برای ${signal.symbol} - لغو شد`);
            return false;
        }

        // بررسی محدودیت سایز پوزیشن
        const positionSize = this.calculatePositionSize(signal);
        if (positionSize > AppConfig.TRADING.RISK_LIMITS.MAX_POSITION_SIZE) {
            console.log(`سایز پوزیشن برای ${signal.symbol} بیش از حد مجاز`);
            return false;
        }

        return true;
    }

    calculatePositionSize(signal) {
        const baseSize = AppConfig.TRADING.RISK_LIMITS.MAX_POSITION_SIZE;
        const confidenceMultiplier = signal.confidence;
        const riskRewardMultiplier = this.calculateRiskRewardRatio(signal);
        
        return baseSize * confidenceMultiplier * riskRewardMultiplier;
    }

    generateTradeId() {
        return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async recordTrade(trade) {
        // ذخیره معامله در localStorage یا ارسال به سرور
        const tradeHistory = JSON.parse(localStorage.getItem('tradeHistory') || '[]');
        tradeHistory.push(trade);
        localStorage.setItem('tradeHistory', JSON.stringify(tradeHistory));
    }

    async updatePerformance() {
        const performance = {
            timestamp: new Date(),
            totalTrades: this.positions.size,
            activePositions: Array.from(this.positions.values()).filter(pos => 
                !pos.exitPrice
            ).length,
            totalProfit: this.calculateTotalProfit(),
            winRate: this.calculateWinRate(),
            sharpeRatio: this.calculateSharpeRatio()
        };

        this.performance.set(performance.timestamp.getTime(), performance);
        
        // آپدیت UI
        UIManager.updatePerformanceMetrics(performance);
    }
}
