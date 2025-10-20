import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Info, Calculator, TrendingUp, DollarSign, Percent, Receipt, AlertCircle, RefreshCw } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';

interface VATInputs {
  vatRate: number;
  netPrice: number;
  grossPrice: number;
  taxAmount: number;
}

interface VATResults {
  vatRate: number;
  netPrice: number;
  grossPrice: number;
  taxAmount: number;
  vatPercentage: number;
}

const VatCalculatorComponent: React.FC = () => {
  const [inputs, setInputs] = useState<VATInputs>({
    vatRate: 20,
    netPrice: 1200,
    grossPrice: 0,
    taxAmount: 0
  });

  const [results, setResults] = useState<VATResults>({
    vatRate: 20,
    netPrice: 1200,
    grossPrice: 1440,
    taxAmount: 240,
    vatPercentage: 20
  });

  const [lastModified, setLastModified] = useState<string>('netPrice');

  // Calculate VAT based on which fields are provided
  useEffect(() => {
    calculateVAT();
  }, [inputs.vatRate, inputs.netPrice, inputs.grossPrice, inputs.taxAmount, lastModified]);

  const calculateVAT = () => {
    const { vatRate, netPrice, grossPrice, taxAmount } = inputs;

    let calculatedNetPrice = netPrice;
    let calculatedGrossPrice = grossPrice;
    let calculatedTaxAmount = taxAmount;
    let calculatedVatRate = vatRate;

    // Scenario 1: VAT Rate and Net Price provided
    if (lastModified === 'netPrice' && netPrice > 0 && vatRate >= 0) {
      calculatedTaxAmount = netPrice * (vatRate / 100);
      calculatedGrossPrice = netPrice + calculatedTaxAmount;
    }
    // Scenario 2: VAT Rate and Gross Price provided
    else if (lastModified === 'grossPrice' && grossPrice > 0 && vatRate >= 0) {
      calculatedNetPrice = grossPrice / (1 + vatRate / 100);
      calculatedTaxAmount = grossPrice - calculatedNetPrice;
    }
    // Scenario 3: VAT Rate and Tax Amount provided
    else if (lastModified === 'taxAmount' && taxAmount > 0 && vatRate > 0) {
      calculatedNetPrice = taxAmount / (vatRate / 100);
      calculatedGrossPrice = calculatedNetPrice + taxAmount;
    }
    // Scenario 4: Net Price and Gross Price provided
    else if (lastModified === 'grossPrice' && netPrice > 0 && grossPrice > 0 && grossPrice > netPrice) {
      calculatedTaxAmount = grossPrice - netPrice;
      calculatedVatRate = (calculatedTaxAmount / netPrice) * 100;
    }
    // Scenario 5: Net Price and Tax Amount provided
    else if (lastModified === 'taxAmount' && netPrice > 0 && taxAmount > 0) {
      calculatedGrossPrice = netPrice + taxAmount;
      calculatedVatRate = (taxAmount / netPrice) * 100;
    }
    // Scenario 6: Gross Price and Tax Amount provided
    else if (lastModified === 'taxAmount' && grossPrice > 0 && taxAmount > 0 && grossPrice > taxAmount) {
      calculatedNetPrice = grossPrice - taxAmount;
      calculatedVatRate = (taxAmount / calculatedNetPrice) * 100;
    }

    setResults({
      vatRate: calculatedVatRate,
      netPrice: calculatedNetPrice,
      grossPrice: calculatedGrossPrice,
      taxAmount: calculatedTaxAmount,
      vatPercentage: calculatedVatRate
    });
  };

  const handleInputChange = (field: keyof VATInputs, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    setInputs(prev => ({ ...prev, [field]: numValue }));
    setLastModified(field);
  };

  const handleReset = () => {
    setInputs({
      vatRate: 20,
      netPrice: 1200,
      grossPrice: 0,
      taxAmount: 0
    });
    setLastModified('netPrice');
  };

  // Data for pie chart
  const pieData = [
    { name: 'Net Price', value: results.netPrice, color: '#3b82f6' },
    { name: 'VAT Amount', value: results.taxAmount, color: '#f59e0b' }
  ];

  // Data for comparison chart showing different VAT rates
  const vatRateComparison = [
    { rate: '5%', netPrice: results.netPrice, vatAmount: results.netPrice * 0.05, grossPrice: results.netPrice * 1.05 },
    { rate: '10%', netPrice: results.netPrice, vatAmount: results.netPrice * 0.10, grossPrice: results.netPrice * 1.10 },
    { rate: '15%', netPrice: results.netPrice, vatAmount: results.netPrice * 0.15, grossPrice: results.netPrice * 1.15 },
    { rate: '20%', netPrice: results.netPrice, vatAmount: results.netPrice * 0.20, grossPrice: results.netPrice * 1.20 },
    { rate: '25%', netPrice: results.netPrice, vatAmount: results.netPrice * 0.25, grossPrice: results.netPrice * 1.25 }
  ];

  // Data for breakdown visualization
  const breakdownData = [
    { category: 'Net Price', amount: results.netPrice },
    { category: 'VAT Amount', amount: results.taxAmount }
  ];

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

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl sm:rounded-2xl shadow-lg">
            <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            VAT Calculator
          </h1>
        </div>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
          Calculate Value Added Tax (VAT) amounts. Provide any two values to automatically calculate the remaining values.
        </p>
      </div>

      {/* Main Calculator Card */}
      <Card className="shadow-xl border-t-4 border-t-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <span className="hidden sm:inline">VAT Calculation</span>
            <span className="sm:hidden">Calculator</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Enter any two values to calculate the remaining values
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-5 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                  Input Values
                </h3>
                <div className="space-y-4">
                  {/* VAT Rate */}
                  <div className="space-y-2">
                    <Label htmlFor="vatRate" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                      <Percent className="h-4 w-4 text-blue-600" />
                      VAT Rate (%)
                    </Label>
                    <Input
                      id="vatRate"
                      type="number"
                      value={inputs.vatRate || ''}
                      onChange={(e) => handleInputChange('vatRate', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 20"
                      step="0.1"
                      min="0"
                    />
                  </div>

                  {/* Net Price */}
                  <div className="space-y-2">
                    <Label htmlFor="netPrice" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Net Price (Before VAT)
                    </Label>
                    <Input
                      id="netPrice"
                      type="number"
                      value={inputs.netPrice || ''}
                      onChange={(e) => handleInputChange('netPrice', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 1200"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  {/* Gross Price */}
                  <div className="space-y-2">
                    <Label htmlFor="grossPrice" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      Gross Price (Including VAT)
                    </Label>
                    <Input
                      id="grossPrice"
                      type="number"
                      value={inputs.grossPrice || ''}
                      onChange={(e) => handleInputChange('grossPrice', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 1440"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  {/* Tax Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="taxAmount" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                      <Receipt className="h-4 w-4 text-orange-600" />
                      VAT Amount
                    </Label>
                    <Input
                      id="taxAmount"
                      type="number"
                      value={inputs.taxAmount || ''}
                      onChange={(e) => handleInputChange('taxAmount', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 240"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <Button 
                    onClick={handleReset} 
                    variant="outline" 
                    className="w-full mt-4 text-xs sm:text-sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Calculator
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-5 rounded-xl border border-green-200">
                <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
                  Calculated Results
                </h3>
                <div className="space-y-3">
                  <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-green-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">VAT Rate:</span>
                      <span className="text-base sm:text-lg font-bold text-green-700">
                        {formatPercent(results.vatRate)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-blue-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Net Price:</span>
                      <span className="text-base sm:text-lg font-bold text-blue-700">
                        {formatCurrency(results.netPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-orange-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">VAT Amount:</span>
                      <span className="text-base sm:text-lg font-bold text-orange-700">
                        {formatCurrency(results.taxAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 sm:p-5 rounded-lg shadow-md border-2 border-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base font-semibold text-purple-900">
                        Gross Price:
                      </span>
                      <span className="text-xl sm:text-2xl font-bold text-purple-700">
                        {formatCurrency(results.grossPrice)}
                      </span>
                    </div>
                    <p className="text-xs text-purple-700 mt-2">
                      Total amount including VAT
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-blue-900">
                    <strong>How it works:</strong> Enter any two values and the calculator will automatically 
                    compute the remaining values. VAT is added to the net price to get the gross price.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Breakdown Chart */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <span className="hidden sm:inline">Price Breakdown</span>
            <span className="sm:hidden">Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="h-80 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend 
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ 
                      paddingTop: '10px',
                      paddingLeft: '20px', 
                      paddingRight: '20px' 
                    }}
                    iconSize={12}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Net Price</p>
              <p className="text-sm sm:text-base font-bold text-blue-700">{formatCurrency(results.netPrice)}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-center">
              <p className="text-xs text-gray-600 mb-1">VAT ({formatPercent(results.vatRate)})</p>
              <p className="text-sm sm:text-base font-bold text-orange-700">{formatCurrency(results.taxAmount)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Gross Price</p>
              <p className="text-sm sm:text-base font-bold text-purple-700">{formatCurrency(results.grossPrice)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
              <p className="text-xs text-gray-600 mb-1">VAT % of Gross</p>
              <p className="text-sm sm:text-base font-bold text-green-700">
                {((results.taxAmount / results.grossPrice) * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VAT Rate Comparison Chart */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            <span className="hidden sm:inline">VAT Rate Comparison</span>
            <span className="sm:hidden">Rate Comparison</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            See how different VAT rates affect the final price based on your net price of {formatCurrency(results.netPrice)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vatRateComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rate" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="netPrice" fill="#3b82f6" name="Net Price" />
                <Bar dataKey="vatAmount" fill="#f59e0b" name="VAT Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Comparison Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 sm:px-4 py-2 text-left font-semibold text-gray-700">VAT Rate</th>
                  <th className="px-2 sm:px-4 py-2 text-right font-semibold text-gray-700">Net Price</th>
                  <th className="px-2 sm:px-4 py-2 text-right font-semibold text-gray-700">VAT Amount</th>
                  <th className="px-2 sm:px-4 py-2 text-right font-semibold text-gray-700">Gross Price</th>
                </tr>
              </thead>
              <tbody>
                {vatRateComparison.map((row, index) => (
                  <tr 
                    key={index} 
                    className={`border-b ${row.rate === `${results.vatRate}%` ? 'bg-blue-50 font-semibold' : ''}`}
                  >
                    <td className="px-2 sm:px-4 py-2">{row.rate}</td>
                    <td className="px-2 sm:px-4 py-2 text-right">{formatCurrency(row.netPrice)}</td>
                    <td className="px-2 sm:px-4 py-2 text-right text-orange-700">{formatCurrency(row.vatAmount)}</td>
                    <td className="px-2 sm:px-4 py-2 text-right font-semibold">{formatCurrency(row.grossPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Common VAT Rates Around the World */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
            <span className="hidden sm:inline">Common VAT Rates Around the World</span>
            <span className="sm:hidden">Global VAT Rates</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Europe */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 text-sm sm:text-base">Europe</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">United Kingdom:</span>
                  <span className="font-semibold text-blue-700">20%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Germany:</span>
                  <span className="font-semibold text-blue-700">19%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">France:</span>
                  <span className="font-semibold text-blue-700">20%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Italy:</span>
                  <span className="font-semibold text-blue-700">22%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Spain:</span>
                  <span className="font-semibold text-blue-700">21%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Netherlands:</span>
                  <span className="font-semibold text-blue-700">21%</span>
                </div>
              </div>
            </div>

            {/* Asia-Pacific */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 text-sm sm:text-base">Asia-Pacific</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Australia (GST):</span>
                  <span className="font-semibold text-green-700">10%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">China:</span>
                  <span className="font-semibold text-green-700">13%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">India (GST):</span>
                  <span className="font-semibold text-green-700">5-28%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Japan:</span>
                  <span className="font-semibold text-green-700">10%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Singapore (GST):</span>
                  <span className="font-semibold text-green-700">9%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">New Zealand (GST):</span>
                  <span className="font-semibold text-green-700">15%</span>
                </div>
              </div>
            </div>

            {/* Americas & Others */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3 text-sm sm:text-base">Americas & Others</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Canada (GST/HST):</span>
                  <span className="font-semibold text-purple-700">5-15%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Mexico (IVA):</span>
                  <span className="font-semibold text-purple-700">16%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Brazil (ICMS):</span>
                  <span className="font-semibold text-purple-700">17-19%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">South Africa:</span>
                  <span className="font-semibold text-purple-700">15%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">UAE:</span>
                  <span className="font-semibold text-purple-700">5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">USA:</span>
                  <span className="font-semibold text-red-700">No VAT*</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs sm:text-sm text-gray-700">
              <strong className="text-amber-900">*Note:</strong> The United States is the only developed country 
              that doesn't use a VAT system. Instead, it uses state and local sales taxes which vary by jurisdiction.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Educational Content - Step 2 */}
      <div className="space-y-6">
        {/* What is VAT */}
        <Card className="shadow-lg border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Info className="h-6 w-6 text-blue-600" />
              What is VAT (Value Added Tax)?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              <strong>VAT (Value Added Tax)</strong> is a type of indirect consumption tax imposed on the value added to 
              goods or services during different stages of the supply chain. This includes production, wholesale, distribution, 
              supply, or any other stages that add value to a product. Unlike direct taxes such as income tax, VAT is collected 
              incrementally at each stage of production and distribution, ultimately being borne by the final consumer.
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-lg border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-3">Global Importance of VAT</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <div className="text-2xl font-bold text-blue-700 mb-2">20%</div>
                  <p className="text-sm text-gray-700">
                    Approximately 20% of worldwide tax revenue comes from VAT
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <div className="text-2xl font-bold text-blue-700 mb-2">160+</div>
                  <p className="text-sm text-gray-700">
                    VAT is enforced in more than 160 countries around the world
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <div className="text-2xl font-bold text-blue-700 mb-2">Most Common</div>
                  <p className="text-sm text-gray-700">
                    The most common consumption tax system globally
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-4">
              <h5 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                European Union Requirement
              </h5>
              <p className="text-sm text-gray-700">
                All countries that are part of the European Union (EU) are legally required to enforce a minimum VAT rate. 
                Since its introduction in the 20th century, European VAT rates have consistently increased over time to 
                meet government revenue needs.
              </p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-4">
              <h5 className="font-semibold text-red-900 mb-2">The United States Exception</h5>
              <p className="text-sm text-gray-700">
                The United States is the <strong>only developed country in the world</strong> that doesn't use a VAT system. 
                Instead, the U.S. relies on state and local sales taxes, which vary significantly by jurisdiction and are 
                applied only at the point of final sale rather than throughout the supply chain.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Simplified Example Process */}
        <Card className="shadow-lg border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Receipt className="h-6 w-6 text-green-600" />
              Simplified Example: How VAT Works Through the Supply Chain
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Understanding VAT is easier with a real-world example. Let's follow coffee beans from farm to cup, assuming 
              a <strong>10% VAT rate</strong>. Each person or business in the chain must complete VAT government paperwork 
              and pay the VAT on the value they add.
            </p>

            <div className="space-y-4 mt-4">
              {/* Stage 1: Farmer */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-lg border-l-4 border-l-green-600">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                    1
                  </div>
                  <h4 className="font-bold text-green-900 text-lg">Farmer to Roaster</h4>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Fresh Coffee Beans Price:</strong> $5.00 per pound
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>VAT (10%):</strong> $0.50
                      </p>
                      <p className="text-sm font-bold text-green-700">
                        <strong>Total to Roaster:</strong> $5.50
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-xs text-gray-700 mb-1"><strong>VAT Collected:</strong> $0.50</p>
                      <p className="text-xs text-gray-700 mb-1"><strong>VAT Paid Previously:</strong> $0.00</p>
                      <p className="text-xs font-bold text-green-700"><strong>VAT to Government:</strong> $0.50</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-3 italic">
                    The farmer receives $5.50 total and pays $0.50 to the government.
                  </p>
                </div>
              </div>

              {/* Stage 2: Roaster */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-lg border-l-4 border-l-orange-600">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-orange-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                    2
                  </div>
                  <h4 className="font-bold text-orange-900 text-lg">Roaster to Coffee Shop</h4>
                </div>
                <div className="bg-white p-4 rounded-lg border border-orange-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Roasted Coffee Price:</strong> $10.00 per pound
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>VAT (10%):</strong> $1.00
                      </p>
                      <p className="text-sm font-bold text-orange-700">
                        <strong>Total to Coffee Shop:</strong> $11.00
                      </p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <p className="text-xs text-gray-700 mb-1"><strong>VAT Collected:</strong> $1.00</p>
                      <p className="text-xs text-gray-700 mb-1"><strong>VAT Paid Previously:</strong> $0.50</p>
                      <p className="text-xs font-bold text-orange-700"><strong>VAT to Government:</strong> $0.50</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-3 italic">
                    The roaster charges $11.00 but only pays $0.50 to the government (the difference between $1.00 
                    collected and $0.50 already paid by the farmer).
                  </p>
                </div>
              </div>

              {/* Stage 3: Coffee Shop */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border-l-4 border-l-purple-600">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                    3
                  </div>
                  <h4 className="font-bold text-purple-900 text-lg">Coffee Shop to Consumers</h4>
                </div>
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>5 Cups of Coffee:</strong> $20.00 total ($4.00 each)
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>VAT (10%):</strong> $2.00
                      </p>
                      <p className="text-sm font-bold text-purple-700">
                        <strong>Total from Customers:</strong> $22.00
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-xs text-gray-700 mb-1"><strong>VAT Collected:</strong> $2.00</p>
                      <p className="text-xs text-gray-700 mb-1"><strong>VAT Paid Previously:</strong> $1.00</p>
                      <p className="text-xs font-bold text-purple-700"><strong>VAT to Government:</strong> $1.00</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-3 italic">
                    The coffee shop owner receives $22.00 from customers and pays $1.00 to the government (the difference 
                    between $2.00 collected and $1.00 already paid in the supply chain).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mt-4">
              <h5 className="font-semibold text-blue-900 mb-3">Total VAT Summary</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Farmer Paid</p>
                  <p className="text-xl font-bold text-green-700">$0.50</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Roaster Paid</p>
                  <p className="text-xl font-bold text-orange-700">$0.50</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Coffee Shop Paid</p>
                  <p className="text-xl font-bold text-purple-700">$1.00</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-300 text-center">
                <p className="text-sm text-gray-700 mb-2">Total VAT Collected by Government</p>
                <p className="text-3xl font-bold text-blue-700">$2.00</p>
                <p className="text-xs text-gray-600 mt-2">
                  This equals 10% of the final consumer price ($20.00), demonstrating how VAT is distributed 
                  throughout the supply chain without double taxation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VAT vs Sales Tax */}
        <Card className="shadow-lg border-l-4 border-l-indigo-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calculator className="h-6 w-6 text-indigo-600" />
              VAT vs. Sales Tax: Key Differences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              While both VAT and sales tax are consumption taxes, they function very differently. Understanding these 
              differences is crucial for businesses operating internationally or in jurisdictions considering tax reform.
            </p>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-100 to-purple-100">
                    <th className="border border-indigo-200 px-4 py-3 text-left font-semibold text-indigo-900">
                      Aspect
                    </th>
                    <th className="border border-indigo-200 px-4 py-3 text-left font-semibold text-indigo-900">
                      VAT (Value Added Tax)
                    </th>
                    <th className="border border-indigo-200 px-4 py-3 text-left font-semibold text-indigo-900">
                      Sales Tax
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="border border-gray-200 px-4 py-3 font-semibold text-gray-700">
                      Collection Point
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
                      Collected at <strong>every stage</strong> of production and distribution
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
                      Collected <strong>only at final sale</strong> to end consumer
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-semibold text-gray-700">
                      Tax Rate Range
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
                      Typically <strong>14-25%</strong> globally
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
                      Typically <strong>4-10%</strong> in the U.S.
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="border border-gray-200 px-4 py-3 font-semibold text-gray-700">
                      Paperwork
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
                      <strong>Complex:</strong> Required at each stage, creating detailed paper trail
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
                      <strong>Simple:</strong> Only retailer files returns
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-semibold text-gray-700">
                      Tax Evasion Risk
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
                      <strong>Lower:</strong> Multiple verification points throughout supply chain
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
                      <strong>Higher:</strong> Single collection point easier to evade
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="border border-gray-200 px-4 py-3 font-semibold text-gray-700">
                      Double Taxation
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
                      <strong>No:</strong> Tax credits prevent cascading effect
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
                      <strong>Possible:</strong> Can occur without proper exemptions
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-semibold text-gray-700">
                      Admin Cost
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
                      <strong>Higher:</strong> Complex tracking and reporting requirements
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
                      <strong>Lower:</strong> Simpler to administer
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="border border-gray-200 px-4 py-3 font-semibold text-gray-700">
                      Global Usage
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
                      <strong>160+ countries</strong> including all of EU
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
                      <strong>United States</strong> (state and local levels)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-lg border border-indigo-200 mt-4">
              <h5 className="font-semibold text-indigo-900 mb-3">Key Insight: Tax Burden Comparison</h5>
              <p className="text-sm text-gray-700 leading-relaxed">
                Contrary to popular belief, VAT does <strong>not</strong> tax businesses more than sales tax in order to 
                reduce the tax burden on end consumers. In reality, businesses simply raise prices to compensate for the 
                VAT they pay. The end total in tax revenue generally remains the same between systems—the primary differences 
                lie in <em>when</em> and <em>how often</em> taxation occurs throughout the supply chain.
              </p>
            </div>

            <div className="bg-amber-50 p-5 rounded-lg border border-amber-200 mt-4">
              <h5 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Regressive Nature of Consumption Taxes
              </h5>
              <p className="text-sm text-gray-700 mb-3">
                Statistics have shown that VAT affects <strong>lower-income earners more disproportionately</strong> than 
                sales tax because of its regressive nature. Lower-income individuals spend a higher percentage of their 
                income on consumable goods, meaning they pay a larger proportion of their earnings in VAT.
              </p>
              <p className="text-sm text-gray-700">
                However, this can be offset by the proper implementation of <strong>progressive regulations</strong>, such 
                as reduced VAT rates or exemptions for essential goods (food, medicine, education) as seen in many European 
                VAT models. Many countries implement multi-tier VAT systems with reduced rates for necessities.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* VAT Differences Between Countries */}
        <Card className="shadow-lg border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              VAT Differences Between Countries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              While all countries follow a general VAT blueprint, there are significant differences in the implementation 
              details. The VAT system in one country will not be identical to another, with variations in rates, exemptions, 
              and administrative procedures.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-5 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-3">Rate Variations</h5>
                <p className="text-sm text-gray-700 mb-3">
                  Different countries impose varying VAT rates based on their fiscal policies and revenue needs:
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Standard rates:</strong> Range from 5% (UAE) to 27% (Hungary)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Reduced rates:</strong> Applied to essential goods like food, books, and medicine</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Zero rates:</strong> Some countries apply 0% to exports or specific categories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Super-reduced rates:</strong> Ultra-low rates for critical necessities</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 bg-green-50 rounded-lg border border-green-200">
                <h5 className="font-semibold text-green-900 mb-3">Exemptions & Special Rules</h5>
                <p className="text-sm text-gray-700 mb-3">
                  Countries customize VAT systems with exemptions and special provisions:
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Education services:</strong> Often exempt or zero-rated globally</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Healthcare:</strong> Medical services frequently exempt from VAT</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Financial services:</strong> Banking and insurance often VAT-exempt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Government services:</strong> Public sector charges typically exempt</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200 mt-4">
              <h5 className="font-semibold text-purple-900 mb-3">Country-Specific Examples</h5>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-purple-100">
                  <p className="font-semibold text-purple-900 mb-2">🇵🇭 Philippines</p>
                  <p className="text-sm text-gray-700">
                    Senior citizens are <strong>exempt from paying VAT</strong> for most goods and some services intended 
                    for personal consumption, providing social welfare benefits to elderly citizens.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-purple-100">
                  <p className="font-semibold text-purple-900 mb-2">🇨🇳 China</p>
                  <p className="text-sm text-gray-700">
                    Besides the standard VAT rate of 13%, China applies <strong>reduced rates</strong> to certain products 
                    such as books (9%) and agricultural products (9%), supporting education and food security.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-purple-100">
                  <p className="font-semibold text-purple-900 mb-2">🇬🇧 United Kingdom</p>
                  <p className="text-sm text-gray-700">
                    The UK has a standard rate of 20%, a reduced rate of 5% for certain goods (like children's car seats), 
                    and a <strong>zero rate</strong> for many food items, children's clothing, and books.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-purple-100">
                  <p className="font-semibold text-purple-900 mb-2">🇮🇳 India (GST)</p>
                  <p className="text-sm text-gray-700">
                    India's Goods and Services Tax features <strong>multiple tiers</strong>: 0%, 5%, 12%, 18%, and 28%, 
                    with essential items taxed at lower rates and luxury goods at higher rates.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
              <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Import and Export Rules
              </h5>
              <p className="text-sm text-gray-700">
                VAT treatment of imports and exports varies significantly. Most countries <strong>zero-rate exports</strong> 
                (allowing businesses to reclaim VAT paid) to make their products competitive internationally, while imports 
                typically incur VAT at the border. Filing procedures, payment schedules, and penalties for non-compliance 
                also differ substantially between jurisdictions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* GST Explanation */}
        <Card className="shadow-lg border-l-4 border-l-teal-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="h-6 w-6 text-teal-600" />
              GST (Goods and Services Tax)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              A <strong>GST (Goods and Services Tax)</strong> can be the alternative name for VAT in some countries, such 
              as Australia, Canada, India, New Zealand, and Singapore. While the terms "GST" and "VAT" are commonly used 
              interchangeably (and sometimes even confused with "sales tax"), the actual GST and VAT systems in their 
              respective countries can differ tremendously in structure, rates, and administration.
            </p>

            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-5 rounded-lg border border-teal-200">
              <h5 className="font-semibold text-teal-900 mb-3">Important Distinction</h5>
              <p className="text-sm text-gray-700 mb-3">
                <strong>No country has both a GST and a VAT.</strong> Countries choose one system or the other, and the 
                naming convention is typically based on historical and legislative preferences rather than fundamental 
                structural differences.
              </p>
              <p className="text-sm text-gray-700">
                While both GST and VAT are multi-stage consumption taxes collected throughout the supply chain, individual 
                implementations can vary significantly in their treatment of specific goods, exemptions, rate structures, 
                and administrative requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                <h5 className="font-semibold text-teal-900 mb-3">Countries Using "GST"</h5>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex justify-between">
                    <span>Australia:</span>
                    <span className="font-semibold text-teal-700">10%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Canada:</span>
                    <span className="font-semibold text-teal-700">5% (federal)</span>
                  </li>
                  <li className="flex justify-between">
                    <span>India:</span>
                    <span className="font-semibold text-teal-700">5-28%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>New Zealand:</span>
                    <span className="font-semibold text-teal-700">15%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Singapore:</span>
                    <span className="font-semibold text-teal-700">9%</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-3">Countries Using "VAT"</h5>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex justify-between">
                    <span>United Kingdom:</span>
                    <span className="font-semibold text-blue-700">20%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Germany:</span>
                    <span className="font-semibold text-blue-700">19%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>France:</span>
                    <span className="font-semibold text-blue-700">20%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>All EU Countries:</span>
                    <span className="font-semibold text-blue-700">15%+ min</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Most of Africa:</span>
                    <span className="font-semibold text-blue-700">Varies</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-4">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> The terms GST, VAT, and even "sales tax" are sometimes used interchangeably in 
                casual conversation, even though their technical implementations differ. When conducting international 
                business, it's crucial to understand the specific consumption tax system in each jurisdiction rather than 
                relying on terminology alone.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Key Takeaways */}
        <Card className="shadow-lg border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Info className="h-6 w-6 text-orange-600" />
              Key Takeaways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900">✓ Multi-Stage Collection</p>
                  <p className="text-xs text-gray-700">VAT is collected at every stage of production and distribution</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-green-900">✓ Global Standard</p>
                  <p className="text-xs text-gray-700">Used in 160+ countries, accounts for 20% of worldwide tax revenue</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-semibold text-purple-900">✓ No Double Taxation</p>
                  <p className="text-xs text-gray-700">Tax credits prevent cascading effects throughout supply chain</p>
                </div>
                <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                  <p className="text-sm font-semibold text-teal-900">✓ GST Alternative</p>
                  <p className="text-xs text-gray-700">GST is essentially VAT with a different name in some countries</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-sm font-semibold text-indigo-900">✓ Better Fraud Prevention</p>
                  <p className="text-xs text-gray-700">Multiple verification points reduce tax evasion compared to sales tax</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm font-semibold text-orange-900">✓ Country Variations</p>
                  <p className="text-xs text-gray-700">Rates, exemptions, and rules differ significantly between nations</p>
                </div>
                <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                  <p className="text-sm font-semibold text-pink-900">✓ Regressive Nature</p>
                  <p className="text-xs text-gray-700">Affects lower-income earners more; offset by tiered rates</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-semibold text-red-900">✗ U.S. Exception</p>
                  <p className="text-xs text-gray-700">Only developed country without VAT; uses sales tax instead</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-200 mt-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Remember:</strong> VAT is a sophisticated consumption tax system that balances government revenue 
                needs with economic efficiency. While it requires more complex administration than sales tax, its multi-stage 
                collection system provides better fraud prevention and more stable revenue streams. When conducting business 
                internationally, always research the specific VAT/GST requirements in each jurisdiction to ensure compliance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VatCalculatorComponent;
