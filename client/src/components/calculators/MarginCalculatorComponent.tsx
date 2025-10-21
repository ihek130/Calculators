import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Info, 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Percent,
  AlertCircle, 
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip
} from 'recharts';

type CalculatorMode = 'profit' | 'stock' | 'currency';

interface ProfitMarginInputs {
  cost: number | null;
  revenue: number | null;
  margin: number | null;
  profit: number | null;
}

interface ProfitMarginResults {
  cost: number;
  revenue: number;
  margin: number;
  profit: number;
  markup: number;
}

interface StockMarginInputs {
  stockPrice: number;
  numberOfShares: number;
  marginRequirement: number;
}

interface StockMarginResults {
  totalCost: number;
  amountRequired: number;
  borrowedAmount: number;
}

interface CurrencyMarginInputs {
  exchangeRate: number;
  marginRatio: number;
  units: number;
}

interface CurrencyMarginResults {
  totalValue: number;
  amountRequired: number;
  leverage: number;
}

const MarginCalculatorComponent: React.FC = () => {
  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('profit');

  // Profit Margin State
  const [profitInputs, setProfitInputs] = useState<ProfitMarginInputs>({
    cost: 120,
    revenue: 160,
    margin: null,
    profit: null
  });
  const [profitResults, setProfitResults] = useState<ProfitMarginResults | null>(null);
  const [lastModifiedProfit, setLastModifiedProfit] = useState<string>('');

  // Stock Trading Margin State
  const [stockInputs, setStockInputs] = useState<StockMarginInputs>({
    stockPrice: 18.3,
    numberOfShares: 100,
    marginRequirement: 30
  });
  const [stockResults, setStockResults] = useState<StockMarginResults | null>(null);

  // Currency Exchange Margin State
  const [currencyInputs, setCurrencyInputs] = useState<CurrencyMarginInputs>({
    exchangeRate: 1.3,
    marginRatio: 20,
    units: 100
  });
  const [currencyResults, setCurrencyResults] = useState<CurrencyMarginResults | null>(null);

  useEffect(() => {
    if (calculatorMode === 'profit') {
      calculateProfitMargin();
    } else if (calculatorMode === 'stock') {
      calculateStockMargin();
    } else if (calculatorMode === 'currency') {
      calculateCurrencyMargin();
    }
  }, [calculatorMode, profitInputs, stockInputs, currencyInputs]);

  // Profit Margin Calculation - "Any two of the following"
  const calculateProfitMargin = () => {
    try {
      const { cost, revenue, margin, profit } = profitInputs;
      const nonNullCount = [cost, revenue, margin, profit].filter(v => v !== null).length;

      if (nonNullCount < 2) {
        setProfitResults(null);
        return;
      }

      let calcCost = cost;
      let calcRevenue = revenue;
      let calcMargin = margin;
      let calcProfit = profit;

      // Scenario 1: Cost and Revenue provided
      if (cost !== null && revenue !== null && cost >= 0 && revenue >= 0) {
        calcCost = cost;
        calcRevenue = revenue;
        calcProfit = revenue - cost;
        calcMargin = revenue > 0 ? (calcProfit / revenue) * 100 : 0;
      }
      // Scenario 2: Cost and Margin provided
      else if (cost !== null && margin !== null && cost >= 0 && margin >= 0) {
        calcCost = cost;
        calcMargin = margin;
        // margin = profit / revenue => revenue = profit / margin
        // profit = revenue - cost => profit = revenue - cost
        // margin = (revenue - cost) / revenue => margin * revenue = revenue - cost
        // margin * revenue - revenue = -cost => revenue(margin - 1) = -cost
        // revenue = cost / (1 - margin/100)
        calcRevenue = margin < 100 ? cost / (1 - margin / 100) : cost;
        calcProfit = calcRevenue - calcCost;
      }
      // Scenario 3: Cost and Profit provided
      else if (cost !== null && profit !== null && cost >= 0) {
        calcCost = cost;
        calcProfit = profit;
        calcRevenue = cost + profit;
        calcMargin = calcRevenue > 0 ? (calcProfit / calcRevenue) * 100 : 0;
      }
      // Scenario 4: Revenue and Margin provided
      else if (revenue !== null && margin !== null && revenue >= 0 && margin >= 0) {
        calcRevenue = revenue;
        calcMargin = margin;
        calcProfit = (margin / 100) * revenue;
        calcCost = revenue - calcProfit;
      }
      // Scenario 5: Revenue and Profit provided
      else if (revenue !== null && profit !== null && revenue >= 0) {
        calcRevenue = revenue;
        calcProfit = profit;
        calcCost = revenue - profit;
        calcMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
      }
      // Scenario 6: Margin and Profit provided
      else if (margin !== null && profit !== null && margin >= 0) {
        calcMargin = margin;
        calcProfit = profit;
        // margin = profit / revenue => revenue = profit / (margin/100)
        calcRevenue = margin > 0 ? (profit / (margin / 100)) : profit;
        calcCost = calcRevenue - calcProfit;
      }
      else {
        setProfitResults(null);
        return;
      }

      // Calculate markup
      const calcMarkup = calcCost > 0 ? (calcProfit / calcCost) * 100 : 0;

      setProfitResults({
        cost: calcCost,
        revenue: calcRevenue,
        margin: calcMargin,
        profit: calcProfit,
        markup: calcMarkup
      });
    } catch (error) {
      console.error('Error calculating profit margin:', error);
      setProfitResults(null);
    }
  };

  // Stock Trading Margin Calculation
  const calculateStockMargin = () => {
    try {
      if (stockInputs.stockPrice <= 0 || stockInputs.numberOfShares <= 0 || stockInputs.marginRequirement <= 0) {
        setStockResults(null);
        return;
      }

      const totalCost = stockInputs.stockPrice * stockInputs.numberOfShares;
      const amountRequired = totalCost * (stockInputs.marginRequirement / 100);
      const borrowedAmount = totalCost - amountRequired;

      setStockResults({
        totalCost,
        amountRequired,
        borrowedAmount
      });
    } catch (error) {
      console.error('Error calculating stock margin:', error);
      setStockResults(null);
    }
  };

  // Currency Exchange Margin Calculation
  const calculateCurrencyMargin = () => {
    try {
      if (currencyInputs.exchangeRate <= 0 || currencyInputs.marginRatio <= 0 || currencyInputs.units <= 0) {
        setCurrencyResults(null);
        return;
      }

      const totalValue = currencyInputs.exchangeRate * currencyInputs.units;
      const amountRequired = totalValue / currencyInputs.marginRatio;
      const leverage = currencyInputs.marginRatio;

      setCurrencyResults({
        totalValue,
        amountRequired,
        leverage
      });
    } catch (error) {
      console.error('Error calculating currency margin:', error);
      setCurrencyResults(null);
    }
  };

  const handleProfitInputChange = (field: keyof ProfitMarginInputs, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setProfitInputs({ ...profitInputs, [field]: numValue });
    setLastModifiedProfit(field);
  };

  const handleResetProfit = () => {
    setProfitInputs({
      cost: 120,
      revenue: 160,
      margin: null,
      profit: null
    });
    setLastModifiedProfit('');
  };

  const handleResetStock = () => {
    setStockInputs({
      stockPrice: 18.3,
      numberOfShares: 100,
      marginRequirement: 30
    });
  };

  const handleResetCurrency = () => {
    setCurrencyInputs({
      exchangeRate: 1.3,
      marginRatio: 20,
      units: 100
    });
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // Prepare chart data for profit margin
  const profitChartData = profitResults ? [
    { name: 'Cost', value: profitResults.cost, fill: '#ef4444' },
    { name: 'Profit', value: profitResults.profit, fill: '#10b981' }
  ] : [];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Percent className="h-8 w-8 text-blue-600" />
          Margin Calculator
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Calculate profit margins, stock trading margins, and currency exchange margins
        </p>
      </div>

      {/* Mode Selector */}
      <Card className="shadow-lg border-2 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Label className="text-base font-semibold whitespace-nowrap">Calculator Type:</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              <Button
                onClick={() => setCalculatorMode('profit')}
                variant={calculatorMode === 'profit' ? 'default' : 'outline'}
                className="w-full"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Profit Margin
              </Button>
              <Button
                onClick={() => setCalculatorMode('stock')}
                variant={calculatorMode === 'stock' ? 'default' : 'outline'}
                className="w-full"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Stock Trading
              </Button>
              <Button
                onClick={() => setCalculatorMode('currency')}
                variant={calculatorMode === 'currency' ? 'default' : 'outline'}
                className="w-full"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Currency Exchange
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit Margin Calculator */}
      {calculatorMode === 'profit' && (
        <>
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <Calculator className="h-6 w-6 text-blue-600" />
                Profit Margin Calculator
              </CardTitle>
              <CardDescription>
                Calculate profit margin by providing any two of the following values
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cost" className="text-sm font-semibold">
                    Cost ($)
                  </Label>
                  <Input
                    id="cost"
                    type="number"
                    value={profitInputs.cost ?? ''}
                    onChange={(e) => handleProfitInputChange('cost', e.target.value)}
                    placeholder="Enter cost"
                    min="0"
                    step="0.01"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="revenue" className="text-sm font-semibold">
                    Revenue ($)
                  </Label>
                  <Input
                    id="revenue"
                    type="number"
                    value={profitInputs.revenue ?? ''}
                    onChange={(e) => handleProfitInputChange('revenue', e.target.value)}
                    placeholder="Enter revenue"
                    min="0"
                    step="0.01"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="margin" className="text-sm font-semibold">
                    Margin (%)
                  </Label>
                  <Input
                    id="margin"
                    type="number"
                    value={profitInputs.margin ?? ''}
                    onChange={(e) => handleProfitInputChange('margin', e.target.value)}
                    placeholder="Enter margin %"
                    min="0"
                    max="100"
                    step="0.01"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profit" className="text-sm font-semibold">
                    Profit ($)
                  </Label>
                  <Input
                    id="profit"
                    type="number"
                    value={profitInputs.profit ?? ''}
                    onChange={(e) => handleProfitInputChange('profit', e.target.value)}
                    placeholder="Enter profit"
                    step="0.01"
                    className="text-base"
                  />
                </div>
              </div>

              <div className="mt-6">
                <Button onClick={handleResetProfit} variant="outline" className="w-full sm:w-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profit Margin Results */}
          {profitResults && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="shadow-md border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Margin</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">
                          {formatPercent(profitResults.margin)}
                        </p>
                      </div>
                      <Percent className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Profit</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">
                          {formatCurrency(profitResults.profit)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-l-4 border-l-purple-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Markup</p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-600">
                          {formatPercent(profitResults.markup)}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pie Chart */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Cost vs Profit Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[350px] sm:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <Pie
                          data={profitChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => {
                            const isMobile = window.innerWidth < 640;
                            return isMobile ? `${(percent * 100).toFixed(0)}%` : `${name}: ${(percent * 100).toFixed(1)}%`;
                          }}
                          outerRadius="60%"
                          innerRadius="0%"
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {profitChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '11px'
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom"
                          height={36}
                          wrapperStyle={{ 
                            paddingTop: '10px',
                            fontSize: '12px'
                          }}
                          iconSize={10}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Definitions */}
              <Card className="shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-blue-900">Cost:</p>
                        <p className="text-gray-700">The cost of the product ({formatCurrency(profitResults.cost)})</p>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900">Revenue:</p>
                        <p className="text-gray-700">The income generated by selling the product ({formatCurrency(profitResults.revenue)})</p>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900">Profit:</p>
                        <p className="text-gray-700">The money left after deducting cost from revenue ({formatCurrency(profitResults.profit)})</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-blue-900">Margin:</p>
                        <p className="text-gray-700">The percentage of profit vs. revenue ({formatPercent(profitResults.margin)})</p>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900">Markup:</p>
                        <p className="text-gray-700">The percentage of profit vs. cost ({formatPercent(profitResults.markup)})</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Stock Trading Margin Calculator */}
      {calculatorMode === 'stock' && (
        <>
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <TrendingUp className="h-6 w-6 text-green-600" />
                Stock Trading Margin Calculator
              </CardTitle>
              <CardDescription>
                Calculate the required amount or maintenance margin needed for securities purchase on margin
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stockPrice" className="text-sm font-semibold">
                    Stock Price ($)
                  </Label>
                  <Input
                    id="stockPrice"
                    type="number"
                    value={stockInputs.stockPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      setStockInputs({ ...stockInputs, stockPrice: value === '' ? 0 : parseFloat(value) });
                    }}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value) || value < 0) {
                        setStockInputs({ ...stockInputs, stockPrice: 0 });
                      }
                    }}
                    min="0"
                    step="0.01"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfShares" className="text-sm font-semibold">
                    Number of Shares
                  </Label>
                  <Input
                    id="numberOfShares"
                    type="number"
                    value={stockInputs.numberOfShares}
                    onChange={(e) => {
                      const value = e.target.value;
                      setStockInputs({ ...stockInputs, numberOfShares: value === '' ? 0 : parseFloat(value) });
                    }}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value) || value < 0) {
                        setStockInputs({ ...stockInputs, numberOfShares: 0 });
                      }
                    }}
                    min="0"
                    step="1"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marginRequirement" className="text-sm font-semibold">
                    Margin Requirement (%)
                  </Label>
                  <Input
                    id="marginRequirement"
                    type="number"
                    value={stockInputs.marginRequirement}
                    onChange={(e) => {
                      const value = e.target.value;
                      setStockInputs({ ...stockInputs, marginRequirement: value === '' ? 0 : parseFloat(value) });
                    }}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value) || value < 0) {
                        setStockInputs({ ...stockInputs, marginRequirement: 0 });
                      } else if (value > 100) {
                        setStockInputs({ ...stockInputs, marginRequirement: 100 });
                      }
                    }}
                    min="0"
                    max="100"
                    step="1"
                    className="text-base"
                  />
                </div>
              </div>

              <div className="mt-6">
                <Button onClick={handleResetStock} variant="outline" className="w-full sm:w-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stock Trading Results */}
          {stockResults && (
            <>
              <Card className="shadow-lg border-l-4 border-l-green-500">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Amount Required</p>
                    <p className="text-4xl font-bold text-green-600">
                      {formatCurrency(stockResults.amountRequired)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="shadow-md border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Cost</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">
                          {formatCurrency(stockResults.totalCost)}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-l-4 border-l-purple-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Borrowed Amount</p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-600">
                          {formatCurrency(stockResults.borrowedAmount)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Definitions */}
              <Card className="shadow-md bg-gradient-to-r from-green-50 to-emerald-50">
                <CardContent className="pt-6">
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-semibold text-green-900">Stock price:</p>
                      <p className="text-gray-700">The per-share stock price ({formatCurrency(stockInputs.stockPrice)})</p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-900">Number of shares:</p>
                      <p className="text-gray-700">The number of shares you want to purchase ({stockInputs.numberOfShares})</p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-900">Margin requirement:</p>
                      <p className="text-gray-700">The percentage required by the broker to make the margin purchase ({stockInputs.marginRequirement}%)</p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-900">Amount required:</p>
                      <p className="text-gray-700">The minimum amount required in your account to purchase ({formatCurrency(stockResults.amountRequired)})</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Currency Exchange Margin Calculator */}
      {calculatorMode === 'currency' && (
        <>
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <DollarSign className="h-6 w-6 text-purple-600" />
                Currency Exchange Margin Calculator
              </CardTitle>
              <CardDescription>
                Calculate the minimum amount to maintain in the margin account to make currency trading
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="exchangeRate" className="text-sm font-semibold">
                    Exchange Rate
                  </Label>
                  <Input
                    id="exchangeRate"
                    type="number"
                    value={currencyInputs.exchangeRate}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCurrencyInputs({ ...currencyInputs, exchangeRate: value === '' ? 0 : parseFloat(value) });
                    }}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value) || value < 0) {
                        setCurrencyInputs({ ...currencyInputs, exchangeRate: 0 });
                      }
                    }}
                    min="0"
                    step="0.01"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marginRatio" className="text-sm font-semibold">
                    Margin Ratio (e.g., 20 for 20:1)
                  </Label>
                  <Input
                    id="marginRatio"
                    type="number"
                    value={currencyInputs.marginRatio}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCurrencyInputs({ ...currencyInputs, marginRatio: value === '' ? 0 : parseFloat(value) });
                    }}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value) || value < 1) {
                        setCurrencyInputs({ ...currencyInputs, marginRatio: 1 });
                      }
                    }}
                    min="1"
                    step="1"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="units" className="text-sm font-semibold">
                    Units
                  </Label>
                  <Input
                    id="units"
                    type="number"
                    value={currencyInputs.units}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCurrencyInputs({ ...currencyInputs, units: value === '' ? 0 : parseFloat(value) });
                    }}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value) || value < 0) {
                        setCurrencyInputs({ ...currencyInputs, units: 0 });
                      }
                    }}
                    min="0"
                    step="1"
                    className="text-base"
                  />
                </div>
              </div>

              <div className="mt-6">
                <Button onClick={handleResetCurrency} variant="outline" className="w-full sm:w-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Currency Exchange Results */}
          {currencyResults && (
            <>
              <Card className="shadow-lg border-l-4 border-l-purple-500">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Amount Required</p>
                    <p className="text-4xl font-bold text-purple-600">
                      {currencyResults.amountRequired.toFixed(3)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="shadow-md border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Value</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">
                          {currencyResults.totalValue.toFixed(2)}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Leverage</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">
                          {currencyResults.leverage.toFixed(0)}:1
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Definitions */}
              <Card className="shadow-md bg-gradient-to-r from-purple-50 to-pink-50">
                <CardContent className="pt-6">
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-semibold text-purple-900">Exchange rate:</p>
                      <p className="text-gray-700">
                        The exchange rate of the currency to purchase in your home currency. For example, if you plan to 
                        purchase 100 EUR and your home currency is USD. In the currency market, 1 EUR = 1.22 USD, then 
                        the exchange rate is 1.22. (Current: {currencyInputs.exchangeRate})
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-purple-900">Margin ratio:</p>
                      <p className="text-gray-700">
                        The ratio of margin to use. A margin ratio of {currencyInputs.marginRatio} means you can trade 
                        {currencyInputs.marginRatio}x the amount you deposit as margin (leverage of {currencyInputs.marginRatio}:1).
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-purple-900">Units:</p>
                      <p className="text-gray-700">The amount of currency to purchase ({currencyInputs.units} units)</p>
                    </div>
                    <div>
                      <p className="font-semibold text-purple-900">Amount required:</p>
                      <p className="text-gray-700">
                        The amount required in your home currency to make the purchase ({currencyResults.amountRequired.toFixed(3)})
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Educational Content - Step 2 */}
      <Card className="shadow-lg border-t-4 border-t-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Info className="h-6 w-6 text-blue-600" />
            Understanding Margin Calculations
          </CardTitle>
          <CardDescription>
            Comprehensive guide to profit margins, stock trading margins, and currency exchange margins
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* What is Margin? */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Percent className="h-5 w-5 text-blue-600" />
              What is Margin?
            </h2>
            <div className="prose max-w-none">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                The term "margin" has different meanings depending on the context in which it's used. In business and finance, 
                margin generally refers to the difference between a product or service's selling price and the cost of production, 
                or the ratio of profit to revenue. However, in trading contexts, margin refers to the collateral that an investor 
                must deposit with their broker or exchange to cover the credit risk the holder poses for the broker or exchange.
              </p>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mt-3">
                Understanding margin is crucial whether you're running a business, analyzing financial statements, or engaging 
                in securities or currency trading. Each type of margin calculation serves a specific purpose and provides valuable 
                insights into profitability, risk management, and financial leverage.
              </p>
            </div>
          </section>

          {/* Profit Margin */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              Profit Margin: Business Performance Indicator
            </h2>
            
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
              <h3 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">Key Concept</h3>
              <p className="text-xs sm:text-sm text-green-800">
                Profit margin is a financial ratio that measures the percentage of profit a company earns relative to its revenue. 
                It indicates how much profit a business makes for every dollar of sales and is a key indicator of a company's 
                financial health and efficiency.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Understanding the Formula</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="font-mono text-sm sm:text-base text-center text-gray-800">
                  Profit Margin (%) = [(Revenue - Cost) / Revenue] × 100
                </p>
                <p className="font-mono text-sm sm:text-base text-center text-gray-800 mt-2">
                  Markup (%) = [(Revenue - Cost) / Cost] × 100
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Profit Margin vs. Markup</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Many business owners confuse profit margin with markup, but these are distinctly different metrics:
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 p-2 text-left">Metric</th>
                      <th className="border border-gray-300 p-2 text-left">Formula</th>
                      <th className="border border-gray-300 p-2 text-left">What It Measures</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2 font-semibold">Profit Margin</td>
                      <td className="border border-gray-300 p-2">(Revenue - Cost) / Revenue</td>
                      <td className="border border-gray-300 p-2">Profit as % of selling price</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 font-semibold">Markup</td>
                      <td className="border border-gray-300 p-2">(Revenue - Cost) / Cost</td>
                      <td className="border border-gray-300 p-2">Profit as % of cost</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Example:</h4>
                <p className="text-xs sm:text-sm text-blue-800">
                  A product costs $120 to produce and sells for $160.<br/>
                  <strong>Profit:</strong> $160 - $120 = $40<br/>
                  <strong>Profit Margin:</strong> ($40 / $160) × 100 = 25%<br/>
                  <strong>Markup:</strong> ($40 / $120) × 100 = 33.33%
                </p>
                <p className="text-xs sm:text-sm text-blue-800 mt-2">
                  Notice that markup is always higher than profit margin for the same product because it's calculated 
                  using the smaller cost value as the denominator.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Types of Profit Margins</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                  <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">Gross Profit Margin</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Measures profit after deducting direct costs of goods sold (COGS). Formula: (Revenue - COGS) / Revenue × 100
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Operating Profit Margin</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Includes operating expenses like rent, utilities, and salaries. Formula: Operating Income / Revenue × 100
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-purple-200 shadow-sm">
                  <h4 className="font-semibold text-purple-900 mb-2 text-sm sm:text-base">Net Profit Margin</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    The bottom line after all expenses, taxes, and interest. Formula: Net Income / Revenue × 100
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Industry Benchmarks</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Profit margins vary significantly across industries. Understanding these benchmarks helps you evaluate 
                whether your business performance is competitive:
              </p>
              <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-gray-700 ml-2">
                <li><strong>Retail:</strong> 2-5% net margin (low margins, high volume)</li>
                <li><strong>Software/SaaS:</strong> 15-30% net margin (high margins, scalable)</li>
                <li><strong>Restaurants:</strong> 3-7% net margin (tight margins, high overhead)</li>
                <li><strong>Consulting:</strong> 10-20% net margin (service-based, variable costs)</li>
                <li><strong>Manufacturing:</strong> 5-15% net margin (depends on automation)</li>
                <li><strong>Healthcare:</strong> 8-15% net margin (regulated, high costs)</li>
              </ul>
            </div>
          </section>

          {/* Stock Trading Margin */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Stock Trading Margin: Leveraged Investing
            </h2>

            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
              <h3 className="font-semibold text-orange-900 mb-2 text-sm sm:text-base">Key Concept</h3>
              <p className="text-xs sm:text-sm text-orange-800">
                In stock trading, margin refers to borrowing money from a broker to purchase securities. A margin account 
                allows investors to leverage their capital by borrowing funds to buy more stock than they could with cash alone.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">How Margin Trading Works</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                When you open a margin account, you can borrow up to a certain percentage of the purchase price of securities. 
                The initial margin requirement set by the Federal Reserve (Regulation T) is currently 50%, meaning you must 
                deposit at least 50% of the purchase price in cash. However, brokers often have higher requirements, especially 
                for volatile or lower-priced stocks.
              </p>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Calculation Formula:</h4>
                <p className="font-mono text-sm sm:text-base text-center text-gray-800">
                  Amount Required = Stock Price × Number of Shares × (Margin Requirement % / 100)
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Example:</h4>
                <p className="text-xs sm:text-sm text-blue-800">
                  You want to buy 100 shares of a stock priced at $18.30 per share with a 30% margin requirement.<br/>
                  <strong>Total Cost:</strong> $18.30 × 100 = $1,830<br/>
                  <strong>Amount Required:</strong> $1,830 × 0.30 = $549<br/>
                  <strong>Borrowed Amount:</strong> $1,830 - $549 = $1,281
                </p>
                <p className="text-xs sm:text-sm text-blue-800 mt-2">
                  You only need to deposit $549 to control $1,830 worth of stock, borrowing the remaining $1,281 from your broker.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Margin Requirements</h3>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded-lg border-l-4 border-blue-500 shadow-sm">
                  <h4 className="font-semibold text-blue-900 text-sm sm:text-base">Initial Margin</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    The minimum amount you must deposit when purchasing securities on margin. Typically 50% as required by Regulation T.
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border-l-4 border-green-500 shadow-sm">
                  <h4 className="font-semibold text-green-900 text-sm sm:text-base">Maintenance Margin</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    The minimum account balance you must maintain. FINRA requires 25%, but brokers often require 30-40%. 
                    If your equity falls below this, you'll receive a margin call.
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border-l-4 border-red-500 shadow-sm">
                  <h4 className="font-semibold text-red-900 text-sm sm:text-base">Margin Call</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    A demand from your broker to deposit more funds or securities to bring your account back to the minimum 
                    maintenance margin. If you can't meet the call, the broker can sell your securities without notice.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Advantages and Risks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <span className="text-lg">✓</span> Advantages
                  </h4>
                  <ul className="space-y-1 text-xs sm:text-sm text-green-800">
                    <li>• Increased purchasing power and potential returns</li>
                    <li>• Flexibility to diversify investments</li>
                    <li>• Access to more opportunities with less capital</li>
                    <li>• Can amplify gains in rising markets</li>
                  </ul>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <span className="text-lg">✗</span> Risks
                  </h4>
                  <ul className="space-y-1 text-xs sm:text-sm text-red-800">
                    <li>• Magnified losses - can lose more than invested</li>
                    <li>• Margin calls can force liquidation at bad times</li>
                    <li>• Interest charges on borrowed funds</li>
                    <li>• Emotional stress from leveraged positions</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Currency Exchange Margin */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              Currency Exchange Margin: Forex Trading
            </h2>

            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
              <h3 className="font-semibold text-purple-900 mb-2 text-sm sm:text-base">Key Concept</h3>
              <p className="text-xs sm:text-sm text-purple-800">
                In forex (foreign exchange) trading, margin is the amount of capital required to open and maintain a leveraged 
                trading position. Currency trading typically involves very high leverage ratios, sometimes as high as 100:1 or 
                even 500:1, allowing traders to control large positions with relatively small capital.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Understanding Forex Margin</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Forex margin is not a fee or transaction cost; it's a security deposit that the broker holds while a leveraged 
                position is open. The margin ratio determines how much leverage you can use. For example, a 20:1 margin ratio 
                means you need to deposit 5% of the total position value (1/20 = 0.05 = 5%).
              </p>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Calculation Formula:</h4>
                <p className="font-mono text-sm sm:text-base text-center text-gray-800">
                  Amount Required = (Exchange Rate × Units) / Margin Ratio
                </p>
                <p className="font-mono text-sm sm:text-base text-center text-gray-800 mt-2">
                  Leverage = Margin Ratio : 1
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Example:</h4>
                <p className="text-xs sm:text-sm text-blue-800">
                  You want to trade 100 units of EUR/USD at an exchange rate of 1.30 with a 20:1 margin ratio.<br/>
                  <strong>Total Position Value:</strong> 1.30 × 100 = $130<br/>
                  <strong>Amount Required:</strong> $130 / 20 = $6.50<br/>
                  <strong>Leverage:</strong> 20:1
                </p>
                <p className="text-xs sm:text-sm text-blue-800 mt-2">
                  With just $6.50 in your margin account, you can control a $130 currency position. However, this also means 
                  that small price movements can result in significant percentage gains or losses relative to your margin deposit.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Margin Levels in Forex</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 p-2 text-left">Leverage Ratio</th>
                      <th className="border border-gray-300 p-2 text-left">Margin Required</th>
                      <th className="border border-gray-300 p-2 text-left">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2">10:1</td>
                      <td className="border border-gray-300 p-2">10%</td>
                      <td className="border border-gray-300 p-2 text-green-700">Low</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">20:1</td>
                      <td className="border border-gray-300 p-2">5%</td>
                      <td className="border border-gray-300 p-2 text-green-700">Moderate</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">50:1</td>
                      <td className="border border-gray-300 p-2">2%</td>
                      <td className="border border-gray-300 p-2 text-orange-700">High</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">100:1</td>
                      <td className="border border-gray-300 p-2">1%</td>
                      <td className="border border-gray-300 p-2 text-red-700">Very High</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">500:1</td>
                      <td className="border border-gray-300 p-2">0.2%</td>
                      <td className="border border-gray-300 p-2 text-red-700 font-bold">Extreme</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Free Margin vs. Used Margin</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Used Margin</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    The amount currently tied up in open positions. This is the margin "locked" by your broker to maintain 
                    your current trades.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                  <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">Free Margin</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    The amount available to open new positions. Formula: Equity - Used Margin. When free margin reaches zero, 
                    you cannot open new positions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Best Practices and Tips */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Best Practices for Margin Trading
            </h2>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
              <h3 className="font-semibold text-yellow-900 mb-2 text-sm sm:text-base">⚠️ Critical Warning</h3>
              <p className="text-xs sm:text-sm text-yellow-800">
                Trading on margin significantly increases risk. You can lose more money than you deposit. Only experienced 
                investors should consider margin trading, and even then, only as part of a carefully managed portfolio strategy.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Essential Guidelines</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">1. Use Stop-Loss Orders</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Always protect your positions with stop-loss orders to limit potential losses. This is especially critical 
                    when using leverage.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-green-500 shadow-sm">
                  <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">2. Keep a Buffer</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Maintain more than the minimum margin requirement. This prevents margin calls during normal market volatility.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500 shadow-sm">
                  <h4 className="font-semibold text-purple-900 mb-2 text-sm sm:text-base">3. Monitor Positions Daily</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Check your margin level and equity regularly. Don't let positions run on autopilot, especially in volatile markets.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500 shadow-sm">
                  <h4 className="font-semibold text-orange-900 mb-2 text-sm sm:text-base">4. Understand Costs</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Factor in margin interest rates and financing costs. These can erode profits, especially on longer-term positions.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-red-500 shadow-sm">
                  <h4 className="font-semibold text-red-900 mb-2 text-sm sm:text-base">5. Start Small</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Begin with lower leverage ratios until you understand how margin affects your positions. Don't maximize 
                    leverage immediately.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500 shadow-sm">
                  <h4 className="font-semibold text-indigo-900 mb-2 text-sm sm:text-base">6. Have an Exit Strategy</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Know when you'll cut losses or take profits before entering any leveraged position. Stick to your plan.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Common Mistakes to Avoid</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-1">×</span>
                  <span><strong>Over-leveraging:</strong> Using maximum available leverage leaves no room for market fluctuations 
                  and almost guarantees margin calls.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-1">×</span>
                  <span><strong>Ignoring margin calls:</strong> Failing to respond to margin calls quickly can result in forced 
                  liquidation at the worst possible time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-1">×</span>
                  <span><strong>Emotional trading:</strong> Making impulsive decisions when positions move against you, especially 
                  with leverage, often compounds losses.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-1">×</span>
                  <span><strong>Not understanding broker terms:</strong> Different brokers have different margin requirements, 
                  interest rates, and policies. Read the fine print.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-1">×</span>
                  <span><strong>Holding losing positions too long:</strong> Hoping a position will recover while margin interest 
                  accumulates is a common path to significant losses.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Margin Calls and Liquidation */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Understanding Margin Calls
            </h2>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <h3 className="font-semibold text-red-900 mb-2 text-sm sm:text-base">Critical Information</h3>
              <p className="text-xs sm:text-sm text-red-800">
                A margin call occurs when the value of your margin account falls below the broker's required maintenance margin. 
                This is one of the most serious situations a margin trader can face, and understanding how to prevent and handle 
                margin calls is essential for anyone trading on margin.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">When Margin Calls Happen</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Margin calls typically occur when market prices move against your positions. For example, if you bought stocks 
                on margin and their prices decline, your equity decreases while your borrowed amount remains the same. When your 
                equity-to-total-value ratio drops below the maintenance margin requirement (usually 25-30%), your broker will 
                issue a margin call requiring you to either deposit more funds or liquidate positions.
              </p>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Margin Call Example:</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  <strong>Initial Position:</strong> You buy $10,000 worth of stock with 50% margin ($5,000 your money, 
                  $5,000 borrowed). Your equity = $5,000.<br/>
                  <strong>Market Drops 30%:</strong> Stock value falls to $7,000. Your equity = $7,000 - $5,000 = $2,000.<br/>
                  <strong>Margin Level:</strong> $2,000 / $7,000 = 28.6% equity ratio.<br/>
                  <strong>Result:</strong> If maintenance margin is 30%, you receive a margin call for approximately $100 to 
                  bring equity back above 30%.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Responding to Margin Calls</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                  <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">Option 1: Deposit Funds</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Add cash or marginable securities to your account to meet the maintenance requirement. This is the preferred 
                    option if you believe the market will recover and want to keep your positions open.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                  <h4 className="font-semibold text-orange-900 mb-2 text-sm sm:text-base">Option 2: Liquidate Positions</h4>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Sell some or all of your positions to reduce the borrowed amount and increase your equity ratio. This 
                    realizes losses but prevents further risk exposure.
                  </p>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-3">
                <h4 className="font-semibold text-red-900 mb-2 text-sm sm:text-base">⚠️ Forced Liquidation</h4>
                <p className="text-xs sm:text-sm text-red-800">
                  If you don't respond to a margin call promptly, your broker has the right to liquidate your positions without 
                  your consent or notification. Brokers can choose which securities to sell and at what price, often resulting 
                  in the worst possible execution during market stress. This forced liquidation locks in losses and cannot be 
                  reversed, making it critical to either maintain adequate margin buffers or respond immediately to margin calls.
                </p>
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Key Takeaways</h2>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span><strong>Profit margin</strong> measures business profitability as a percentage of revenue and varies 
                significantly by industry.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span><strong>Stock trading margin</strong> allows investors to leverage their capital but magnifies both gains 
                and losses. Regulation T requires 50% initial margin.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span><strong>Currency exchange margin</strong> involves high leverage ratios (up to 500:1) and requires careful 
                risk management due to extreme volatility potential.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span><strong>Margin calls</strong> occur when account equity falls below maintenance requirements and can result 
                in forced liquidation if not addressed immediately.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span>Always maintain a buffer above minimum margin requirements and use stop-loss orders to protect leveraged 
                positions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span>Understand the difference between profit margin and markup in business, and between initial and maintenance 
                margin in trading.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-1">•</span>
                <span>Margin trading is not suitable for all investors. Only trade on margin if you fully understand the risks 
                and have a disciplined strategy.</span>
              </li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarginCalculatorComponent;
