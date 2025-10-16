import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, DollarSign, Percent, Receipt, MapPin, TrendingUp, Info, Calendar } from 'lucide-react';

// U.S. State Sales Tax Data
const stateTaxRates = [
  { state: "Alabama", baseRate: 4.00, maxRate: 13.50 },
  { state: "Alaska", baseRate: 0.00, maxRate: 7.00 },
  { state: "Arizona", baseRate: 5.60, maxRate: 10.725 },
  { state: "Arkansas", baseRate: 6.50, maxRate: 11.625 },
  { state: "California", baseRate: 7.25, maxRate: 10.50 },
  { state: "Colorado", baseRate: 2.90, maxRate: 10.00 },
  { state: "Connecticut", baseRate: 6.35, maxRate: 6.35 },
  { state: "Delaware", baseRate: 0.00, maxRate: 0.00 },
  { state: "District of Columbia", baseRate: 6.00, maxRate: 6.00 },
  { state: "Florida", baseRate: 6.00, maxRate: 7.50 },
  { state: "Georgia", baseRate: 4.00, maxRate: 8.00 },
  { state: "Guam", baseRate: 4.00, maxRate: 4.00 },
  { state: "Hawaii", baseRate: 4.166, maxRate: 4.712 },
  { state: "Idaho", baseRate: 6.00, maxRate: 8.50 },
  { state: "Illinois", baseRate: 6.25, maxRate: 10.25 },
  { state: "Indiana", baseRate: 7.00, maxRate: 7.00 },
  { state: "Iowa", baseRate: 6.00, maxRate: 7.00 },
  { state: "Kansas", baseRate: 6.50, maxRate: 11.60 },
  { state: "Kentucky", baseRate: 6.00, maxRate: 6.00 },
  { state: "Louisiana", baseRate: 4.45, maxRate: 11.45 },
  { state: "Maine", baseRate: 5.50, maxRate: 5.50 },
  { state: "Maryland", baseRate: 6.00, maxRate: 6.00 },
  { state: "Massachusetts", baseRate: 6.25, maxRate: 6.25 },
  { state: "Michigan", baseRate: 6.00, maxRate: 6.00 },
  { state: "Minnesota", baseRate: 6.875, maxRate: 7.875 },
  { state: "Mississippi", baseRate: 7.00, maxRate: 7.25 },
  { state: "Missouri", baseRate: 4.225, maxRate: 10.85 },
  { state: "Montana", baseRate: 0.00, maxRate: 0.00 },
  { state: "Nebraska", baseRate: 5.50, maxRate: 7.50 },
  { state: "Nevada", baseRate: 6.85, maxRate: 8.375 },
  { state: "New Hampshire", baseRate: 0.00, maxRate: 0.00 },
  { state: "New Jersey", baseRate: 6.625, maxRate: 12.625 },
  { state: "New Mexico", baseRate: 5.125, maxRate: 8.688 },
  { state: "New York", baseRate: 4.00, maxRate: 8.875 },
  { state: "North Carolina", baseRate: 4.75, maxRate: 7.50 },
  { state: "North Dakota", baseRate: 5.00, maxRate: 8.00 },
  { state: "Ohio", baseRate: 5.75, maxRate: 8.00 },
  { state: "Oklahoma", baseRate: 4.50, maxRate: 11.00 },
  { state: "Oregon", baseRate: 0.00, maxRate: 0.00 },
  { state: "Pennsylvania", baseRate: 6.00, maxRate: 8.00 },
  { state: "Puerto Rico", baseRate: 10.50, maxRate: 11.50 },
  { state: "Rhode Island", baseRate: 7.00, maxRate: 7.00 },
  { state: "South Carolina", baseRate: 6.00, maxRate: 9.00 },
  { state: "South Dakota", baseRate: 4.00, maxRate: 6.00 },
  { state: "Tennessee", baseRate: 7.00, maxRate: 9.75 },
  { state: "Texas", baseRate: 6.25, maxRate: 8.25 },
  { state: "Utah", baseRate: 6.10, maxRate: 8.35 },
  { state: "Vermont", baseRate: 6.00, maxRate: 7.00 },
  { state: "Virginia", baseRate: 5.30, maxRate: 7.00 },
  { state: "Washington", baseRate: 6.50, maxRate: 10.60 },
  { state: "West Virginia", baseRate: 6.00, maxRate: 7.00 },
  { state: "Wisconsin", baseRate: 5.00, maxRate: 6.90 },
  { state: "Wyoming", baseRate: 4.00, maxRate: 6.00 },
];

const SalesTaxCalculator = () => {
  // Calculation mode
  const [calculateMode, setCalculateMode] = useState<'afterTax' | 'beforeTax' | 'taxRate'>('afterTax');
  
  // Input states
  const [beforeTaxPrice, setBeforeTaxPrice] = useState<string>('100');
  const [salesTaxRate, setSalesTaxRate] = useState<string>('6.5');
  const [afterTaxPrice, setAfterTaxPrice] = useState<string>('');
  
  // Results
  const [salesTaxAmount, setSalesTaxAmount] = useState<number>(0);
  const [calculatedValue, setCalculatedValue] = useState<number>(0);
  
  // State selector for quick reference
  const [selectedState, setSelectedState] = useState<string>('');

  // Calculate based on mode
  useEffect(() => {
    const beforeTax = parseFloat(beforeTaxPrice) || 0;
    const taxRate = parseFloat(salesTaxRate) || 0;
    const afterTax = parseFloat(afterTaxPrice) || 0;

    if (calculateMode === 'afterTax') {
      // Calculate After Tax Price (given before tax price and tax rate)
      if (beforeTax > 0 && taxRate >= 0) {
        const taxAmount = beforeTax * (taxRate / 100);
        const total = beforeTax + taxAmount;
        setSalesTaxAmount(taxAmount);
        setCalculatedValue(total);
      } else {
        setSalesTaxAmount(0);
        setCalculatedValue(0);
      }
    } else if (calculateMode === 'beforeTax') {
      // Calculate Before Tax Price (given after tax price and tax rate)
      if (afterTax > 0 && taxRate >= 0) {
        const beforeTaxCalc = afterTax / (1 + taxRate / 100);
        const taxAmount = afterTax - beforeTaxCalc;
        setSalesTaxAmount(taxAmount);
        setCalculatedValue(beforeTaxCalc);
      } else {
        setSalesTaxAmount(0);
        setCalculatedValue(0);
      }
    } else if (calculateMode === 'taxRate') {
      // Calculate Tax Rate (given before tax and after tax prices)
      if (beforeTax > 0 && afterTax > 0 && afterTax > beforeTax) {
        const taxAmount = afterTax - beforeTax;
        const taxRateCalc = (taxAmount / beforeTax) * 100;
        setSalesTaxAmount(taxAmount);
        setCalculatedValue(taxRateCalc);
      } else {
        setSalesTaxAmount(0);
        setCalculatedValue(0);
      }
    }
  }, [beforeTaxPrice, salesTaxRate, afterTaxPrice, calculateMode]);

  // Handle state selection
  const handleStateSelection = (state: string) => {
    setSelectedState(state);
    const stateData = stateTaxRates.find(s => s.state === state);
    if (stateData) {
      setSalesTaxRate(stateData.baseRate.toString());
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }).format(value);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Receipt className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Sales Tax Calculator</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Calculate any one of the following: before-tax price, sales tax rate, or after-tax price. Simply enter any two values and get the third instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Calculator Mode Selection */}
        <div className="lg:col-span-1 space-y-6">
          {/* Calculation Mode Selector */}
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Calculator className="w-5 h-5" />
                Calculate
              </CardTitle>
              <CardDescription>Choose what to calculate</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <button
                  onClick={() => setCalculateMode('afterTax')}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    calculateMode === 'afterTax'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      calculateMode === 'afterTax' ? 'border-blue-500' : 'border-gray-300'
                    }`}>
                      {calculateMode === 'afterTax' && <div className="w-3 h-3 bg-blue-500 rounded-full" />}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">After-Tax Price</p>
                      <p className="text-xs text-gray-600">Given: before-tax + rate</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setCalculateMode('beforeTax')}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    calculateMode === 'beforeTax'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      calculateMode === 'beforeTax' ? 'border-blue-500' : 'border-gray-300'
                    }`}>
                      {calculateMode === 'beforeTax' && <div className="w-3 h-3 bg-blue-500 rounded-full" />}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Before-Tax Price</p>
                      <p className="text-xs text-gray-600">Given: after-tax + rate</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setCalculateMode('taxRate')}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    calculateMode === 'taxRate'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      calculateMode === 'taxRate' ? 'border-blue-500' : 'border-gray-300'
                    }`}>
                      {calculateMode === 'taxRate' && <div className="w-3 h-3 bg-blue-500 rounded-full" />}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Sales Tax Rate</p>
                      <p className="text-xs text-gray-600">Given: before + after tax</p>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Input Form */}
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <DollarSign className="w-5 h-5" />
                Input Values
              </CardTitle>
              <CardDescription>Enter two known values</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Before Tax Price */}
              <div className="space-y-2">
                <Label 
                  htmlFor="beforeTaxPrice" 
                  className={`text-sm font-semibold flex items-center gap-2 ${
                    calculateMode === 'beforeTax' ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  Before Tax Price
                  {calculateMode === 'beforeTax' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Calculating</span>
                  )}
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="beforeTaxPrice"
                    type="number"
                    value={beforeTaxPrice}
                    onChange={(e) => setBeforeTaxPrice(e.target.value)}
                    className="pl-10"
                    placeholder="100"
                    disabled={calculateMode === 'beforeTax'}
                  />
                </div>
              </div>

              {/* Sales Tax Rate */}
              <div className="space-y-2">
                <Label 
                  htmlFor="salesTaxRate" 
                  className={`text-sm font-semibold flex items-center gap-2 ${
                    calculateMode === 'taxRate' ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  Sales Tax Rate
                  {calculateMode === 'taxRate' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Calculating</span>
                  )}
                </Label>
                <div className="relative">
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="salesTaxRate"
                    type="number"
                    value={salesTaxRate}
                    onChange={(e) => setSalesTaxRate(e.target.value)}
                    className="pr-10"
                    placeholder="6.5"
                    step="0.1"
                    disabled={calculateMode === 'taxRate'}
                  />
                </div>
              </div>

              {/* After Tax Price */}
              <div className="space-y-2">
                <Label 
                  htmlFor="afterTaxPrice" 
                  className={`text-sm font-semibold flex items-center gap-2 ${
                    calculateMode === 'afterTax' ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  After Tax Price
                  {calculateMode === 'afterTax' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Calculating</span>
                  )}
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="afterTaxPrice"
                    type="number"
                    value={afterTaxPrice}
                    onChange={(e) => setAfterTaxPrice(e.target.value)}
                    className="pl-10"
                    placeholder="106.50"
                    disabled={calculateMode === 'afterTax'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <TrendingUp className="w-5 h-5" />
                Results
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {calculateMode === 'afterTax' && (
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="text-sm text-gray-600 mb-1">After-Tax Price</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(calculatedValue)}
                  </div>
                </div>
              )}

              {calculateMode === 'beforeTax' && (
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="text-sm text-gray-600 mb-1">Before-Tax Price</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(calculatedValue)}
                  </div>
                </div>
              )}

              {calculateMode === 'taxRate' && (
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="text-sm text-gray-600 mb-1">Sales Tax Rate</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPercent(calculatedValue)}%
                  </div>
                </div>
              )}

              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div className="text-sm text-gray-600 mb-1">Sales Tax Amount</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(salesTaxAmount)}
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-3 font-semibold">BREAKDOWN</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Before Tax:</span>
                    <span className="font-semibold text-gray-900">
                      {calculateMode === 'beforeTax' 
                        ? formatCurrency(calculatedValue)
                        : formatCurrency(parseFloat(beforeTaxPrice) || 0)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tax ({
                      calculateMode === 'taxRate'
                        ? formatPercent(calculatedValue)
                        : formatPercent(parseFloat(salesTaxRate) || 0)
                    }%):</span>
                    <span className="font-semibold text-green-600">
                      +{formatCurrency(salesTaxAmount)}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 flex justify-between items-center">
                    <span className="text-gray-900 font-semibold">After Tax:</span>
                    <span className="font-bold text-gray-900 text-lg">
                      {calculateMode === 'afterTax'
                        ? formatCurrency(calculatedValue)
                        : formatCurrency(parseFloat(afterTaxPrice) || 0)
                      }
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - State Tax Rates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick State Selector */}
          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <MapPin className="w-5 h-5" />
                U.S. State Tax Rates Quick Reference
              </CardTitle>
              <CardDescription>Select your state to auto-fill the tax rate</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-4">
                <Label htmlFor="stateSelector" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Select State
                </Label>
                <Select value={selectedState} onValueChange={handleStateSelection}>
                  <SelectTrigger id="stateSelector">
                    <SelectValue placeholder="Choose a state..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {stateTaxRates.map((state) => (
                      <SelectItem key={state.state} value={state.state}>
                        {state.state} - {state.baseRate}% (up to {state.maxRate}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedState && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-orange-900 mb-1">{selectedState}</p>
                      <p className="text-sm text-gray-700">
                        State base rate: <span className="font-semibold">{stateTaxRates.find(s => s.state === selectedState)?.baseRate}%</span>
                        {' '}• Maximum with local taxes: <span className="font-semibold">{stateTaxRates.find(s => s.state === selectedState)?.maxRate}%</span>
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        Note: Actual rate may vary by city/county. The calculator now uses the base state rate.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* State Tax Rates Table */}
          <Card className="border-cyan-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b border-cyan-200">
              <CardTitle className="text-cyan-900">Complete State Tax Rates</CardTitle>
              <CardDescription>All U.S. states, territories, and tax-free states</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4 h-auto">
                  <TabsTrigger value="all" className="text-xs sm:text-sm px-2 py-2">All States</TabsTrigger>
                  <TabsTrigger value="highest" className="text-xs sm:text-sm px-2 py-2">Highest Rates</TabsTrigger>
                  <TabsTrigger value="taxfree" className="text-xs sm:text-sm px-2 py-2">Tax-Free</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4">
                  <div className="max-h-[500px] overflow-y-auto border rounded-lg">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr className="border-b">
                          <th className="text-left p-2 sm:p-3 font-semibold text-gray-700 w-[45%]">State</th>
                          <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 w-[25%]">
                            <div className="flex flex-col items-end">
                              <span>Base</span>
                              <span className="hidden sm:inline">Rate</span>
                            </div>
                          </th>
                          <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 w-[30%]">
                            <div className="flex flex-col items-end">
                              <span>Max Rate</span>
                              <span className="text-[10px] sm:text-xs font-normal text-gray-600">(w/ local)</span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stateTaxRates.map((state, index) => (
                          <tr 
                            key={index} 
                            className={`border-b hover:bg-gray-50 cursor-pointer ${
                              state.baseRate === 0 ? 'bg-green-50' : ''
                            }`}
                            onClick={() => handleStateSelection(state.state)}
                          >
                            <td className="p-2 sm:p-3 text-gray-900 font-medium">{state.state}</td>
                            <td className="p-2 sm:p-3 text-right text-blue-600 font-semibold">
                              {state.baseRate === 0 ? 'No Tax' : `${state.baseRate}%`}
                            </td>
                            <td className="p-2 sm:p-3 text-right text-gray-700">
                              {state.maxRate === 0 ? 'No Tax' : `${state.maxRate}%`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="highest" className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-red-900">Highest Tax States:</span> These states have the highest combined state and local sales tax rates in the U.S.
                    </p>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr className="border-b">
                          <th className="text-left p-2 sm:p-3 font-semibold text-gray-700 w-[20%]">Rank</th>
                          <th className="text-left p-2 sm:p-3 font-semibold text-gray-700 w-[50%]">State</th>
                          <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 w-[30%]">
                            <div className="flex flex-col items-end">
                              <span>Max</span>
                              <span className="hidden sm:inline">Combined</span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stateTaxRates
                          .sort((a, b) => b.maxRate - a.maxRate)
                          .slice(0, 15)
                          .map((state, index) => (
                            <tr 
                              key={index} 
                              className="border-b hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleStateSelection(state.state)}
                            >
                              <td className="p-2 sm:p-3 text-gray-600 font-medium">#{index + 1}</td>
                              <td className="p-2 sm:p-3 text-gray-900 font-medium">{state.state}</td>
                              <td className="p-2 sm:p-3 text-right text-red-600 font-bold text-sm sm:text-base">
                                {state.maxRate}%
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="taxfree" className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-green-900">Tax-Free States:</span> These five states do not impose a statewide sales tax, though some may have local taxes.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {stateTaxRates
                      .filter(state => state.baseRate === 0)
                      .map((state, index) => (
                        <div 
                          key={index}
                          className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300 cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => handleStateSelection(state.state)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-green-900 text-lg mb-1">{state.state}</h4>
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">State Tax:</span> 0%
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">Max Local:</span> {state.maxRate === 0 ? '0%' : `${state.maxRate}%`}
                              </p>
                            </div>
                            <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                              TAX FREE
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-700">
                      <span className="font-semibold">Note:</span> Alaska, Delaware, Montana, New Hampshire, and Oregon have no state sales tax. However, Alaska allows local sales taxes, which can reach up to 7%.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-12 space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Understanding Sales Tax</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Everything you need to know about sales tax, how it works, and how it affects your purchases
          </p>
        </div>

        {/* What is Sales Tax */}
        <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              What is Sales Tax?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Sales tax is a <span className="font-semibold">consumption tax</span> imposed by governments on the sale of goods and services. Unlike income tax which is based on what you earn, sales tax is based on what you spend. When you purchase an item, the vendor collects the sales tax from you at the point of sale and then remits it to the government.
            </p>
            <div className="bg-blue-50 p-5 rounded-lg border-2 border-blue-200">
              <h4 className="font-bold text-blue-900 mb-3 text-lg">How Sales Tax Works:</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-semibold text-blue-900">You shop for an item</p>
                    <p className="text-sm text-gray-700">You find a $100 item you want to purchase</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-semibold text-blue-900">Sales tax is calculated</p>
                    <p className="text-sm text-gray-700">At 6.5% tax rate: $100 × 6.5% = $6.50 sales tax</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-semibold text-blue-900">You pay the total</p>
                    <p className="text-sm text-gray-700">You pay $106.50 ($100 item + $6.50 tax)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                  <div>
                    <p className="font-semibold text-blue-900">Vendor remits to government</p>
                    <p className="text-sm text-gray-700">The store sends the $6.50 tax collected to the state/local government</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-300">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  🌍 International Perspective
                </h4>
                <p className="text-sm text-gray-700">
                  While the U.S. calls it "sales tax," over 160 countries use similar consumption taxes called <span className="font-semibold">Value-Added Tax (VAT)</span> or <span className="font-semibold">Goods and Services Tax (GST)</span>. These work differently but serve the same purpose: taxing consumption.
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-300">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  💰 Revenue Importance
                </h4>
                <p className="text-sm text-gray-700">
                  Sales tax generates nearly <span className="font-semibold">one-third of all state government revenue</span> in the U.S., making it the second-largest source of state income after income tax. It funds schools, roads, police, and public services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* U.S. Sales Tax System */}
        <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
            <CardTitle className="text-green-900 flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              How U.S. Sales Tax Works
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              The United States has a unique sales tax system that differs significantly from most other countries. There is <span className="font-semibold">no federal sales tax</span>, and each state (and even cities and counties) can set their own rates and rules, creating a complex patchwork of over 10,000 different tax jurisdictions nationwide.
            </p>
            <div className="bg-green-50 p-5 rounded-lg border-2 border-green-200">
              <h4 className="font-bold text-green-900 mb-4 text-lg">The Three-Tier Tax Structure:</h4>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border-l-4 border-green-600">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🏛️</div>
                    <div>
                      <p className="font-semibold text-green-900 mb-1">State Sales Tax</p>
                      <p className="text-sm text-gray-700 mb-2">
                        45 states plus DC, Puerto Rico, and Guam impose a state-level sales tax ranging from 2.9% (Colorado) to 10.5% (Puerto Rico). Five states have no state sales tax: Alaska, Delaware, Montana, New Hampshire, and Oregon.
                      </p>
                      <p className="text-xs text-gray-600 italic">Example: California state rate = 7.25%</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-green-600">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🏙️</div>
                    <div>
                      <p className="font-semibold text-green-900 mb-1">County/District Sales Tax</p>
                      <p className="text-sm text-gray-700 mb-2">
                        Counties and special districts (like transit or school districts) can add their own sales taxes on top of the state rate. These typically range from 0.5% to 3% and fund local infrastructure and services.
                      </p>
                      <p className="text-xs text-gray-600 italic">Example: Los Angeles County adds 2.25%</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-green-600">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🏘️</div>
                    <div>
                      <p className="font-semibold text-green-900 mb-1">City/Municipal Sales Tax</p>
                      <p className="text-sm text-gray-700 mb-2">
                        Many cities impose an additional sales tax, usually 0.5% to 2%. This creates situations where the same item costs different amounts just a few miles apart across city boundaries.
                      </p>
                      <p className="text-xs text-gray-600 italic">Example: Some LA cities add 0% to 1%, making total rates 9.5% to 10.5%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-green-100 p-4 rounded-lg border border-green-300">
              <p className="text-gray-800 font-semibold mb-2">Real-World Impact:</p>
              <p className="text-gray-700 text-sm">
                A $20,000 car purchased in Tennessee (combined rate: 9.75%) costs $21,950 after tax. The same car in Oregon (0% sales tax) costs exactly $20,000. That's a <span className="font-semibold text-green-900">$1,950 difference</span> just from sales tax! This is why some people shop across state lines for major purchases.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* State-by-State Variations */}
        <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
            <CardTitle className="text-purple-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              State-by-State Variations and Regional Differences
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Sales tax rates and rules vary dramatically across the United States, creating significant regional differences in the cost of living and government revenue strategies. Understanding these variations can save you money and inform decisions about where to shop or even where to live.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-purple-50 p-5 rounded-lg border-2 border-purple-200">
                <h4 className="font-bold text-purple-900 mb-3 text-lg flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Revenue Dependence by Region
                </h4>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border border-purple-300">
                    <p className="font-semibold text-purple-900 mb-1">South & West (High Dependence)</p>
                    <p className="text-sm text-gray-700 mb-2">States like Tennessee, Texas, Florida, and Washington generate 50-60% of their revenue from sales tax.</p>
                    <p className="text-xs text-gray-600"><span className="font-semibold">Why:</span> No state income tax, so they rely heavily on sales tax instead</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-purple-300">
                    <p className="font-semibold text-purple-900 mb-1">Northeast & Midwest (Low Dependence)</p>
                    <p className="text-sm text-gray-700 mb-2">States like New York, Massachusetts, and Ohio only get 20-30% of revenue from sales tax.</p>
                    <p className="text-xs text-gray-600"><span className="font-semibold">Why:</span> They have high income and property taxes, reducing reliance on sales tax</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 p-5 rounded-lg border-2 border-purple-200">
                <h4 className="font-bold text-purple-900 mb-3 text-lg flex items-center gap-2">
                  <span className="text-2xl">🗺️</span>
                  Geographic Tax Strategies
                </h4>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border border-purple-300">
                    <p className="font-semibold text-purple-900 mb-1">Border Shopping Phenomenon</p>
                    <p className="text-sm text-gray-700">People living near state borders often cross state lines for major purchases to avoid high sales tax, especially for cars, appliances, and electronics.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-purple-300">
                    <p className="font-semibold text-purple-900 mb-1">Tourist-Heavy States</p>
                    <p className="text-sm text-gray-700">Florida and Nevada have high sales taxes partly because tourists pay a large share, effectively "exporting" their tax burden to out-of-state visitors.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-5 rounded-lg border-2 border-purple-200">
              <h4 className="font-bold text-purple-900 mb-4 text-lg">Extreme Examples and Notable Cases:</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border-2 border-red-300">
                  <p className="font-bold text-red-900 mb-2">🔴 Highest Combined Rate</p>
                  <p className="text-2xl font-bold text-red-700 mb-1">13.50%</p>
                  <p className="text-sm text-gray-700">Alabama (some localities)</p>
                  <p className="text-xs text-gray-600 mt-2">A $100 item costs $113.50!</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-300">
                  <p className="font-bold text-green-900 mb-2">🟢 Tax-Free States</p>
                  <p className="text-2xl font-bold text-green-700 mb-1">0.00%</p>
                  <p className="text-sm text-gray-700">Oregon, Delaware, Montana, NH</p>
                  <p className="text-xs text-gray-600 mt-2">A $100 item costs exactly $100</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-300">
                  <p className="font-bold text-blue-900 mb-2">🔵 Average U.S. Rate</p>
                  <p className="text-2xl font-bold text-blue-700 mb-1">~7.12%</p>
                  <p className="text-sm text-gray-700">Combined state + local average</p>
                  <p className="text-xs text-gray-600 mt-2">A $100 item costs ~$107.12</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Taxed and What's Not */}
        <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
            <CardTitle className="text-orange-900 flex items-center gap-2">
              <Info className="w-6 h-6" />
              What Gets Taxed (and What Doesn't)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Not all purchases are subject to sales tax, and the rules vary dramatically by state. Understanding these exemptions can save you significant money and help you plan major purchases strategically.
            </p>
            <div className="space-y-4">
              <div className="bg-orange-50 p-5 rounded-lg border-2 border-orange-200">
                <h4 className="font-bold text-orange-900 mb-4 text-lg">Common Sales Tax Exemptions:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🍞</span>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Groceries & Food</p>
                          <p className="text-sm text-gray-700">Most states don't tax unprepared groceries. However, prepared food, candy, and soda are often taxed.</p>
                          <p className="text-xs text-green-700 mt-2"><span className="font-semibold">37 states</span> exempt basic groceries</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">💊</span>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Prescription Medications</p>
                          <p className="text-sm text-gray-700">Nearly all states exempt prescription drugs from sales tax to keep healthcare affordable.</p>
                          <p className="text-xs text-green-700 mt-2"><span className="font-semibold">45 states</span> exempt prescriptions</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">👕</span>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Clothing (Select States)</p>
                          <p className="text-sm text-gray-700">Some states don't tax clothing at all, while others only exempt items under a certain price.</p>
                          <p className="text-xs text-green-700 mt-2"><span className="font-semibold">Examples:</span> Pennsylvania, New Jersey, Minnesota exempt clothing</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🍺</span>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Alcohol (Often Higher Tax)</p>
                          <p className="text-sm text-gray-700">Some states add extra "sin tax" on top of regular sales tax for alcoholic beverages.</p>
                          <p className="text-xs text-red-700 mt-2"><span className="font-semibold">Vermont:</span> 10% extra on alcohol for immediate consumption</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">💻</span>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Digital Goods & Services</p>
                          <p className="text-sm text-gray-700">Rules vary widely: some states tax digital downloads, streaming services, and cloud software; others don't.</p>
                          <p className="text-xs text-blue-700 mt-2"><span className="font-semibold">Evolving area:</span> States are increasingly taxing digital services</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🏢</span>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Business-to-Business (B2B)</p>
                          <p className="text-sm text-gray-700">Most B2B transactions are exempt if the buyer will resell the goods or use them in manufacturing.</p>
                          <p className="text-xs text-blue-700 mt-2"><span className="font-semibold">Resale certificates</span> exempt businesses from sales tax</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-orange-100 p-4 rounded-lg border border-orange-300">
                <p className="text-gray-800 font-semibold mb-3">Quirky State-Specific Exemptions:</p>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <p className="text-gray-700"><span className="font-semibold">Texas:</span> Prescription medicine and food seeds are tax-exempt</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <p className="text-gray-700"><span className="font-semibold">New York:</span> Bagels are tax-free unless sliced (then they're "prepared food")</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <p className="text-gray-700"><span className="font-semibold">Pennsylvania:</span> Most clothing and footwear are completely tax-exempt</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <p className="text-gray-700"><span className="font-semibold">Florida:</span> Back-to-school tax holidays waive tax on clothing, school supplies, and computers</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historical Context */}
        <Card className="border-l-4 border-l-red-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100">
            <CardTitle className="text-red-900 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              The History of Sales Tax in America
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              The history of sales tax in America is intertwined with revolution, economic crisis, and the evolution of federal-state relations. Understanding this history explains why the U.S. has such a fragmented tax system compared to other countries.
            </p>
            <div className="space-y-4">
              <div className="bg-red-50 p-5 rounded-lg border-2 border-red-200">
                <h4 className="font-bold text-red-900 mb-4 text-lg flex items-center gap-2">
                  <span className="text-2xl">🇺🇸</span>
                  From Revolution to Modern System
                </h4>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border-l-4 border-red-600">
                    <div className="flex items-start gap-3">
                      <div className="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-sm font-bold flex-shrink-0">1773</div>
                      <div>
                        <p className="font-semibold text-red-900 mb-2">The Boston Tea Party</p>
                        <p className="text-sm text-gray-700">
                          British King George III imposed sales taxes on American colonists without giving them representation in Parliament. The colonists' response—dumping tea into Boston Harbor to protest these taxes—was a pivotal event leading to the American Revolution. This is why "taxation without representation" became a rallying cry.
                        </p>
                        <p className="text-xs text-red-700 mt-2 font-semibold">Legacy: Americans' historical distrust of centralized taxation authority</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-l-4 border-red-600">
                    <div className="flex items-start gap-3">
                      <div className="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-sm font-bold flex-shrink-0">1789-1920s</div>
                      <div>
                        <p className="font-semibold text-red-900 mb-2">No Sales Tax Era</p>
                        <p className="text-sm text-gray-700">
                          For over 140 years after independence, the United States had no sales tax at any level of government. States relied primarily on property taxes and tariffs. Various attempts to introduce sales taxes were met with fierce resistance and political backlash, as Americans associated sales taxes with colonial oppression.
                        </p>
                        <p className="text-xs text-red-700 mt-2 font-semibold">Why it matters: This explains why there's no federal sales tax today</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-l-4 border-red-600">
                    <div className="flex items-start gap-3">
                      <div className="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-sm font-bold flex-shrink-0">1930</div>
                      <div>
                        <p className="font-semibold text-red-900 mb-2">The Great Depression Changes Everything</p>
                        <p className="text-sm text-gray-700">
                          When the Great Depression devastated the economy, state governments desperately needed revenue as property values plummeted and property tax collections collapsed. Mississippi became the first state to adopt a general sales tax in 1930. The model proved so successful at raising revenue that within 10 years, 18 more states had followed.
                        </p>
                        <p className="text-xs text-red-700 mt-2 font-semibold">Turning point: Economic necessity overcame 150+ years of resistance</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-l-4 border-red-600">
                    <div className="flex items-start gap-3">
                      <div className="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-sm font-bold flex-shrink-0">1930s-1960s</div>
                      <div>
                        <p className="font-semibold text-red-900 mb-2">Rapid Nationwide Adoption</p>
                        <p className="text-sm text-gray-700">
                          By 1969, 45 states had adopted sales taxes. The tax was politically palatable because it was "voluntary" (you only pay when you buy something), spread across many small purchases rather than one big bill, and could be raised gradually without much public notice. Only Alaska, Delaware, Montana, New Hampshire, and Oregon resisted.
                        </p>
                        <p className="text-xs text-red-700 mt-2 font-semibold">Modern result: 45 states with sales tax, but rates and rules vary wildly</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-l-4 border-red-600">
                    <div className="flex items-start gap-3">
                      <div className="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-sm font-bold flex-shrink-0">2018</div>
                      <div>
                        <p className="font-semibold text-red-900 mb-2">Internet Sales Tax Revolution</p>
                        <p className="text-sm text-gray-700">
                          The Supreme Court's <span className="font-semibold italic">South Dakota v. Wayfair</span> decision allowed states to require online retailers to collect sales tax even without a physical presence in the state. This reversed decades of tax-free online shopping and added billions in state revenue, but created compliance nightmares for small businesses navigating 10,000+ tax jurisdictions.
                        </p>
                        <p className="text-xs text-red-700 mt-2 font-semibold">Impact: Your Amazon purchases now include sales tax in most states</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-red-100 p-4 rounded-lg border border-red-300">
                <p className="text-gray-800 font-semibold mb-2">Why No Federal Sales Tax?</p>
                <p className="text-gray-700 text-sm">
                  The historical trauma of "taxation without representation" that sparked the American Revolution created a lasting cultural resistance to centralized taxation. This is why the U.S. Constitution doesn't explicitly authorize a federal sales tax, and why attempts to create a national VAT system have always failed. Instead, we have 50+ different state systems—a uniquely American approach born from our revolutionary history.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VAT vs Sales Tax */}
        <Card className="border-l-4 border-l-cyan-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100">
            <CardTitle className="text-cyan-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Sales Tax vs. VAT vs. GST: Global Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              While the U.S. uses sales tax, most of the world uses Value-Added Tax (VAT) or Goods and Services Tax (GST). Though they all tax consumption, how they work is fundamentally different—and understanding these differences explains why American prices don't include tax while foreign prices do.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-cyan-50 p-5 rounded-lg border-2 border-cyan-300">
                <div className="bg-cyan-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block">U.S. SYSTEM</div>
                <h4 className="font-bold text-cyan-900 mb-3 text-lg">Sales Tax</h4>
                <div className="space-y-3 text-sm">
                  <div className="bg-white p-3 rounded border border-cyan-200">
                    <p className="font-semibold text-cyan-900 mb-1">How It Works:</p>
                    <p className="text-gray-700">Tax is collected only at the final point of sale to the consumer. Businesses don't pay sales tax on inputs.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-cyan-200">
                    <p className="font-semibold text-cyan-900 mb-1">Price Display:</p>
                    <p className="text-gray-700">Prices shown <span className="font-bold">exclude tax</span>. Tax is added at checkout. A $100 item might cost $106.50 total.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-cyan-200">
                    <p className="font-semibold text-cyan-900 mb-1">Who Pays:</p>
                    <p className="text-gray-700">Only end consumers pay. B2B transactions are typically exempt.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-cyan-200">
                    <p className="font-semibold text-cyan-900 mb-1">Tax Evasion:</p>
                    <p className="text-gray-700">Easier to evade through cash transactions or under-the-table sales.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-cyan-200">
                    <p className="font-semibold text-cyan-900 mb-1">Used In:</p>
                    <p className="text-gray-700">United States (45 states)</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-5 rounded-lg border-2 border-purple-300">
                <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block">GLOBAL STANDARD</div>
                <h4 className="font-bold text-purple-900 mb-3 text-lg">VAT (Value-Added Tax)</h4>
                <div className="space-y-3 text-sm">
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <p className="font-semibold text-purple-900 mb-1">How It Works:</p>
                    <p className="text-gray-700">Tax is collected at every stage of production/distribution. Each business pays tax on the "value added" at their stage.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <p className="font-semibold text-purple-900 mb-1">Price Display:</p>
                    <p className="text-gray-700">Prices shown <span className="font-bold">include tax</span>. A €100 item costs exactly €100 at checkout (tax already in price).</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <p className="font-semibold text-purple-900 mb-1">Who Pays:</p>
                    <p className="text-gray-700">Everyone in the supply chain pays, but businesses reclaim it. Consumers bear final burden.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <p className="font-semibold text-purple-900 mb-1">Tax Evasion:</p>
                    <p className="text-gray-700">Much harder to evade—every link in chain creates paper trail and cross-checks.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <p className="font-semibold text-purple-900 mb-1">Used In:</p>
                    <p className="text-gray-700">160+ countries: EU, UK, Australia, Canada (federal), most of world</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-5 rounded-lg border-2 border-green-300">
                <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block">HYBRID SYSTEM</div>
                <h4 className="font-bold text-green-900 mb-3 text-lg">GST (Goods & Services Tax)</h4>
                <div className="space-y-3 text-sm">
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="font-semibold text-green-900 mb-1">How It Works:</p>
                    <p className="text-gray-700">Similar to VAT but with different rates for goods vs. services. Multi-tiered system in some countries.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="font-semibold text-green-900 mb-1">Price Display:</p>
                    <p className="text-gray-700">Varies by country. Usually <span className="font-bold">includes tax</span> in listed prices like VAT systems.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="font-semibold text-green-900 mb-1">Who Pays:</p>
                    <p className="text-gray-700">Works like VAT—everyone pays, businesses reclaim, consumers bear burden.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="font-semibold text-green-900 mb-1">Tax Evasion:</p>
                    <p className="text-gray-700">Similar to VAT—harder to evade than sales tax due to multi-stage collection.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="font-semibold text-green-900 mb-1">Used In:</p>
                    <p className="text-gray-700">India, Canada (provincial), Singapore, Malaysia, New Zealand</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-cyan-100 p-5 rounded-lg border-2 border-cyan-300">
              <h4 className="font-semibold text-cyan-900 mb-3 text-lg">Real-World Example: Buying a $100 / €100 / ₹100 Item</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="font-bold text-blue-900 mb-2">🇺🇸 United States (Sales Tax)</p>
                  <p className="text-gray-700 mb-1">Store shelf: <span className="font-semibold">$100</span></p>
                  <p className="text-gray-700 mb-1">At checkout: <span className="font-semibold">$106.50</span> (with 6.5% tax)</p>
                  <p className="text-xs text-gray-600 italic mt-2">Surprise! Price increased at register</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                  <p className="font-bold text-purple-900 mb-2">🇪🇺 European Union (VAT)</p>
                  <p className="text-gray-700 mb-1">Store shelf: <span className="font-semibold">€100</span> (includes 20% VAT)</p>
                  <p className="text-gray-700 mb-1">At checkout: <span className="font-semibold">€100</span> (no change)</p>
                  <p className="text-xs text-gray-600 italic mt-2">Tax already included, no surprises</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                  <p className="font-bold text-green-900 mb-2">🇮🇳 India (GST)</p>
                  <p className="text-gray-700 mb-1">Store shelf: <span className="font-semibold">₹100</span> (includes 18% GST)</p>
                  <p className="text-gray-700 mb-1">At checkout: <span className="font-semibold">₹100</span> (no change)</p>
                  <p className="text-xs text-gray-600 italic mt-2">Tax included in marked price</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Deductions */}
        <Card className="border-l-4 border-l-indigo-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100">
            <CardTitle className="text-indigo-900 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Deducting Sales Tax on Your Federal Income Tax
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Most people don't know this: <span className="font-semibold">you can deduct sales tax from your federal income tax</span>—but only under specific circumstances and if you choose to itemize deductions instead of taking the standard deduction. For most Americans, this isn't worth the effort, but it can save significant money for those who made major purchases.
            </p>
            <div className="bg-indigo-50 p-5 rounded-lg border-2 border-indigo-200">
              <h4 className="font-bold text-indigo-900 mb-4 text-lg">How Sales Tax Deduction Works:</h4>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-600">
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">1</div>
                    <div>
                      <p className="font-semibold text-indigo-900 mb-2">Choose Itemized Deductions</p>
                      <p className="text-sm text-gray-700 mb-2">
                        When filing federal taxes, you can either take the <span className="font-semibold">standard deduction</span> ($13,850 single / $27,700 married for 2023) or <span className="font-semibold">itemize deductions</span>. Most people take the standard deduction because it's simpler and often larger.
                      </p>
                      <p className="text-xs text-indigo-700">Only itemize if your total deductions exceed the standard deduction</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-600">
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">2</div>
                    <div>
                      <p className="font-semibold text-indigo-900 mb-2">Choose State Income Tax OR Sales Tax (Not Both)</p>
                      <p className="text-sm text-gray-700 mb-2">
                        You can deduct either <span className="font-semibold">state and local income taxes</span> OR <span className="font-semibold">sales taxes</span>, but not both. Most people deduct income tax because it's usually larger. However, if you live in a state with no income tax (Texas, Florida, Washington, Tennessee, etc.) or made major purchases (car, boat, home renovation), sales tax deduction might be better.
                      </p>
                      <p className="text-xs text-indigo-700">Calculate both to see which gives you a larger deduction</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-600">
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">3</div>
                    <div>
                      <p className="font-semibold text-indigo-900 mb-2">Track Your Sales Tax Payments</p>
                      <p className="text-sm text-gray-700 mb-2">
                        Option A: <span className="font-semibold">Keep all receipts</span> for the entire year and add up total sales tax paid (tedious but accurate).
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        Option B: Use the <span className="font-semibold">IRS sales tax tables</span> that estimate your sales tax based on income and state. Then add sales tax from major purchases (vehicles, boats, aircraft, home building materials).
                      </p>
                      <p className="text-xs text-indigo-700">Most people use Option B—much simpler and IRS-approved</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-600">
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">4</div>
                    <div>
                      <p className="font-semibold text-indigo-900 mb-2">Claim the Deduction on Schedule A</p>
                      <p className="text-sm text-gray-700 mb-2">
                        Report your sales tax deduction on IRS Form 1040, Schedule A (Itemized Deductions), line 5a. The deduction reduces your taxable income, potentially saving you hundreds or thousands in federal income tax.
                      </p>
                      <p className="text-xs text-indigo-700">Your actual tax savings = deduction amount × your tax bracket percentage</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">✓</span>
                  When Sales Tax Deduction Makes Sense
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">→</span>
                    <span>You live in a state with no income tax (can't deduct what you don't pay)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">→</span>
                    <span>You bought a car, boat, or RV (sales tax on these is substantial)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">→</span>
                    <span>Major home renovation with building materials purchases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">→</span>
                    <span>Wedding year (venue, catering, rings all subject to sales tax)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">→</span>
                    <span>Live in high sales tax state with low state income tax</span>
                  </li>
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">✗</span>
                  When It Probably Isn't Worth It
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">→</span>
                    <span>Your state income tax is higher than sales tax paid (most cases)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">→</span>
                    <span>Total itemized deductions don't exceed standard deduction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">→</span>
                    <span>You didn't make any major purchases during the year</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">→</span>
                    <span>You don't have receipts and estimating isn't worthwhile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">→</span>
                    <span>The time/effort to itemize exceeds the tax savings</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-indigo-100 p-5 rounded-lg border-2 border-indigo-300">
              <h4 className="font-semibold text-indigo-900 mb-3 text-lg">Real-World Example:</h4>
              <p className="text-gray-700 text-sm mb-3">
                <span className="font-semibold">Scenario:</span> Jessica lives in Texas (no state income tax) and bought a $30,000 car this year. Texas sales tax is 6.25%.
              </p>
              <div className="bg-white p-4 rounded-lg border border-indigo-300">
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700">Car sales tax: $30,000 × 6.25% = <span className="font-semibold text-indigo-900">$1,875</span></p>
                  <p className="text-gray-700">General purchases estimate (IRS table for her income): <span className="font-semibold text-indigo-900">$850</span></p>
                  <p className="text-gray-700 border-t border-gray-300 pt-2 mt-2">Total sales tax deduction: <span className="font-bold text-indigo-900 text-base">$2,725</span></p>
                  <p className="text-gray-700 mt-3">Jessica's tax bracket: 22%</p>
                  <p className="text-green-700 font-bold text-base mt-2">Federal tax savings: $2,725 × 22% = $599.50</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3 italic">
                Because Jessica lives in a no-income-tax state and made a major purchase, claiming the sales tax deduction saved her nearly $600 on her federal taxes!
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
              <p className="text-gray-800 font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                Important: Less Than 2% of Taxpayers Claim This
              </p>
              <p className="text-gray-700 text-sm">
                Despite being available to everyone, fewer than 2% of Americans actually deduct sales tax. Why? Because for most people, state income tax deduction is larger, and the standard deduction is simpler and higher than itemizing. Don't assume you should claim it—do the math first or consult a tax professional.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesTaxCalculator;
