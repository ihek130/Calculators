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
  Car,
  AlertCircle, 
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface LeaseInputs {
  autoPrice: number;
  leaseTerm: number;
  moneyFactor: number;
  downPayment: number;
  tradeInValue: number;
  salesTax: number;
  residualValue: number;
}

interface LeaseResults {
  capitalizedCost: number;
  depreciation: number;
  monthlyDepreciation: number;
  monthlyInterest: number;
  monthlyTax: number;
  monthlyPayment: number;
  totalLeasePayments: number;
  totalCost: number;
  upfrontCost: number;
}

const AutoLeaseCalculatorComponent: React.FC = () => {
  const [inputs, setInputs] = useState<LeaseInputs>({
    autoPrice: 50000,
    leaseTerm: 36,
    moneyFactor: 0.00208,
    downPayment: 10000,
    tradeInValue: 0,
    salesTax: 7,
    residualValue: 24000
  });

  const [results, setResults] = useState<LeaseResults | null>(null);

  useEffect(() => {
    calculateLease();
  }, [
    inputs.autoPrice,
    inputs.leaseTerm,
    inputs.moneyFactor,
    inputs.downPayment,
    inputs.tradeInValue,
    inputs.salesTax,
    inputs.residualValue
  ]);

  const calculateLease = () => {
    if (inputs.autoPrice <= 0 || inputs.leaseTerm <= 0 || inputs.residualValue < 0) {
      return;
    }

    // Step 1: Calculate capitalized cost (auto price - down payment - trade-in)
    const capitalizedCost = inputs.autoPrice - inputs.downPayment - inputs.tradeInValue;

    // Step 2: Calculate depreciation (capitalized cost - residual value)
    const depreciation = capitalizedCost - inputs.residualValue;

    // Step 3: Calculate monthly depreciation
    const monthlyDepreciation = depreciation / inputs.leaseTerm;

    // Step 4: Calculate monthly interest charge
    // Monthly interest = (capitalized cost + residual value) × money factor
    const monthlyInterest = (capitalizedCost + inputs.residualValue) * inputs.moneyFactor;

    // Step 5: Calculate monthly tax
    const monthlyTax = (monthlyDepreciation + monthlyInterest) * (inputs.salesTax / 100);

    // Step 6: Calculate total monthly payment
    const monthlyPayment = monthlyDepreciation + monthlyInterest + monthlyTax;

    // Step 7: Calculate total lease payments
    const totalLeasePayments = monthlyPayment * inputs.leaseTerm;

    // Step 8: Calculate upfront cost (down payment + trade-in value)
    const upfrontCost = inputs.downPayment + inputs.tradeInValue;

    // Step 9: Calculate total cost (upfront + all lease payments)
    const totalCost = upfrontCost + totalLeasePayments;

    setResults({
      capitalizedCost,
      depreciation,
      monthlyDepreciation,
      monthlyInterest,
      monthlyTax,
      monthlyPayment,
      totalLeasePayments,
      totalCost,
      upfrontCost
    });
  };

  const handleInputChange = (field: keyof LeaseInputs, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    setInputs(prev => ({ ...prev, [field]: numValue }));
  };

  const handleReset = () => {
    setInputs({
      autoPrice: 50000,
      leaseTerm: 36,
      moneyFactor: 0.00208,
      downPayment: 10000,
      tradeInValue: 0,
      salesTax: 7,
      residualValue: 24000
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

  // Convert money factor to APR for display
  const moneyFactorToAPR = (mf: number): number => {
    return mf * 2400;
  };

  // Chart data
  const monthlyBreakdownData = results ? [
    { category: 'Depreciation', amount: results.monthlyDepreciation },
    { category: 'Interest', amount: results.monthlyInterest },
    { category: 'Tax', amount: results.monthlyTax }
  ] : [];

  const pieData = results ? [
    { name: 'Monthly Depreciation', value: results.monthlyDepreciation, color: '#3b82f6' },
    { name: 'Monthly Interest', value: results.monthlyInterest, color: '#f59e0b' },
    { name: 'Monthly Tax', value: results.monthlyTax, color: '#ef4444' }
  ] : [];

  const totalCostBreakdown = results ? [
    { category: 'Upfront Cost', amount: results.upfrontCost },
    { category: 'Total Lease Payments', amount: results.totalLeasePayments }
  ] : [];

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg">
            <Car className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Auto Lease Calculator
          </h1>
        </div>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed px-4">
          Calculate monthly lease payments based on auto price, lease term, money factor, and residual value. 
          Compare leasing vs. buying to make an informed decision.
        </p>
      </div>

      {/* Main Calculator Card */}
      <Card className="shadow-xl border-t-4 border-t-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <span className="hidden sm:inline">Lease Calculator Inputs</span>
            <span className="sm:hidden">Calculator</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Modify the values to calculate your monthly lease payment
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Inputs */}
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-5 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                  Lease Details
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="autoPrice" className="text-xs sm:text-sm font-medium">
                      Auto Price ($)
                    </Label>
                    <Input
                      id="autoPrice"
                      type="number"
                      value={inputs.autoPrice || ''}
                      onChange={(e) => handleInputChange('autoPrice', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 50000"
                      step="1000"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leaseTerm" className="text-xs sm:text-sm font-medium">
                      Lease Term (months)
                    </Label>
                    <Input
                      id="leaseTerm"
                      type="number"
                      value={inputs.leaseTerm || ''}
                      onChange={(e) => handleInputChange('leaseTerm', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 36"
                      step="12"
                      min="12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="moneyFactor" className="text-xs sm:text-sm font-medium flex items-center gap-2">
                      Money Factor
                      <span className="text-xs text-gray-500">
                        (APR: {formatPercent(moneyFactorToAPR(inputs.moneyFactor))})
                      </span>
                    </Label>
                    <Input
                      id="moneyFactor"
                      type="number"
                      value={inputs.moneyFactor || ''}
                      onChange={(e) => handleInputChange('moneyFactor', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 0.00208"
                      step="0.00001"
                      min="0"
                    />
                    <p className="text-xs text-gray-500">
                      To convert APR to money factor: APR ÷ 2400
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="downPayment" className="text-xs sm:text-sm font-medium">
                      Down Payment ($)
                    </Label>
                    <Input
                      id="downPayment"
                      type="number"
                      value={inputs.downPayment || ''}
                      onChange={(e) => handleInputChange('downPayment', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 10000"
                      step="1000"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tradeInValue" className="text-xs sm:text-sm font-medium">
                      Trade-in Value ($)
                    </Label>
                    <Input
                      id="tradeInValue"
                      type="number"
                      value={inputs.tradeInValue || ''}
                      onChange={(e) => handleInputChange('tradeInValue', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 0"
                      step="1000"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salesTax" className="text-xs sm:text-sm font-medium">
                      Sales Tax (%)
                    </Label>
                    <Input
                      id="salesTax"
                      type="number"
                      value={inputs.salesTax || ''}
                      onChange={(e) => handleInputChange('salesTax', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 7"
                      step="0.1"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="residualValue" className="text-xs sm:text-sm font-medium">
                      Residual Value ($)
                    </Label>
                    <Input
                      id="residualValue"
                      type="number"
                      value={inputs.residualValue || ''}
                      onChange={(e) => handleInputChange('residualValue', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 24000"
                      step="1000"
                      min="0"
                    />
                    <p className="text-xs text-gray-500">
                      Estimated value at end of lease
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleReset} 
                variant="outline" 
                className="w-full text-xs sm:text-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Calculator
              </Button>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-5">
              {results && (
                <>
                  {/* Monthly Payment Card */}
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-5 sm:p-6 rounded-xl border-2 border-green-300 shadow-lg">
                    <h3 className="font-semibold text-green-900 mb-2 text-sm sm:text-base flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Monthly Lease Payment
                    </h3>
                    <div className="text-3xl sm:text-4xl font-bold text-green-700 mb-2">
                      {formatCurrency(results.monthlyPayment)}
                    </div>
                    <p className="text-xs sm:text-sm text-green-800">
                      For {inputs.leaseTerm} months
                    </p>
                  </div>

                  {/* Lease Breakdown */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-5 rounded-xl border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                      <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
                      Lease Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-blue-200">
                        <span className="text-xs sm:text-sm text-gray-600">Capitalized Cost</span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {formatCurrency(results.capitalizedCost)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-blue-200">
                        <span className="text-xs sm:text-sm text-gray-600">Residual Value</span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {formatCurrency(inputs.residualValue)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-blue-200">
                        <span className="text-xs sm:text-sm text-gray-600">Total Depreciation</span>
                        <span className="text-sm sm:text-base font-semibold text-red-600">
                          {formatCurrency(results.depreciation)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-blue-200">
                        <span className="text-xs sm:text-sm text-gray-600">Monthly Depreciation</span>
                        <span className="text-sm sm:text-base font-semibold text-blue-700">
                          {formatCurrency(results.monthlyDepreciation)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-blue-200">
                        <span className="text-xs sm:text-sm text-gray-600">Monthly Interest</span>
                        <span className="text-sm sm:text-base font-semibold text-orange-700">
                          {formatCurrency(results.monthlyInterest)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-blue-200">
                        <span className="text-xs sm:text-sm text-gray-600">Monthly Tax</span>
                        <span className="text-sm sm:text-base font-semibold text-red-600">
                          {formatCurrency(results.monthlyTax)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Total Cost Summary */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-5 rounded-xl border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                      Total Cost Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-purple-200">
                        <span className="text-xs sm:text-sm text-gray-600">Upfront Cost</span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {formatCurrency(results.upfrontCost)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-purple-200">
                        <span className="text-xs sm:text-sm text-gray-600">
                          Total of {inputs.leaseTerm} Payments
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {formatCurrency(results.totalLeasePayments)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 bg-purple-100 rounded-lg px-3 mt-2">
                        <span className="text-sm sm:text-base font-bold text-purple-900">
                          Total Lease Cost
                        </span>
                        <span className="text-lg sm:text-xl font-bold text-purple-700">
                          {formatCurrency(results.totalCost)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Analysis */}
      {results && (
        <>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                <span className="hidden sm:inline">Monthly Payment Breakdown</span>
                <span className="sm:hidden">Payment Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyBreakdownData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="category" 
                        tick={{ fontSize: 11 }} 
                        angle={-15}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="amount" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        label={({ name, percent }) => `${name.split(' ')[1]}: ${(percent * 100).toFixed(1)}%`}
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
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  <p className="text-xs text-gray-600 mb-1">Depreciation</p>
                  <p className="text-sm sm:text-base font-bold text-blue-700">
                    {formatCurrency(results.monthlyDepreciation)}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-center">
                  <p className="text-xs text-gray-600 mb-1">Interest</p>
                  <p className="text-sm sm:text-base font-bold text-orange-700">
                    {formatCurrency(results.monthlyInterest)}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-center">
                  <p className="text-xs text-gray-600 mb-1">Tax</p>
                  <p className="text-sm sm:text-base font-bold text-red-700">
                    {formatCurrency(results.monthlyTax)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                  <p className="text-xs text-gray-600 mb-1">Total Monthly</p>
                  <p className="text-sm sm:text-base font-bold text-green-700">
                    {formatCurrency(results.monthlyPayment)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Cost Visualization */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                <span className="hidden sm:inline">Total Lease Cost Breakdown</span>
                <span className="sm:hidden">Total Cost</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={totalCostBreakdown} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Upfront Payment</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-700">
                    {formatCurrency(results.upfrontCost)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Down payment + Trade-in
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 text-center">
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">All Lease Payments</p>
                  <p className="text-lg sm:text-xl font-bold text-purple-700">
                    {formatCurrency(results.totalLeasePayments)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {inputs.leaseTerm} months × {formatCurrency(results.monthlyPayment)}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg border-2 border-indigo-300 text-center">
                  <p className="text-xs sm:text-sm text-gray-700 mb-2 font-semibold">Total Lease Cost</p>
                  <p className="text-xl sm:text-2xl font-bold text-indigo-700">
                    {formatCurrency(results.totalCost)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Complete lease investment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Information Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <h4 className="font-semibold text-amber-900 text-sm">Residual Value</h4>
              </div>
              <p className="text-xs sm:text-sm text-gray-700">
                At lease end, you can purchase the vehicle for {formatCurrency(inputs.residualValue)} 
                or return it to the dealer.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900 text-sm">Lease Term</h4>
              </div>
              <p className="text-xs sm:text-sm text-gray-700">
                Your lease is for {inputs.leaseTerm} months ({(inputs.leaseTerm / 12).toFixed(1)} years). 
                Most leases are 24-48 months.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-900 text-sm">Money Factor</h4>
              </div>
              <p className="text-xs sm:text-sm text-gray-700">
                Your money factor of {inputs.moneyFactor.toFixed(5)} equals an APR of{' '}
                {formatPercent(moneyFactorToAPR(inputs.moneyFactor))}.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Educational Content */}
      <div className="mt-12 space-y-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Complete Guide to Auto Leasing
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            Understanding how auto leases work, the key variables that affect your payment, 
            and what to consider before signing a lease agreement.
          </p>
        </div>

        {/* What is an Auto Lease */}
        <Card className="border-l-4 border-l-blue-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-blue-900">
              <Car className="h-6 w-6" />
              What is an Auto Lease?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <p>
                An <strong>auto lease</strong> is a financing agreement where you essentially rent a vehicle 
                from a dealership or leasing company for a predetermined period, typically 24 to 48 months. 
                Unlike purchasing a car with a loan, you don't own the vehicle at the end of the lease term 
                unless you choose to buy it for the predetermined residual value.
              </p>
              <p>
                Think of it as a long-term car rental with specific terms, mileage limits, and maintenance 
                requirements. At the end of the lease, you return the vehicle to the dealer and can either 
                walk away, lease a new vehicle, or purchase the leased vehicle for its residual value.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Lease vs. Purchase: Key Differences
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-blue-200">
                        <th className="text-left py-2 pr-4">Aspect</th>
                        <th className="text-left py-2 pr-4">Leasing</th>
                        <th className="text-left py-2">Buying</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      <tr className="border-b border-blue-100">
                        <td className="py-2 pr-4 font-medium">Ownership</td>
                        <td className="py-2 pr-4">Dealer retains ownership</td>
                        <td className="py-2">You own the vehicle</td>
                      </tr>
                      <tr className="border-b border-blue-100">
                        <td className="py-2 pr-4 font-medium">Monthly Payments</td>
                        <td className="py-2 pr-4">Lower (pay for depreciation only)</td>
                        <td className="py-2">Higher (pay full value + interest)</td>
                      </tr>
                      <tr className="border-b border-blue-100">
                        <td className="py-2 pr-4 font-medium">Mileage Limits</td>
                        <td className="py-2 pr-4">10,000-15,000 miles/year typically</td>
                        <td className="py-2">No restrictions</td>
                      </tr>
                      <tr className="border-b border-blue-100">
                        <td className="py-2 pr-4 font-medium">Customization</td>
                        <td className="py-2 pr-4">Not allowed</td>
                        <td className="py-2">Full freedom to modify</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-medium">End of Term</td>
                        <td className="py-2 pr-4">Return or buy at residual value</td>
                        <td className="py-2">Keep or sell at market value</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Variables Explained */}
        <Card className="border-l-4 border-l-purple-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-purple-900">
              <Calculator className="h-6 w-6" />
              Understanding Lease Variables
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6 text-sm sm:text-base text-gray-700">
              <div>
                <h4 className="font-semibold text-lg text-purple-900 mb-2">1. Auto Price (Capitalized Cost)</h4>
                <p>
                  The <strong>capitalized cost</strong> is the price you negotiate for the vehicle, similar to 
                  negotiating a purchase price. This is the starting point for your lease calculation. Just like 
                  buying a car, you can negotiate this price down—dealers often mark up the MSRP, so research 
                  the invoice price and comparable lease deals before negotiating.
                </p>
                <p className="mt-2">
                  <strong>Tip:</strong> The lower the capitalized cost, the lower your monthly lease payments. 
                  Don't assume the advertised price is final—negotiate as you would when purchasing a vehicle.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-lg text-purple-900 mb-2">2. Money Factor (Lease Rate)</h4>
                <p>
                  The <strong>money factor</strong> is the interest rate equivalent for a lease. It's expressed 
                  as a small decimal (like 0.00208) rather than a percentage. To convert a money factor to APR, 
                  multiply it by 2,400. For example, a money factor of 0.00208 equals 5% APR (0.00208 × 2,400 = 4.992%).
                </p>
                <p className="mt-2">
                  Your credit score significantly impacts the money factor you receive. Excellent credit (740+) 
                  typically qualifies for the best rates, while lower credit scores result in higher money factors. 
                  Some luxury brands offer promotional money factors as low as 0.00001 (0.024% APR) on select models.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-lg text-purple-900 mb-2">3. Lease Term</h4>
                <p>
                  The <strong>lease term</strong> is the length of your lease agreement, typically ranging from 
                  24 to 48 months. The most common lease terms are 36 months (3 years) and 39 months. Shorter 
                  leases mean higher monthly payments but more frequent vehicle upgrades and less time outside 
                  the manufacturer's warranty. Longer leases reduce monthly payments but may result in maintenance 
                  costs if the warranty expires before the lease ends.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-lg text-purple-900 mb-2">4. Residual Value</h4>
                <p>
                  The <strong>residual value</strong> is the estimated value of the vehicle at the end of the 
                  lease term, expressed as a percentage of MSRP or a dollar amount. This is predetermined by 
                  the leasing company based on historical depreciation data for that vehicle model. A higher 
                  residual value means the vehicle depreciates less, resulting in lower monthly payments.
                </p>
                <p className="mt-2">
                  For example, if a $50,000 vehicle has a 48% residual value after 36 months, the residual is 
                  $24,000. You're only paying for the $26,000 depreciation ($50,000 - $24,000) plus interest 
                  and fees. Vehicles that hold their value well (like certain Toyota, Lexus, and Porsche models) 
                  have higher residual values and make better lease candidates.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-lg text-purple-900 mb-2">5. Down Payment and Trade-In</h4>
                <p>
                  Any <strong>down payment</strong> (also called a capitalized cost reduction) or 
                  <strong> trade-in value</strong> reduces the capitalized cost, which lowers your monthly 
                  payment. However, large down payments on leases are generally discouraged because if the 
                  vehicle is totaled or stolen early in the lease, you typically won't recover that down payment—
                  gap insurance only covers the difference between the insurance payout and the remaining lease 
                  obligation, not your down payment.
                </p>
                <p className="mt-2">
                  <strong>Strategy:</strong> Consider making minimal or zero down payment on a lease and instead 
                  use that cash for investments or emergencies. If you must lower your monthly payment, negotiate 
                  a lower capitalized cost instead of putting money down.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mileage and Usage Restrictions */}
        <Card className="border-l-4 border-l-orange-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-orange-900">
              <TrendingUp className="h-6 w-6" />
              Mileage Caps and Usage Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <p>
                One of the most important considerations in a lease is the <strong>mileage allowance</strong>. 
                Standard leases typically include 10,000, 12,000, or 15,000 miles per year. Exceeding your 
                mileage cap results in excess mileage fees at lease end, typically ranging from $0.10 to $0.30 
                per mile, though luxury vehicles can charge up to $0.50 per mile.
              </p>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 mb-3">Example Mileage Scenarios:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>
                      <strong>12,000 miles/year lease, 36 months:</strong> Total allowance = 36,000 miles. 
                      If you return with 40,000 miles at $0.20/mile penalty = $800 fee.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>
                      <strong>10,000 miles/year lease, 36 months:</strong> Total allowance = 30,000 miles. 
                      If you return with 35,000 miles at $0.25/mile penalty = $1,250 fee.
                    </span>
                  </li>
                </ul>
              </div>

              <p>
                <strong>High-Mileage Leases:</strong> If you know you'll drive more than the standard allowance, 
                negotiate a high-mileage lease upfront (15,000-18,000 miles/year). This increases your monthly 
                payment slightly but is typically cheaper than paying excess mileage fees at lease end. The 
                residual value is adjusted downward for high-mileage leases since the vehicle will have more 
                wear at lease end.
              </p>

              <p>
                <strong>Tracking Your Mileage:</strong> Monitor your mileage throughout the lease term. If you're 
                approaching your limit with time remaining, consider alternative transportation for longer trips, 
                carpooling, or public transit. Conversely, if you're well under your mileage allowance, some 
                lessees purchase a second vehicle or return the lease early to avoid "wasting" unused miles.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Wear and Tear Guidelines */}
        <Card className="border-l-4 border-l-red-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-red-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-red-900">
              <AlertCircle className="h-6 w-6" />
              Wear and Tear: What You're Responsible For
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <p>
                At lease end, the dealership will inspect the vehicle for damage beyond 
                <strong> normal wear and tear</strong>. Understanding the difference is crucial because 
                excessive wear and tear can result in significant charges—sometimes thousands of dollars.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Normal Wear and Tear (Not Charged)
                  </h4>
                  <ul className="space-y-1.5 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Minor door dings less than 1 inch in diameter</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Small scratches that don't penetrate the paint</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Minor interior stains or carpet wear</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Tire wear with at least 4/32" tread depth remaining</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Stone chips in the windshield smaller than a quarter</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Faded paint from sun exposure</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Excessive Wear (You Pay)
                  </h4>
                  <ul className="space-y-1.5 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">✗</span>
                      <span>Large dents or body damage exceeding guidelines</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">✗</span>
                      <span>Scratches that expose primer or bare metal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">✗</span>
                      <span>Large stains, burns, or tears in upholstery</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">✗</span>
                      <span>Tires with less than 4/32" tread depth</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">✗</span>
                      <span>Windshield cracks requiring replacement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">✗</span>
                      <span>Missing parts, trim pieces, or equipment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">✗</span>
                      <span>Frame or structural damage from accidents</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-amber-900 mb-2">Protecting Yourself from Wear and Tear Charges:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">1.</span>
                    <span>
                      <strong>Pre-Inspection:</strong> Schedule a pre-return inspection 2-3 months before lease 
                      end to identify and repair any excessive wear at competitive prices rather than dealer rates.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">2.</span>
                    <span>
                      <strong>Wear and Tear Insurance:</strong> Some leasing companies offer optional wear and 
                      tear coverage (typically $300-600) that waives charges up to a certain limit ($2,000-5,000).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">3.</span>
                    <span>
                      <strong>Lease Loyalty Programs:</strong> If you lease another vehicle from the same brand, 
                      many manufacturers waive minor wear and tear charges.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">4.</span>
                    <span>
                      <strong>Photograph Everything:</strong> Document the vehicle's condition with photos and 
                      videos at lease signing and throughout the term to dispute any false damage claims.
                    </span>
                  </li>
                </ul>
              </div>

              <p>
                <strong>Maintenance Requirements:</strong> Most leases require you to maintain the vehicle 
                according to the manufacturer's maintenance schedule. Keep all service records and receipts. 
                Failure to perform required maintenance (oil changes, tire rotations, inspections) can void 
                warranty coverage and result in charges for mechanical issues at lease end.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Why Lease? Pros and Cons */}
        <Card className="border-l-4 border-l-green-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-green-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-green-900">
              <DollarSign className="h-6 w-6" />
              Should You Lease? Advantages and Disadvantages
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <h4 className="font-semibold text-lg text-green-900">Advantages of Leasing:</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Lower Monthly Payments:</strong> Lease payments are typically 30-60% lower than 
                    loan payments for the same vehicle because you're only paying for depreciation during the 
                    lease term, not the full vehicle value.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Drive Newer Vehicles More Often:</strong> Lease terms typically align with 
                    manufacturer warranties (3-4 years), allowing you to always drive a car under warranty 
                    with the latest technology, safety features, and fuel efficiency.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Business Tax Deductions:</strong> If you use the vehicle for business purposes, 
                    you may be able to deduct lease payments as a business expense. Consult a tax professional 
                    for details specific to your situation.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Minimal Maintenance Concerns:</strong> Since leased vehicles are typically new and 
                    under warranty, you're protected from major repair costs. Scheduled maintenance is often 
                    included in the lease agreement or covered by the manufacturer.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>No Trade-In Hassle:</strong> At lease end, you simply return the vehicle and walk 
                    away. No need to negotiate trade-in values, list the car for sale, or deal with private buyers.
                  </div>
                </li>
              </ul>

              <h4 className="font-semibold text-lg text-red-900 mt-6">Disadvantages of Leasing:</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>No Ownership or Equity:</strong> You're making payments without building equity in 
                    the vehicle. At lease end, you have nothing to show for those payments except the use of the 
                    vehicle during that period.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Mileage Restrictions:</strong> If you drive more than average (15,000+ miles/year), 
                    excess mileage fees can make leasing expensive. Long commuters or road trip enthusiasts may 
                    find leasing impractical.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>No Customization Allowed:</strong> You cannot modify a leased vehicle. 
                    Aftermarket parts, custom paint, lift kits, or any alterations void the lease agreement and 
                    result in charges to restore the vehicle to original condition.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Potential Fees at Lease End:</strong> Excess mileage, wear and tear damage, 
                    disposition fees ($300-500), and early termination penalties can add up quickly if you're 
                    not careful.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Perpetual Payments:</strong> If you continuously lease, you'll always have a car 
                    payment. Buying and paying off a vehicle allows you to eventually have years without payments.
                  </div>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Getting Out of a Lease Early */}
        <Card className="border-l-4 border-l-indigo-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-indigo-900">
              <RefreshCw className="h-6 w-6" />
              Exiting Your Lease Early
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <p>
                Life circumstances change, and you may need to exit a lease before the term ends. Early lease 
                termination typically involves significant penalties—often equal to the remaining payments on 
                the lease—but there are several strategies to minimize costs:
              </p>

              <div className="space-y-4 mt-4">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-900 mb-2">1. Return the Vehicle to the Lessor</h4>
                  <p className="text-sm">
                    The simplest but most expensive option. You'll typically pay all remaining lease payments, 
                    plus early termination fees (often $500-1,000), plus any excess mileage or wear and tear 
                    charges. This can cost thousands of dollars and should be a last resort.
                  </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-900 mb-2">2. Lease Transfer or Swap</h4>
                  <p className="text-sm">
                    Websites like Swapalease.com and LeaseTrader.com allow you to transfer your lease to 
                    another party who takes over the remaining payments. You may need to pay a transfer fee 
                    ($300-500) to the leasing company, and you might offer incentives (first month's payment, 
                    cash bonus) to attract a buyer. Some manufacturers don't allow lease transfers, so check 
                    your agreement.
                  </p>
                  <p className="text-sm mt-2">
                    <strong>Important:</strong> Even after transfer, some leasing companies keep you liable if 
                    the new lessee defaults. Ensure you understand your continuing obligations before proceeding.
                  </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-900 mb-2">3. Purchase the Vehicle</h4>
                  <p className="text-sm">
                    Most leases include an early buyout option, allowing you to purchase the vehicle for its 
                    current residual value (which may be higher than early in the lease). If the market value 
                    exceeds the payoff amount, you could purchase and immediately resell the vehicle for a 
                    profit or break even. This strategy works best in hot used car markets or for vehicles that 
                    hold their value exceptionally well.
                  </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-900 mb-2">4. Lease Another Vehicle (Pull-Ahead Programs)</h4>
                  <p className="text-sm">
                    Many manufacturers offer "pull-ahead" programs that waive the last 1-6 months of payments 
                    if you lease a new vehicle from them. This is most common during promotional periods or for 
                    high-volume luxury brands. Check with your dealership about current pull-ahead incentives 
                    before your lease ends.
                  </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-900 mb-2">5. Negotiate with the Leasing Company</h4>
                  <p className="text-sm">
                    If you're facing financial hardship (job loss, medical emergency), contact the leasing 
                    company to explain your situation. Some companies may offer payment deferral, temporary 
                    payment reduction, or negotiate a reduced early termination fee. This is not guaranteed, 
                    but it costs nothing to ask and can save you thousands in extreme circumstances.
                  </p>
                </div>
              </div>

              <p className="mt-4">
                <strong>Prevention is Best:</strong> Before signing a lease, carefully consider your 
                circumstances over the lease term. If there's any chance you'll need to relocate, change jobs, 
                or your driving needs might change significantly, consider a shorter lease term or purchasing 
                instead to avoid costly early termination.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Example */}
        <Card className="border-l-4 border-l-teal-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-teal-900">
              <Calculator className="h-6 w-6" />
              How Lease Payments Are Calculated
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <p>
                Understanding the lease payment calculation helps you identify opportunities to negotiate better 
                terms. Here's a step-by-step breakdown using a real example:
              </p>

              <div className="bg-teal-50 border border-teal-300 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-teal-900 mb-3">Example: Leasing a $50,000 Vehicle</h4>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Vehicle MSRP:</span>
                    <span>$50,000</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Negotiated Price:</span>
                    <span>$48,000 (4% discount)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Down Payment:</span>
                    <span>$3,000</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Trade-In Value:</span>
                    <span>$2,000</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Lease Term:</span>
                    <span>36 months</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Money Factor:</span>
                    <span>0.00208 (5% APR)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Residual Value:</span>
                    <span>$24,000 (48% of MSRP)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Sales Tax:</span>
                    <span>7%</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Step-by-Step Calculation:</h4>
                <div className="space-y-3 text-sm font-mono">
                  <div>
                    <div className="font-bold text-gray-900 mb-1">Step 1: Calculate Capitalized Cost</div>
                    <div className="pl-4">Capitalized Cost = Auto Price - Down Payment - Trade-In</div>
                    <div className="pl-4">Capitalized Cost = $48,000 - $3,000 - $2,000 = $43,000</div>
                  </div>
                  
                  <div>
                    <div className="font-bold text-gray-900 mb-1">Step 2: Calculate Depreciation</div>
                    <div className="pl-4">Depreciation = Capitalized Cost - Residual Value</div>
                    <div className="pl-4">Depreciation = $43,000 - $24,000 = $19,000</div>
                  </div>
                  
                  <div>
                    <div className="font-bold text-gray-900 mb-1">Step 3: Calculate Monthly Depreciation</div>
                    <div className="pl-4">Monthly Depreciation = Depreciation ÷ Lease Term</div>
                    <div className="pl-4">Monthly Depreciation = $19,000 ÷ 36 = $527.78</div>
                  </div>
                  
                  <div>
                    <div className="font-bold text-gray-900 mb-1">Step 4: Calculate Monthly Interest</div>
                    <div className="pl-4">Monthly Interest = (Cap Cost + Residual) × Money Factor</div>
                    <div className="pl-4">Monthly Interest = ($43,000 + $24,000) × 0.00208 = $139.36</div>
                  </div>
                  
                  <div>
                    <div className="font-bold text-gray-900 mb-1">Step 5: Calculate Monthly Tax</div>
                    <div className="pl-4">Monthly Tax = (Monthly Depreciation + Monthly Interest) × Tax Rate</div>
                    <div className="pl-4">Monthly Tax = ($527.78 + $139.36) × 0.07 = $46.70</div>
                  </div>
                  
                  <div>
                    <div className="font-bold text-gray-900 mb-1">Step 6: Calculate Total Monthly Payment</div>
                    <div className="pl-4">Monthly Payment = Depreciation + Interest + Tax</div>
                    <div className="pl-4 text-teal-700 font-bold">Monthly Payment = $527.78 + $139.36 + $46.70 = $713.84</div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-amber-900 mb-2">Total Cost Analysis:</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span>Total Monthly Payments (36 × $713.84):</span>
                    <span className="font-medium">$25,698.24</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Down Payment:</span>
                    <span className="font-medium">+ $3,000.00</span>
                  </div>
                  <div className="flex justify-between border-t border-amber-300 pt-1.5 font-bold text-amber-900">
                    <span>Total Lease Cost:</span>
                    <span>$28,698.24</span>
                  </div>
                </div>
                <p className="text-xs mt-3 text-amber-800">
                  Note: Trade-in value reduces your capitalized cost but isn't an additional cash outlay, so 
                  it's not included in the total cost calculation.
                </p>
              </div>

              <p className="mt-4">
                <strong>Negotiation Opportunities:</strong> Every variable in this calculation (except sales tax 
                and usually the residual value) can potentially be negotiated. Focus on reducing the capitalized 
                cost through price negotiation and improving the money factor by shopping multiple lenders and 
                improving your credit score.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Final Tips */}
        <Card className="border-l-4 border-l-cyan-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-cyan-900">
              <Info className="h-6 w-6" />
              Smart Leasing Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm sm:text-base">
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <h4 className="font-semibold text-cyan-900 mb-2">✓ Do This</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Negotiate the capitalized cost like you would a purchase price</li>
                  <li>• Shop multiple dealerships and compare money factors</li>
                  <li>• Choose models with high residual values (check ALG or Kelley Blue Book)</li>
                  <li>• Time your lease during promotional periods (end of model year, holidays)</li>
                  <li>• Read the entire lease agreement before signing</li>
                  <li>• Keep detailed maintenance records</li>
                  <li>• Consider gap insurance if not included</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">✗ Avoid This</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Don't put excessive money down on a lease</li>
                  <li>• Don't lease if you drive more than 15,000 miles/year</li>
                  <li>• Don't skip reading the fine print about fees</li>
                  <li>• Don't assume advertised lease deals include all fees</li>
                  <li>• Don't lease if you want to customize or heavily modify</li>
                  <li>• Don't terminate early without exploring all options</li>
                  <li>• Don't neglect scheduled maintenance</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AutoLeaseCalculatorComponent;
