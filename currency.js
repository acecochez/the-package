export const currencyConfig = {
    baseCurrency: 'GBP',
    exchangeRates: {
        'GBP': 1
    },
    currencySettings: {
        'GBP': { locale: 'en-GB', currency: 'GBP' },
        'EUR': { locale: 'de-DE', currency: 'EUR' },
        'USD': { locale: 'en-US', currency: 'USD' }
    }
};

export const fetchRates = async (onSuccess, onError) => {
    try {
        const response = await fetch(`https://api.frankfurter.app/latest?from=${currencyConfig.baseCurrency}&to=EUR,USD`);
        if (!response.ok) {
            const error = new Error('Network response was not ok');
            console.error('Failed to fetch exchange rates:', error);
            if (onError) onError(error);
            return;
        }
        const data = await response.json();
        if (data && data['rates']) {
            currencyConfig.exchangeRates = {
                ...currencyConfig.exchangeRates,
                ...data['rates']
            };
            if (onSuccess) onSuccess();
        }
    } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        if (onError) onError(error);
    }
};

export const getPrice = (item, billing, currency, basePrices) => {
    const basePrice = basePrices[billing][item];
    const rate = currencyConfig.exchangeRates[currency];
    
    if (rate === undefined) return null;
    return basePrice * rate;
};

export const formatPrice = (value, billing, currency, suffix = true) => {
    if (value === null) return 'Loading...';
    const settings = currencyConfig.currencySettings[currency];
    const formatter = new Intl.NumberFormat(settings.locale, {
        style: 'currency',
        currency: settings.currency,
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
    });
    const formatted = formatter.format(value);
    
    const b = billing === 'monthly' ? 'mo' : 'yr';
    return suffix ? `${formatted}/${b}` : formatted;
};
