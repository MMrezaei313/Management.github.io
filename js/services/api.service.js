class AdvancedAPIService {
    buildURL(endpoint, params = {}) {
        const baseParams = {
            key: this.securityService.getApiKey()
        };
        
        // استخراج پارامترهای خاص endpoint از کانفیگ
        const endpointParams = this.getEndpointSpecificParams(endpoint);
        const allParams = { ...baseParams, ...endpointParams, ...params };
        
        const searchParams = new URLSearchParams(allParams);
        const endpointPath = endpoint.split('?')[0];
        
        return `${this.config.BASE_URL}${endpointPath}?${searchParams.toString()}`;
    }

    getEndpointSpecificParams(endpoint) {
        const endpointPath = endpoint.split('?')[0];
        const endpointConfig = this.config.ENDPOINT_PARAMS[endpointPath];
        
        if (!endpointConfig) return {};
        
        // پیدا کردن پارامترهای مربوط به این endpoint
        for (const paramSet of endpointConfig) {
            const endpointName = Object.keys(this.config.ENDPOINTS).find(
                key => this.config.ENDPOINTS[key] === endpoint
            );
            
            if (paramSet.name === endpointName) {
                return { type: paramSet.type };
            }
        }
        
        return {};
    }

    // متد بهبود یافته برای ساخت پارامترها
    buildParams(type, options) {
        const endpoint = this.config.ENDPOINTS[type];
        const specificParams = this.getEndpointSpecificParams(endpoint);
        const optionParams = options.params || {};
        
        return { ...specificParams, ...optionParams };
    }
}