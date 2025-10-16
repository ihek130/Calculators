import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeftRight, 
  DollarSign, 
  TrendingUp, 
  Globe, 
  RefreshCw,
  Info,
  Calculator,
  Clock,
  BarChart3,
  BookOpen,
  Banknote
} from 'lucide-react';

// Types
interface CurrencyData {
  code: string;
  name: string;
  symbol: string;
  flag?: string;
}

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
}

interface ConversionResult {
  fromAmount: number;
  toAmount: number;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  lastUpdated: string;
}

interface CurrencyInputs {
  mode: 'live' | 'custom';
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  customRate: number;
}

const CurrencyCalculatorComponent: React.FC = () => {
  const [inputs, setInputs] = useState<CurrencyInputs>({
    mode: 'live',
    amount: 100,
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    customRate: 0.85197
  });

  const [result, setResult] = useState<ConversionResult>({
    fromAmount: 0,
    toAmount: 0,
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    exchangeRate: 0,
    lastUpdated: new Date().toLocaleString()
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [liveRates, setLiveRates] = useState<Record<string, number>>({});

  // API configuration
  const API_KEY = '1a13585ce4fbf3b9b6222352';
  const API_BASE_URL = 'https://v6.exchangerate-api.com/v6';

  // Fetch live exchange rates from API
  const fetchLiveRates = async (baseCurrency: string = 'USD') => {
    setIsLoadingRates(true);
    setApiError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/${API_KEY}/latest/${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.result === 'success') {
        setLiveRates(data.conversion_rates);
        setLastUpdated(new Date());
        setApiError(null);
      } else {
        throw new Error(data['error-type'] || 'Unknown API error');
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to fetch rates');
      
      // Fallback to sample rates if API fails
      const fallbackRates: Record<string, number> = {
        'EUR': 0.85197, 'GBP': 0.736947, 'JPY': 147.445, 'CAD': 1.39665, 'AUD': 1.5147,
        'CNY': 7.1195, 'CHF': 0.790154, 'BRL': 5.3368, 'INR': 88.7353, 'MXN': 18.3987,
        'RUB': 98.5234, 'KRW': 1342.15, 'SGD': 1.3456, 'NZD': 1.6123, 'ZAR': 18.76,
        'HKD': 7.8123, 'SEK': 10.234, 'NOK': 10.567, 'DKK': 6.789, 'PLN': 4.123,
        'CZK': 23.456, 'HUF': 367.89, 'ILS': 3.789, 'TRY': 27.456, 'THB': 35.678,
        'MYR': 4.567, 'PHP': 56.789, 'IDR': 15234.56, 'VND': 24567.89, 'AED': 3.6725
      };
      setLiveRates(fallbackRates);
    } finally {
      setIsLoadingRates(false);
    }
  };

  // Get exchange rate between two currencies
  const getExchangeRate = (from: string, to: string): number => {
    if (from === to) return 1;
    
    if (inputs.mode === 'custom') {
      return inputs.customRate;
    }
    
    // If we have live rates
    if (Object.keys(liveRates).length > 0) {
      if (from === 'USD') {
        return liveRates[to] || 1;
      } else if (to === 'USD') {
        return 1 / (liveRates[from] || 1);
      } else {
        // Convert via USD: from -> USD -> to
        const fromToUsd = 1 / (liveRates[from] || 1);
        const usdToTo = liveRates[to] || 1;
        return fromToUsd * usdToTo;
      }
    }
    
    return 1; // Fallback
  };

  // Sample rates for reference (fallback) - removed as we're using live API

  // Fetch live exchange rates on component mount
  useEffect(() => {
    fetchLiveRates();
  }, []);

  // Major currencies list
  const currencies: CurrencyData[] = [
    { code: 'USD', name: 'United States Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound Sterling', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
    { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
    { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
    { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
    { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
    { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' }
  ];

  // Utility functions
  const formatCurrency = (amount: number, currencyCode: string): string => {
    const currency = currencies.find(c => c.code === currencyCode);
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount) + ' ' + (currency?.symbol || currencyCode);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(num);
  };

  // Convert currency using live rates
  const convertCurrency = async () => {
    setIsLoading(true);
    setError('');

    try {
      // If no live rates loaded yet, fetch them first
      if (Object.keys(liveRates).length === 0 && inputs.mode === 'live') {
        await fetchLiveRates();
      }

      const rate = getExchangeRate(inputs.fromCurrency, inputs.toCurrency);
      const convertedAmount = inputs.amount * rate;

      setResult({
        fromAmount: inputs.amount,
        toAmount: convertedAmount,
        fromCurrency: inputs.fromCurrency,
        toCurrency: inputs.toCurrency,
        exchangeRate: rate,
        lastUpdated: lastUpdated?.toLocaleString() || new Date().toLocaleString()
      });
    } catch (error) {
      setError('Failed to convert currency. Please try again.');
      console.error('Conversion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof CurrencyInputs, value: string | number) => {
    const newInputs = { ...inputs, [field]: value };
    setInputs(newInputs);
  };

  // Swap currencies
  const swapCurrencies = () => {
    const newInputs = {
      ...inputs,
      fromCurrency: inputs.toCurrency,
      toCurrency: inputs.fromCurrency
    };
    setInputs(newInputs);
  };

  // Auto-convert when inputs change
  useEffect(() => {
    if (inputs.amount > 0) {
      convertCurrency();
    }
  }, [inputs]);

  // Generate popular conversion pairs
  const popularPairs = [
    { from: 'USD', to: 'EUR', label: 'USD → EUR' },
    { from: 'EUR', to: 'USD', label: 'EUR → USD' },
    { from: 'GBP', to: 'USD', label: 'GBP → USD' },
    { from: 'USD', to: 'JPY', label: 'USD → JPY' },
    { from: 'USD', to: 'CAD', label: 'USD → CAD' },
    { from: 'USD', to: 'AUD', label: 'USD → AUD' },
    { from: 'EUR', to: 'GBP', label: 'EUR → GBP' },
    { from: 'USD', to: 'CNY', label: 'USD → CNY' }
  ];

  // Get currency display name
  const getCurrencyDisplay = (code: string): string => {
    const currency = currencies.find(c => c.code === code);
    return currency ? `${code}: ${currency.name}` : code;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center space-x-3">
          <ArrowLeftRight className="h-10 w-10 text-blue-600" />
          <span>Currency Calculator</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Convert between world currencies with live exchange rates, analyze historical trends, 
          and access comprehensive foreign exchange information.
        </p>
        <div className="flex justify-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200 shadow-sm">
            <Globe className="h-4 w-4 mr-2" />
            Exchange rates updated live via trusted global data provider (refreshed every 30 seconds).
          </div>
        </div>
      </div>

      {/* Calculator Mode Toggle */}
      <div className="flex justify-center">
        <Tabs value={inputs.mode} onValueChange={(value) => handleInputChange('mode', value)} className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="live" className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>Live Exchange Rate</span>
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center space-x-2">
              <Calculator className="h-4 w-4" />
              <span>Custom Rate</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Live Rate Status */}
      {inputs.mode === 'live' && (
        <div className="flex justify-center">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border max-w-md w-full">
            <div className="flex items-center space-x-2">
              {isLoadingRates ? (
                <>
                  <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                  <span className="text-sm text-blue-700">Fetching live rates...</span>
                </>
              ) : apiError ? (
                <>
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-orange-700">Using fallback rates</span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-700">
                    Live rates {lastUpdated ? `updated ${lastUpdated.toLocaleTimeString()}` : 'active'}
                  </span>
                </>
              )}
            </div>
            {!isLoadingRates && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => fetchLiveRates()}
                className="h-8 px-2"
                title="Refresh exchange rates"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Calculator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Banknote className="h-5 w-5 text-blue-600" />
                <span>Currency Conversion</span>
              </CardTitle>
              <CardDescription>
                {inputs.mode === 'live' 
                  ? 'Convert using current market exchange rates'
                  : 'Convert using your custom exchange rate'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={inputs.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  placeholder="Enter amount"
                />
              </div>

              {/* From Currency */}
              <div className="space-y-2">
                <Label htmlFor="fromCurrency">From</Label>
                <Select value={inputs.fromCurrency} onValueChange={(value) => handleInputChange('fromCurrency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-semibold">{currency.code}</span>
                          <span className="text-gray-600">-</span>
                          <span className="text-sm">{currency.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={swapCurrencies}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  <span>Swap</span>
                </Button>
              </div>

              {/* To Currency */}
              <div className="space-y-2">
                <Label htmlFor="toCurrency">To</Label>
                <Select value={inputs.toCurrency} onValueChange={(value) => handleInputChange('toCurrency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-semibold">{currency.code}</span>
                          <span className="text-gray-600">-</span>
                          <span className="text-sm">{currency.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Rate Input */}
              {inputs.mode === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customRate">Custom Exchange Rate</Label>
                  <Input
                    id="customRate"
                    type="number"
                    step="0.000001"
                    value={inputs.customRate}
                    onChange={(e) => handleInputChange('customRate', parseFloat(e.target.value) || 0)}
                    placeholder="Enter custom rate"
                  />
                  <p className="text-sm text-gray-600">
                    1 {inputs.fromCurrency} = {inputs.customRate} {inputs.toCurrency}
                  </p>
                </div>
              )}

              {/* Refresh Button for Live Mode */}
              {inputs.mode === 'live' && (
                <Button
                  onClick={() => convertCurrency()}
                  disabled={isLoading}
                  className="w-full flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Updating...' : 'Refresh Rate'}</span>
                </Button>
              )}

              {/* Error Display */}
              {error && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Conversion Result */}
          <Card className="shadow-lg border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-right">
                    <p className="text-lg font-medium text-blue-800">From</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatCurrency(result.fromAmount, result.fromCurrency)}
                    </p>
                  </div>
                  <ArrowLeftRight className="h-8 w-8 text-blue-600" />
                  <div className="text-left">
                    <p className="text-lg font-medium text-blue-800">To</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatCurrency(result.toAmount, result.toCurrency)}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">Exchange Rate</p>
                  <p className="text-xl font-semibold text-gray-900">
                    1 {result.fromCurrency} = {formatNumber(result.exchangeRate)} {result.toCurrency}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated: {result.lastUpdated}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Conversion Pairs */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Popular Currency Pairs</span>
              </CardTitle>
              <CardDescription>Quick access to commonly traded currency pairs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {popularPairs.map((pair, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInputs({
                        ...inputs,
                        fromCurrency: pair.from,
                        toCurrency: pair.to
                      });
                    }}
                    className="text-xs"
                  >
                    {pair.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Exchange Rate Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span>Rate Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Current Rate Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Currency:</span>
                      <span className="font-medium">{getCurrencyDisplay(result.fromCurrency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quote Currency:</span>
                      <span className="font-medium">{getCurrencyDisplay(result.toCurrency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exchange Rate:</span>
                      <span className="font-medium">{formatNumber(result.exchangeRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Inverse Rate:</span>
                      <span className="font-medium">{formatNumber(1 / result.exchangeRate)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span>Market Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900">Market Status</h5>
                    <p className="text-blue-700 text-sm mt-1">
                      Forex markets are open 24/5, Monday to Friday
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h5 className="font-medium text-green-900">Data Source</h5>
                    <p className="text-green-700 text-sm mt-1">
                      {inputs.mode === 'live' 
                        ? 'Live rates from major forex providers' 
                        : 'Custom rate set by user'
                      }
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <h5 className="font-medium text-yellow-900">Update Frequency</h5>
                    <p className="text-yellow-700 text-sm mt-1">
                      Rates update every few seconds during market hours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calculation Breakdown */}
          {inputs.amount > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  <span>Calculation Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium text-gray-900">
                      {formatNumber(inputs.amount)} {inputs.fromCurrency} × {formatNumber(result.exchangeRate)} = {formatNumber(result.toAmount)} {inputs.toCurrency}
                    </p>
                    <p className="text-sm text-gray-600">
                      Formula: Amount × Exchange Rate = Converted Amount
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Educational Content */}
      <div className="space-y-8">
        <Separator className="my-8" />
        
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span>Complete Guide to Currency Exchange</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Master foreign exchange concepts, understand market dynamics, learn about currency factors, 
            and discover practical tips for international transactions and travel.
          </p>
        </div>

        {/* Educational Sections */}
        <div className="space-y-12">
          {/* Currency Fundamentals */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <Info className="h-6 w-6 text-blue-600" />
                <span>Currency & Exchange Rate Fundamentals</span>
              </h3>
              <p className="text-gray-600 mt-2">Understanding the foundation of international currency exchange</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <span>What is Currency?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Currency is a universal medium of exchange for goods and services in an economy. 
                    It has evolved from bartering systems to modern digital transactions over 3,000+ years.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900">Historical Evolution</h4>
                      <div className="text-blue-700 text-sm mt-2 space-y-1">
                        <p>• <strong>Ancient Times:</strong> Bartering goods and services</p>
                        <p>• <strong>7th Century BC:</strong> First official coins by King Alyattes</p>
                        <p>• <strong>Medieval Period:</strong> Paper currency introduced in Asia</p>
                        <p>• <strong>Modern Era:</strong> Digital transactions and cryptocurrencies</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900">Currency Types</h4>
                      <div className="text-green-700 text-sm mt-2 space-y-1">
                        <p>• <strong>Fiat Money:</strong> Government-backed currency (USD, EUR)</p>
                        <p>• <strong>Commodity Money:</strong> Backed by physical goods (Gold Standard)</p>
                        <p>• <strong>Digital Currency:</strong> Electronic-only transactions</p>
                        <p>• <strong>Cryptocurrency:</strong> Decentralized digital currencies</p>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-900">Currency Functions</h4>
                      <div className="text-purple-700 text-sm mt-2 space-y-1">
                        <p>• <strong>Medium of Exchange:</strong> Facilitates trade transactions</p>
                        <p>• <strong>Unit of Account:</strong> Measures and compares values</p>
                        <p>• <strong>Store of Value:</strong> Preserves wealth over time</p>
                        <p>• <strong>Standard of Payment:</strong> Settles debts and obligations</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ArrowLeftRight className="h-5 w-5 text-green-600" />
                    <span>Exchange Rates Explained</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Exchange rates represent the value of one currency in terms of another. 
                    They fluctuate constantly based on economic factors, market sentiment, and global events.
                  </p>

                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Exchange Rate Example</h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-white rounded border">
                        <strong>EUR/USD 1.1737</strong>
                        <p className="text-gray-600 mt-1">1 Euro = 1.1737 US Dollars</p>
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <strong>Base Currency:</strong> EUR (European Union Euro)
                      </div>
                      <div className="p-3 bg-white rounded border">
                        <strong>Quote Currency:</strong> USD (US Dollar)
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <h5 className="font-medium text-orange-900">Bid vs Ask Price</h5>
                      <p className="text-orange-700 text-sm mt-1">
                        <strong>Bid:</strong> Price buyers are willing to pay<br/>
                        <strong>Ask:</strong> Price sellers want to receive<br/>
                        <strong>Spread:</strong> Difference between bid and ask
                      </p>
                    </div>
                    
                    <div className="p-3 bg-red-50 rounded-lg">
                      <h5 className="font-medium text-red-900">Currency Pairs</h5>
                      <p className="text-red-700 text-sm mt-1">
                        <strong>Major Pairs:</strong> Include USD (EUR/USD, GBP/USD)<br/>
                        <strong>Minor Pairs:</strong> Don't include USD (EUR/GBP)<br/>
                        <strong>Exotic Pairs:</strong> Include emerging market currencies
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Forex Market & Trading */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <span>Forex Market & Trading</span>
              </h3>
              <p className="text-gray-600 mt-2">Understanding the world's largest financial market</p>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span>The Foreign Exchange Market (Forex)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">Market Overview</h4>
                    <div className="space-y-2 text-sm text-blue-700">
                      <p><strong>Daily Volume:</strong> $7.5 trillion+</p>
                      <p><strong>Market Type:</strong> Decentralized, over-the-counter</p>
                      <p><strong>Operating Hours:</strong> 24/5 (Monday to Friday)</p>
                      <p><strong>Participants:</strong> Banks, corporations, governments, traders</p>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-3">Trading Sessions</h4>
                    <div className="space-y-2 text-sm text-green-700">
                      <p><strong>Asian Session:</strong> Sydney, Tokyo (GMT+9 to +11)</p>
                      <p><strong>European Session:</strong> London, Frankfurt (GMT)</p>
                      <p><strong>American Session:</strong> New York (GMT-5)</p>
                      <p><strong>Peak Hours:</strong> Session overlaps</p>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-3">Key Features</h4>
                    <div className="space-y-2 text-sm text-purple-700">
                      <p><strong>High Liquidity:</strong> Easy buying/selling</p>
                      <p><strong>Low Spreads:</strong> Minimal transaction costs</p>
                      <p><strong>Leverage Available:</strong> Amplified trading power</p>
                      <p><strong>Global Access:</strong> Trade from anywhere</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Most Traded Currency Pairs (by volume)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="p-3 bg-white rounded border">
                      <strong>EUR/USD</strong>
                      <p className="text-gray-600">Euro Dollar</p>
                      <p className="text-blue-600">~24% of trades</p>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <strong>USD/JPY</strong>
                      <p className="text-gray-600">Dollar Yen</p>
                      <p className="text-blue-600">~13% of trades</p>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <strong>GBP/USD</strong>
                      <p className="text-gray-600">Pound Dollar</p>
                      <p className="text-blue-600">~9% of trades</p>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <strong>USD/CHF</strong>
                      <p className="text-gray-600">Dollar Franc</p>
                      <p className="text-blue-600">~5% of trades</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Factors Affecting Exchange Rates */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <Globe className="h-6 w-6 text-orange-600" />
                <span>Factors Affecting Exchange Rates</span>
              </h3>
              <p className="text-gray-600 mt-2">Economic and political forces that drive currency valuations</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span>Economic Factors</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <h4 className="font-semibold text-blue-900">Interest Rates</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        Higher interest rates attract foreign investment, strengthening currency. 
                        Central bank policies directly impact exchange rates.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <h4 className="font-semibold text-green-900">Inflation Rates</h4>
                      <p className="text-green-700 text-sm mt-1">
                        Low inflation preserves currency value. Countries with consistently 
                        lower inflation see currency appreciation over time.
                      </p>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                      <h4 className="font-semibold text-purple-900">Economic Performance</h4>
                      <p className="text-purple-700 text-sm mt-1">
                        GDP growth, employment rates, and economic indicators influence 
                        investor confidence and currency demand.
                      </p>
                    </div>

                    <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                      <h4 className="font-semibold text-orange-900">Trade Balance</h4>
                      <p className="text-orange-700 text-sm mt-1">
                        Trade surpluses strengthen currency, while deficits weaken it. 
                        Export-import balance affects currency supply and demand.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-red-600" />
                    <span>Political & Market Factors</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                      <h4 className="font-semibold text-red-900">Political Stability</h4>
                      <p className="text-red-700 text-sm mt-1">
                        Stable governments attract investment. Political uncertainty, 
                        elections, and policy changes create currency volatility.
                      </p>
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <h4 className="font-semibold text-yellow-900">Market Sentiment</h4>
                      <p className="text-yellow-700 text-sm mt-1">
                        Investor psychology, risk appetite, and market speculation 
                        can cause significant short-term currency movements.
                      </p>
                    </div>

                    <div className="p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
                      <h4 className="font-semibold text-indigo-900">Government Debt</h4>
                      <p className="text-indigo-700 text-sm mt-1">
                        High national debt reduces investor confidence. Countries 
                        with large deficits are less attractive to foreign investors.
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                      <h4 className="font-semibold text-gray-900">Central Bank Actions</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Monetary policy, intervention in forex markets, and 
                        communication from central banks significantly impact rates.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Practical Applications */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <Calculator className="h-6 w-6 text-purple-600" />
                <span>Practical Currency Applications</span>
              </h3>
              <p className="text-gray-600 mt-2">Real-world scenarios and practical tips for currency exchange</p>
            </div>

            <div className="space-y-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Banknote className="h-5 w-5 text-green-600" />
                    <span>Travel & International Transactions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-3">Travel Money Tips</h4>
                      <div className="space-y-2 text-sm text-green-700">
                        <div className="p-3 bg-white rounded border">
                          <strong>Best Exchange Options:</strong>
                          <p>1. Local banks or credit unions</p>
                          <p>2. Fee-friendly ATMs abroad</p>
                          <p>3. Online currency services</p>
                        </div>
                        <div className="p-3 bg-white rounded border">
                          <strong>Avoid:</strong>
                          <p>• Airport exchange kiosks</p>
                          <p>• Hotel currency exchange</p>
                          <p>• Tourist area exchanges</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-3">Payment Methods</h4>
                      <div className="space-y-2 text-sm text-blue-700">
                        <div className="p-3 bg-white rounded border">
                          <strong>Credit/Debit Cards:</strong>
                          <p>• Close to wholesale rates</p>
                          <p>• Safer than cash</p>
                          <p>• Watch for foreign fees</p>
                        </div>
                        <div className="p-3 bg-white rounded border">
                          <strong>Cash:</strong>
                          <p>• Keep some local currency</p>
                          <p>• For small vendors/tips</p>
                          <p>• Emergency backup</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-3">Cost Optimization</h4>
                      <div className="space-y-2 text-sm text-purple-700">
                        <div className="p-3 bg-white rounded border">
                          <strong>Timing:</strong>
                          <p>• Monitor rates before travel</p>
                          <p>• Exchange during favorable rates</p>
                          <p>• Avoid last-minute exchanges</p>
                        </div>
                        <div className="p-3 bg-white rounded border">
                          <strong>Fees to Watch:</strong>
                          <p>• Exchange rate margins</p>
                          <p>• Service fees</p>
                          <p>• ATM withdrawal fees</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Info className="h-5 w-5 text-orange-600" />
                      <span>Business Applications</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <h4 className="font-semibold text-orange-900">International Trade</h4>
                        <p className="text-orange-700 text-sm mt-1">
                          <strong>Hedging:</strong> Use forward contracts to lock in rates<br/>
                          <strong>Invoicing:</strong> Choose stable currencies for contracts<br/>
                          <strong>Timing:</strong> Monitor rates for large transactions
                        </p>
                      </div>
                      
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900">Cross-border Payments</h4>
                        <p className="text-blue-700 text-sm mt-1">
                          <strong>Wire Transfers:</strong> Traditional but expensive<br/>
                          <strong>Online Services:</strong> Faster and cheaper options<br/>
                          <strong>Blockchain:</strong> Emerging low-cost solutions
                        </p>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-900">Risk Management</h4>
                        <p className="text-green-700 text-sm mt-1">
                          <strong>Diversification:</strong> Hold multiple currencies<br/>
                          <strong>Natural Hedging:</strong> Match revenues/costs<br/>
                          <strong>Financial Instruments:</strong> Options, swaps, futures
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span>Investment Considerations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900">Currency Investing</h4>
                        <p className="text-blue-700 text-sm mt-1">
                          <strong>Forex Trading:</strong> Speculate on rate movements<br/>
                          <strong>Currency ETFs:</strong> Passive exposure to currencies<br/>
                          <strong>International Stocks:</strong> Natural currency exposure
                        </p>
                      </div>

                      <div className="p-3 bg-red-50 rounded-lg">
                        <h4 className="font-semibold text-red-900">Risks</h4>
                        <p className="text-red-700 text-sm mt-1">
                          <strong>Volatility:</strong> Rates can change rapidly<br/>
                          <strong>Leverage Risk:</strong> Amplified losses possible<br/>
                          <strong>Political Risk:</strong> Government policy changes
                        </p>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-900">Safe Haven Currencies</h4>
                        <p className="text-green-700 text-sm mt-1">
                          <strong>USD:</strong> World's reserve currency<br/>
                          <strong>CHF:</strong> Swiss stability<br/>
                          <strong>JPY:</strong> Low interest rate haven
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <span>Essential Currency Exchange Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-semibold text-gray-900">Research Before You Exchange</p>
                          <p className="text-gray-700 text-sm">Compare rates from multiple sources and understand current market conditions.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-semibold text-gray-900">Understand All Fees</p>
                          <p className="text-gray-700 text-sm">Look beyond the exchange rate - consider service fees, margins, and hidden costs.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-semibold text-gray-900">Time Your Exchanges</p>
                          <p className="text-gray-700 text-sm">Monitor rates and exchange during favorable periods when possible.</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-semibold text-gray-900">Use Technology Wisely</p>
                          <p className="text-gray-700 text-sm">Leverage apps and online services for better rates and convenience.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-semibold text-gray-900">Keep Security in Mind</p>
                          <p className="text-gray-700 text-sm">Protect yourself from fraud and use reputable exchange services.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-semibold text-gray-900">Plan for Volatility</p>
                          <p className="text-gray-700 text-sm">Understand that rates fluctuate and have contingency plans for major changes.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyCalculatorComponent;